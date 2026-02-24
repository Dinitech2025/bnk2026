const fetch = require('node-fetch')

async function testAPIs() {
  console.log('🔍 Test rapide des APIs pour la sélection automatique')
  console.log('=' .repeat(60))

  const baseUrl = 'http://localhost:3000'
  
  try {
    // Test 1: Récupérer les offres
    console.log('📋 Test des offres...')
    const offersResponse = await fetch(`${baseUrl}/api/public/offers`)
    const offers = await offersResponse.json()
    console.log(`✅ ${offers.length} offres trouvées`)
    
    if (offers.length > 0) {
      const testOffer = offers[0]
      console.log(`🎯 Offre de test: ${testOffer.name} (${testOffer.maxProfiles} profils)`)
      
      // Test 2: Récupérer les comptes pour cette plateforme
      console.log('\n👥 Test des comptes...')
      const accountsResponse = await fetch(`${baseUrl}/api/admin/streaming/accounts?platformId=${testOffer.platform.id}`)
      const accounts = await accountsResponse.json()
      console.log(`✅ ${accounts.length} comptes trouvés pour ${testOffer.platform.name}`)
      
      if (accounts.length > 0) {
        // Afficher les détails des comptes
        accounts.forEach((acc, index) => {
          console.log(`   ${index + 1}. ${acc.email}: ${acc.availableProfiles}/${acc.maxProfiles} profils libres`)
        })
        
        // Simuler l'algorithme de sélection
        const eligibleAccounts = accounts.filter(acc => acc.availableProfiles >= testOffer.maxProfiles)
        
        if (eligibleAccounts.length > 0) {
          const sortedAccounts = eligibleAccounts.sort((a, b) => {
            const diffA = a.availableProfiles - testOffer.maxProfiles
            const diffB = b.availableProfiles - testOffer.maxProfiles
            
            if (diffA !== diffB) return diffA - diffB
            return a.maxProfiles - b.maxProfiles
          })
          
          const optimalAccount = sortedAccounts[0]
          console.log(`🎯 Compte optimal sélectionné: ${optimalAccount.email}`)
          console.log(`   Efficacité: ${((testOffer.maxProfiles / optimalAccount.availableProfiles) * 100).toFixed(1)}%`)
          
          // Test 3: Récupérer les profils de ce compte
          console.log('\n👤 Test des profils...')
          const profilesResponse = await fetch(`${baseUrl}/api/admin/streaming/profiles?accountId=${optimalAccount.id}`)
          const profiles = await profilesResponse.json()
          console.log(`✅ ${profiles.length} profils trouvés`)
          
          const availableProfiles = profiles.filter(p => !p.isUsed)
          console.log(`📊 ${availableProfiles.length} profils disponibles:`)
          
          availableProfiles.forEach((profile, index) => {
            const isPrincipal = profile.name.toLowerCase().includes('principal')
            console.log(`   ${index + 1}. ${profile.name} (slot ${profile.profileSlot}) ${isPrincipal ? '👑' : ''}`)
          })
          
          // Simuler la sélection des profils
          const sortedProfiles = availableProfiles.sort((a, b) => {
            if (a.name.toLowerCase().includes('principal')) return -1
            if (b.name.toLowerCase().includes('principal')) return 1
            return a.profileSlot - b.profileSlot
          })
          
          const selectedProfiles = sortedProfiles.slice(0, testOffer.maxProfiles)
          console.log(`🎯 Profils sélectionnés automatiquement:`)
          selectedProfiles.forEach((profile, index) => {
            console.log(`   ${index + 1}. ${profile.name} 👑`)
          })
          
        } else {
          console.log('❌ Aucun compte avec suffisamment de profils disponibles')
        }
      } else {
        console.log('❌ Aucun compte trouvé pour cette plateforme')
      }
    } else {
      console.log('❌ Aucune offre trouvée')
    }
    
    console.log('\n✅ Tests terminés!')
    console.log('\n💡 Pour tester l\'interface:')
    console.log('1. Ouvrez http://localhost:3000/subscriptions')
    console.log('2. Cliquez sur "S\'abonner" pour voir la sélection automatique')
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message)
    console.log('\n💡 Assurez-vous que le serveur Next.js est démarré:')
    console.log('   npm run dev')
  }
}

testAPIs() 