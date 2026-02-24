const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

async function testSettingsAPI() {
  try {
    console.log('🧪 Test de l\'API /api/settings...\n')
    
    const response = await fetch('http://localhost:3000/api/settings')
    
    if (!response.ok) {
      console.log(`❌ Erreur HTTP: ${response.status} ${response.statusText}`)
      return
    }
    
    const data = await response.json()
    
    console.log('✅ API /api/settings fonctionne!\n')
    console.log('📋 Paramètres retournés:')
    
    // Afficher les paramètres de logo spécifiquement
    const logoKeys = ['siteName', 'logoUrl', 'useSiteLogo', 'faviconUrl', 'adminLogoUrl']
    
    logoKeys.forEach(key => {
      if (data.hasOwnProperty(key)) {
        console.log(`🖼️  ${key}: "${data[key] || 'NULL'}"`)
      } else {
        console.log(`❌ ${key}: NON TROUVÉ`)
      }
    })
    
    console.log(`\n📊 Total des paramètres: ${Object.keys(data).length}`)
    
  } catch (error) {
    console.error('❌ Erreur lors du test de l\'API:', error.message)
  }
}

// Attendre quelques secondes puis tester
setTimeout(testSettingsAPI, 5000) 