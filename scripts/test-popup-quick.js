const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPopupQuick() {
  console.log('🔍 Test rapide du popup d\'abonnements')
  console.log('=' .repeat(40))

  try {
    // 1. Récupérer une offre Netflix
    const netflixOffer = await prisma.offer.findFirst({
      include: {
        platformOffers: {
          include: {
            platform: true
          }
        }
      },
      where: {
        platformOffers: {
          some: {
            platform: {
              name: 'Netflix'
            }
          }
        }
      }
    })

    if (!netflixOffer) {
      console.log('❌ Aucune offre Netflix trouvée')
      return
    }

    console.log(`✅ Offre trouvée: ${netflixOffer.name}`)
    const platformId = netflixOffer.platformOffers[0].platform.id
    console.log(`📋 Platform ID: ${platformId}`)

    // 2. Tester l'API des comptes
    console.log('\n🔍 Test de l\'API des comptes...')
    try {
      const response = await fetch(`http://localhost:3000/api/admin/streaming/accounts?platformId=${platformId}`)
      
      if (response.ok) {
        const accounts = await response.json()
        console.log(`✅ ${accounts.length} comptes récupérés`)
        
        accounts.forEach((acc, index) => {
          console.log(`   ${index + 1}. ${acc.email} - ${acc.availableProfiles}/${acc.maxProfiles} profils disponibles`)
        })

        // 3. Tester l'API des profils pour le premier compte
        if (accounts.length > 0) {
          console.log('\n🔍 Test de l\'API des profils...')
          const firstAccount = accounts[0]
          
          const profilesResponse = await fetch(`http://localhost:3000/api/admin/streaming/profiles?accountId=${firstAccount.id}`)
          
          if (profilesResponse.ok) {
            const profiles = await profilesResponse.json()
            console.log(`✅ ${profiles.length} profils récupérés pour ${firstAccount.email}`)
            
            const availableProfiles = profiles.filter(p => !p.isUsed)
            console.log(`   - ${availableProfiles.length} profils disponibles`)
            
            availableProfiles.forEach(profile => {
              console.log(`     * ${profile.name} (Slot ${profile.profileSlot})`)
            })
          } else {
            console.log(`❌ Erreur API profils: ${profilesResponse.status}`)
          }
        }
      } else {
        console.log(`❌ Erreur API comptes: ${response.status}`)
      }
    } catch (error) {
      console.log('❌ Serveur non accessible:', error.message)
    }

    console.log('\n🎯 Instructions pour tester le popup:')
    console.log('1. Aller sur http://localhost:3000/subscriptions')
    console.log('2. Ouvrir la console du navigateur (F12)')
    console.log('3. Cliquer sur "Choisir" pour une offre Netflix')
    console.log('4. Vérifier les logs "Comptes récupérés" dans la console')
    console.log('5. Le popup devrait maintenant afficher les comptes')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPopupQuick() 