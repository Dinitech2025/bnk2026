const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Simuler l'algorithme de sélection automatique
function findOptimalAccount(accounts, requiredProfiles) {
  if (accounts.length === 0) return null

  // Filtrer les comptes qui ont assez de profils disponibles
  const eligibleAccounts = accounts.filter(acc => acc.availableProfiles >= requiredProfiles)
  
  if (eligibleAccounts.length === 0) return null

  // Trier par pertinence :
  // 1. Priorité aux comptes avec le nombre de profils libres le plus proche (mais >= requis)
  // 2. En cas d'égalité, privilégier le compte avec le moins de profils totaux (optimisation)
  const sortedAccounts = eligibleAccounts.sort((a, b) => {
    const diffA = a.availableProfiles - requiredProfiles
    const diffB = b.availableProfiles - requiredProfiles
    
    if (diffA !== diffB) {
      return diffA - diffB // Plus proche = meilleur
    }
    
    // En cas d'égalité, privilégier le compte avec moins de profils totaux
    return a.maxProfiles - b.maxProfiles
  })

  return sortedAccounts[0]
}

function selectOptimalProfiles(profiles, requiredCount) {
  const availableProfiles = profiles.filter(profile => !profile.isUsed)
  
  if (availableProfiles.length < requiredCount) return []

  // Trier les profils par priorité
  const sortedProfiles = availableProfiles.sort((a, b) => {
    // Le profil "Principal" en premier
    if (a.name.toLowerCase().includes('principal')) return -1
    if (b.name.toLowerCase().includes('principal')) return 1
    
    // Sinon par ordre de slot
    return a.profileSlot - b.profileSlot
  })

  return sortedProfiles.slice(0, requiredCount)
}

async function testAutoSelection() {
  console.log('🤖 Test de l\'algorithme de sélection automatique')
  console.log('=' .repeat(50))

  try {
    // Récupérer toutes les offres
    const offers = await prisma.offer.findMany({
      include: {
        platformOffers: {
          include: {
            platform: true
          }
        }
      }
    })

    console.log(`📋 ${offers.length} offres trouvées\n`)

    for (const offer of offers) {
      const platform = offer.platformOffers[0]?.platform
      if (!platform) continue

      console.log(`🎯 Test pour: ${offer.name} (${platform.name})`)
      console.log(`   Profils requis: ${offer.maxProfiles}`)

      // Récupérer les comptes pour cette plateforme
      const accounts = await prisma.account.findMany({
        where: {
          platformId: platform.id,
          status: 'ACTIVE'
        },
        include: {
          accountProfiles: true
        }
      })

      // Calculer les profils disponibles
      const accountsWithAvailability = accounts.map(account => ({
        ...account,
        availableProfiles: account.accountProfiles.filter(p => !p.isAssigned).length,
        maxProfiles: account.accountProfiles.length
      }))

      console.log(`   Comptes disponibles: ${accountsWithAvailability.length}`)
      
      if (accountsWithAvailability.length === 0) {
        console.log('   ❌ Aucun compte disponible\n')
        continue
      }

      // Afficher tous les comptes
      accountsWithAvailability.forEach((acc, index) => {
        console.log(`   ${index + 1}. ${acc.email}: ${acc.availableProfiles}/${acc.maxProfiles} profils libres`)
      })

      // Trouver le compte optimal
      const optimalAccount = findOptimalAccount(accountsWithAvailability, offer.maxProfiles)

      if (optimalAccount) {
        console.log(`   ✅ Compte optimal: ${optimalAccount.email}`)
        console.log(`      Raison: ${optimalAccount.availableProfiles} profils libres (besoin: ${offer.maxProfiles})`)
        
        // Calculer l'efficacité
        const efficiency = (offer.maxProfiles / optimalAccount.availableProfiles) * 100
        console.log(`      Efficacité: ${efficiency.toFixed(1)}% (moins de gaspillage = mieux)`)

        // Tester la sélection des profils
        const profiles = optimalAccount.accountProfiles.map(p => ({
          id: p.id,
          name: p.name,
          profileSlot: p.profileSlot,
          isUsed: p.isAssigned
        }))

        const selectedProfiles = selectOptimalProfiles(profiles, offer.maxProfiles)
        console.log(`   👤 Profils sélectionnés: ${selectedProfiles.map(p => p.name).join(', ')}`)
      } else {
        console.log('   ❌ Aucun compte avec suffisamment de profils')
      }

      console.log('') // Ligne vide
    }

    // Test de scénarios spécifiques
    console.log('🧪 Tests de scénarios spécifiques')
    console.log('-'.repeat(30))

    const testScenarios = [
      {
        name: 'Offre 1 profil',
        requiredProfiles: 1,
        accounts: [
          { email: 'compte1@test.com', availableProfiles: 1, maxProfiles: 4 },
          { email: 'compte2@test.com', availableProfiles: 2, maxProfiles: 6 },
          { email: 'compte3@test.com', availableProfiles: 3, maxProfiles: 4 }
        ]
      },
      {
        name: 'Offre 2 profils',
        requiredProfiles: 2,
        accounts: [
          { email: 'compte1@test.com', availableProfiles: 2, maxProfiles: 4 },
          { email: 'compte2@test.com', availableProfiles: 3, maxProfiles: 6 },
          { email: 'compte3@test.com', availableProfiles: 2, maxProfiles: 2 }
        ]
      },
      {
        name: 'Offre 4 profils',
        requiredProfiles: 4,
        accounts: [
          { email: 'compte1@test.com', availableProfiles: 4, maxProfiles: 6 },
          { email: 'compte2@test.com', availableProfiles: 5, maxProfiles: 6 },
          { email: 'compte3@test.com', availableProfiles: 4, maxProfiles: 4 }
        ]
      }
    ]

    testScenarios.forEach(scenario => {
      console.log(`\n📝 Scénario: ${scenario.name}`)
      console.log(`   Profils requis: ${scenario.requiredProfiles}`)
      
      scenario.accounts.forEach((acc, index) => {
        console.log(`   ${index + 1}. ${acc.email}: ${acc.availableProfiles}/${acc.maxProfiles} profils`)
      })

      const optimal = findOptimalAccount(scenario.accounts, scenario.requiredProfiles)
      if (optimal) {
        const waste = optimal.availableProfiles - scenario.requiredProfiles
        console.log(`   🎯 Choix optimal: ${optimal.email}`)
        console.log(`   📊 Gaspillage: ${waste} profil${waste > 1 ? 's' : ''} non utilisé${waste > 1 ? 's' : ''}`)
      } else {
        console.log('   ❌ Aucun compte compatible')
      }
    })

    console.log('\n✅ Tests terminés!')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAutoSelection() 