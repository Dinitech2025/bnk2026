const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testSubscriptionPopup() {
  console.log('🧪 Test du système de popup d\'abonnements')
  console.log('=' .repeat(50))

  try {
    // 1. Vérifier les offres
    console.log('\n1️⃣ Test des offres d\'abonnement...')
    const offers = await prisma.offer.findMany({
      include: {
        platformOffers: {
          include: {
            platform: true
          }
        }
      }
    })
    console.log(`✅ ${offers.length} offres trouvées`)
    
    if (offers.length > 0) {
      const firstOffer = offers[0]
      const platformName = firstOffer.platformOffers[0]?.platform?.name || 'Aucune plateforme'
      console.log(`   - Première offre: ${firstOffer.name} (${platformName})`)
    }

    // 2. Vérifier les comptes
    console.log('\n2️⃣ Test des comptes de streaming...')
    const accounts = await prisma.account.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        platform: true
      }
    })
    console.log(`✅ ${accounts.length} comptes actifs trouvés`)
    
    // Grouper par plateforme
    const accountsByPlatform = accounts.reduce((acc, account) => {
      const platformName = account.platform?.name || 'Inconnu'
      if (!acc[platformName]) acc[platformName] = 0
      acc[platformName]++
      return acc
    }, {})
    
    Object.entries(accountsByPlatform).forEach(([platform, count]) => {
      console.log(`   - ${platform}: ${count} compte(s)`)
    })

    // 3. Vérifier les profils
    console.log('\n3️⃣ Test des profils...')
    const profiles = await prisma.accountProfile.findMany({
      include: {
        account: {
          include: {
            platform: true
          }
        }
      }
    })
    console.log(`✅ ${profiles.length} profils trouvés`)
    
    const availableProfiles = profiles.filter(p => !p.isAssigned)
    console.log(`   - ${availableProfiles.length} profils disponibles`)
    console.log(`   - ${profiles.length - availableProfiles.length} profils assignés`)

    // 4. Test d'une API spécifique
    if (offers.length > 0 && accounts.length > 0) {
      console.log('\n4️⃣ Test de l\'API des comptes par plateforme...')
      const firstOffer = offers[0]
      const firstPlatformId = firstOffer.platformOffers[0]?.platform?.id
      
      if (firstPlatformId) {
        const platformAccounts = await prisma.account.findMany({
          where: {
            platformId: firstPlatformId,
            status: 'ACTIVE'
          },
          include: {
            platform: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true
              }
            }
          }
        })
        console.log(`✅ ${platformAccounts.length} comptes trouvés pour ${firstOffer.platformOffers[0]?.platform?.name}`)
        
        if (platformAccounts.length > 0) {
          const firstAccount = platformAccounts[0]
          console.log(`   - Premier compte: ${firstAccount.email || firstAccount.username}`)
          
          // Test des profils pour ce compte
          const accountProfiles = await prisma.accountProfile.findMany({
            where: {
              accountId: firstAccount.id
            }
          })
          console.log(`   - ${accountProfiles.length} profils pour ce compte`)
          console.log(`   - ${accountProfiles.filter(p => !p.isAssigned).length} profils disponibles`)
        }
      }
    }

    // 5. Simulation d'une réservation
    console.log('\n5️⃣ Simulation d\'une réservation...')
    if (offers.length > 0 && accounts.length > 0) {
      const offer = offers[0]
      const platformId = offer.platformOffers[0]?.platform?.id
      const account = accounts.find(a => a.platformId === platformId)
      
      if (account) {
        const accountProfiles = await prisma.accountProfile.findMany({
          where: {
            accountId: account.id,
            isAssigned: false
          }
        })
        
        if (accountProfiles.length > 0) {
          console.log('✅ Simulation réussie:')
          console.log(`   - Offre: ${offer.name}`)
          console.log(`   - Compte: ${account.email || account.username}`)
          console.log(`   - Profils disponibles: ${accountProfiles.length}`)
          console.log(`   - Max profils offre: ${offer.maxProfiles}`)
          
          const selectedProfiles = accountProfiles.slice(0, Math.min(offer.maxProfiles, accountProfiles.length))
          console.log(`   - Profils sélectionnables: ${selectedProfiles.length}`)
          selectedProfiles.forEach(profile => {
            console.log(`     * ${profile.name} (Slot ${profile.profileSlot})`)
          })
        } else {
          console.log('⚠️  Aucun profil disponible pour ce compte')
        }
      } else {
        console.log('⚠️  Aucun compte disponible pour cette plateforme')
      }
    }

    // 6. Test de l'API publique des offres
    console.log('\n6️⃣ Test de l\'API publique des offres...')
    try {
      const response = await fetch('http://localhost:3000/api/public/offers')
      if (response.ok) {
        const publicOffers = await response.json()
        console.log(`✅ API publique: ${publicOffers.length} offres récupérées`)
        if (publicOffers.length > 0) {
          const firstPublicOffer = publicOffers[0]
          console.log(`   - Première offre publique: ${firstPublicOffer.name}`)
          console.log(`   - Prix: ${firstPublicOffer.price} Ar`)
          console.log(`   - Durée: ${firstPublicOffer.durationText}`)
          console.log(`   - Plateforme: ${firstPublicOffer.platform?.name}`)
        }
      } else {
        console.log(`⚠️  API publique non accessible (${response.status})`)
      }
    } catch (error) {
      console.log('⚠️  Serveur de développement non démarré')
    }

    console.log('\n✅ Tests terminés avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSubscriptionPopup() 