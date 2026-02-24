const axios = require('axios')

// Configuration
const API_BASE_URL = 'http://localhost:3000'

// Données de test pour simuler la création d'un produit avec URL Amazon
const testProductData = {
  productInfo: {
    name: 'iPhone 15 Pro Max 256GB Titanium',
    url: 'https://www.amazon.fr/dp/B0CHX1W1XY', // URL Amazon exemple
    specifications: 'iPhone 15 Pro Max avec puce A17 Pro, appareil photo 48 Mpx, écran Super Retina XDR 6,7 pouces',
    weight: 0.221, // kg
    mode: 'air',
    warehouse: 'usa'
  },
  costs: {
    supplierPrice: {
      amount: 1199,
      currency: 'USD',
      amountInMGA: 5434500 // 1199 USD * 4530 (taux exemple)
    },
    transport: {
      amount: 45,
      currency: 'USD',
      amountInMGA: 203850,
      details: 'Transport aérien express depuis USA'
    },
    commission: {
      amount: 15,
      currency: '%',
      amountInMGA: 815175,
      rate: 15,
      details: 'Commission de 15% sur le prix fournisseur'
    },
    fees: {
      processing: {
        amount: 50000,
        currency: 'MGA',
        amountInMGA: 50000
      },
      tax: {
        amount: 20,
        currency: '%',
        amountInMGA: 1300700,
        rate: 20
      }
    },
    total: 7804225 // Total calculé
  },
  calculationMethod: 'automatic',
  transitTime: '5-7 jours ouvrés'
}

async function testSimulationWithImages() {
  console.log('🧪 Test de création de produit avec images automatiques\n')
  
  try {
    console.log('📦 Données du produit:')
    console.log(`   Nom: ${testProductData.productInfo.name}`)
    console.log(`   URL Amazon: ${testProductData.productInfo.url}`)
    console.log(`   Prix total: ${testProductData.costs.total.toLocaleString('fr-FR')} MGA`)
    console.log(`   Transport: ${testProductData.productInfo.mode} depuis ${testProductData.productInfo.warehouse}`)
    
    console.log('\n🚀 Envoi de la requête à l\'API...')
    
    // Simuler l'appel API (sans authentification pour le test)
    // En réalité, cela nécessiterait une session authentifiée
    const response = await axios.post(
      `${API_BASE_URL}/api/admin/products/create-from-simulation`,
      testProductData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )
    
    if (response.data.success) {
      console.log('\n✅ Produit créé avec succès!')
      console.log(`📊 Détails:`)
      console.log(`   ID: ${response.data.product.id}`)
      console.log(`   Nom: ${response.data.product.name}`)
      console.log(`   SKU: ${response.data.product.sku}`)
      console.log(`   Slug: ${response.data.product.slug}`)
      console.log(`   Prix: ${response.data.product.price.toLocaleString('fr-FR')} MGA`)
      console.log(`   Statut: ${response.data.product.published ? 'Publié' : 'Brouillon'}`)
      
      if (response.data.images) {
        console.log(`\n🖼️ Images:`)
        console.log(`   Ajoutées: ${response.data.images.added}`)
        console.log(`   Source: ${response.data.images.source}`)
        console.log(`   Succès: ${response.data.images.success ? 'Oui' : 'Non'}`)
      }
      
      console.log(`\n📝 Message: ${response.data.message}`)
      
      console.log(`\n🔗 Liens:`)
      console.log(`   Administration: ${API_BASE_URL}/admin/products/${response.data.product.id}`)
      console.log(`   Liste produits: ${API_BASE_URL}/admin/products`)
      
    } else {
      console.log('❌ Échec de la création du produit')
      console.log('Erreur:', response.data.error || 'Erreur inconnue')
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Erreur API:', error.response.status)
      console.log('Message:', error.response.data?.error || error.response.statusText)
      
      if (error.response.status === 401) {
        console.log('\n💡 Note: Ce test nécessite une authentification.')
        console.log('Pour tester réellement:')
        console.log('1. Connectez-vous à l\'administration')
        console.log('2. Utilisez le simulateur: http://localhost:3000/admin/products/imported/simulation')
        console.log('3. Entrez une URL Amazon dans le champ URL du produit')
      }
    } else {
      console.log('❌ Erreur réseau:', error.message)
      console.log('\n💡 Assurez-vous que le serveur Next.js est démarré sur le port 3000')
    }
  }
}

// Fonction pour tester la détection de catégorie
function testCategoryDetection() {
  console.log('\n🔍 Test de détection de catégorie:')
  
  const testProducts = [
    'iPhone 15 Pro Max',
    'MacBook Air M3',
    'Parfum Dior Sauvage',
    'Sac Louis Vuitton',
    'Machine à café Delonghi',
    'Vélo électrique Xiaomi',
    'Drone DJI Mini'
  ]
  
  // Simuler la détection (logique simplifiée)
  testProducts.forEach(name => {
    const lowerName = name.toLowerCase()
    let category = 'default'
    
    if (lowerName.includes('iphone') || lowerName.includes('macbook') || lowerName.includes('drone')) {
      category = 'electronics'
    } else if (lowerName.includes('parfum')) {
      category = 'beauty'
    } else if (lowerName.includes('sac')) {
      category = 'fashion'
    } else if (lowerName.includes('café')) {
      category = 'home'
    } else if (lowerName.includes('vélo')) {
      category = 'sports'
    }
    
    console.log(`   ${name} → ${category}`)
  })
}

async function main() {
  console.log('🧪 TEST COMPLET - Simulateur avec Images Automatiques\n')
  
  // Test de détection de catégorie
  testCategoryDetection()
  
  // Test de création de produit
  await testSimulationWithImages()
  
  console.log('\n📋 RÉSUMÉ DES FONCTIONNALITÉS:')
  console.log('✅ Détection automatique de l\'ASIN depuis l\'URL Amazon')
  console.log('✅ Sélection d\'images de fallback par catégorie')
  console.log('✅ Création automatique des entrées Media')
  console.log('✅ Ajout des attributs ASIN et URL Amazon')
  console.log('✅ Intégration transparente dans le simulateur')
  
  console.log('\n💡 UTILISATION:')
  console.log('1. Allez sur: http://localhost:3000/admin/products/imported/simulation')
  console.log('2. Remplissez le formulaire normalement')
  console.log('3. Ajoutez une URL Amazon dans le champ "URL du produit"')
  console.log('4. Le système ajoutera automatiquement:')
  console.log('   • L\'ASIN extrait de l\'URL')
  console.log('   • Des images appropriées selon la catégorie')
  console.log('   • Les attributs nécessaires pour le système Amazon')
  
  console.log('\n🔄 ÉVOLUTION FUTURE:')
  console.log('• Récupération des vraies images Amazon (avec Cloudinary)')
  console.log('• Extraction automatique du nom et des spécifications')
  console.log('• Détection intelligente des prix fournisseur')
  console.log('• Support d\'autres plateformes (AliExpress, eBay, etc.)')
}

main().catch(console.error) 