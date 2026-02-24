const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestAccounts() {
  console.log('🏗️  Création de comptes de test pour les plateformes')
  console.log('=' .repeat(50))

  try {
    // Récupérer les plateformes
    const platforms = await prisma.platform.findMany({
      where: {
        isActive: true
      }
    })
    
    console.log(`📋 ${platforms.length} plateformes trouvées`)

    const testAccounts = [
      // Netflix
      {
        platformName: 'Netflix',
        accounts: [
          {
            username: 'netflix_test1',
            email: 'netflix1@test.com',
            password: 'password123',
            maxProfiles: 4,
            profileNames: ['Principal', 'Enfants', 'Invité', 'Backup']
          },
          {
            username: 'netflix_test2',
            email: 'netflix2@test.com',
            password: 'password123',
            maxProfiles: 2,
            profileNames: ['Principal', 'Invité']
          }
        ]
      },
      // Spotify
      {
        platformName: 'Spotify',
        accounts: [
          {
            username: 'spotify_test1',
            email: 'spotify1@test.com',
            password: 'password123',
            maxProfiles: 6,
            profileNames: ['Principal', 'Famille 1', 'Famille 2', 'Famille 3', 'Famille 4', 'Famille 5']
          }
        ]
      },
      // Disney+
      {
        platformName: 'Disney+',
        accounts: [
          {
            username: 'disney_test1',
            email: 'disney1@test.com',
            password: 'password123',
            maxProfiles: 4,
            profileNames: ['Principal', 'Enfants', 'Ados', 'Invité']
          }
        ]
      },
      // Amazon Prime Video
      {
        platformName: 'Amazon Prime Video',
        accounts: [
          {
            username: 'amazon_test1',
            email: 'amazon1@test.com',
            password: 'password123',
            maxProfiles: 6,
            profileNames: ['Principal', 'Famille 1', 'Famille 2', 'Famille 3', 'Famille 4', 'Famille 5']
          }
        ]
      },
      // YouTube Premium
      {
        platformName: 'YouTube Premium',
        accounts: [
          {
            username: 'youtube_test1',
            email: 'youtube1@test.com',
            password: 'password123',
            maxProfiles: 6,
            profileNames: ['Principal', 'Famille 1', 'Famille 2', 'Famille 3', 'Famille 4', 'Famille 5']
          }
        ]
      }
    ]

    for (const platformData of testAccounts) {
      const platform = platforms.find(p => p.name === platformData.platformName)
      
      if (!platform) {
        console.log(`⚠️  Plateforme ${platformData.platformName} non trouvée`)
        continue
      }

      console.log(`\n🎯 Création de comptes pour ${platform.name}...`)

      for (const accountData of platformData.accounts) {
        // Vérifier si le compte existe déjà
        const existingAccount = await prisma.account.findFirst({
          where: {
            email: accountData.email,
            platformId: platform.id
          }
        })

        if (existingAccount) {
          console.log(`   ⏭️  Compte ${accountData.email} existe déjà`)
          continue
        }

        // Créer le compte
        const account = await prisma.account.create({
          data: {
            platformId: platform.id,
            username: accountData.username,
            email: accountData.email,
            password: accountData.password,
            status: 'ACTIVE',
            availability: true,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 an
          }
        })

        console.log(`   ✅ Compte créé: ${account.email}`)

        // Créer les profils
        for (let i = 0; i < accountData.maxProfiles; i++) {
          const profileName = accountData.profileNames[i] || `Profil ${i + 1}`
          
          await prisma.accountProfile.create({
            data: {
              accountId: account.id,
              name: profileName,
              profileSlot: i + 1,
              isAssigned: false
            }
          })
        }

        console.log(`   👤 ${accountData.maxProfiles} profils créés`)
      }
    }

    // Résumé final
    console.log('\n📊 Résumé final:')
    const totalAccounts = await prisma.account.count({
      where: { status: 'ACTIVE' }
    })
    const totalProfiles = await prisma.accountProfile.count()
    const availableProfiles = await prisma.accountProfile.count({
      where: { isAssigned: false }
    })

    console.log(`   - ${totalAccounts} comptes actifs`)
    console.log(`   - ${totalProfiles} profils au total`)
    console.log(`   - ${availableProfiles} profils disponibles`)

    // Grouper par plateforme
    const accountsByPlatform = await prisma.account.groupBy({
      by: ['platformId'],
      where: { status: 'ACTIVE' },
      _count: { id: true }
    })

    console.log('\n   Répartition par plateforme:')
    for (const group of accountsByPlatform) {
      const platform = platforms.find(p => p.id === group.platformId)
      console.log(`   - ${platform?.name}: ${group._count.id} compte(s)`)
    }

    console.log('\n✅ Création des comptes de test terminée!')

  } catch (error) {
    console.error('❌ Erreur lors de la création des comptes:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestAccounts() 