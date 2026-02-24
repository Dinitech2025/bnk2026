const fetch = require('node-fetch');

async function testSubscriptionsPage() {
  try {
    console.log('🧪 Test de la page des abonnements...\n');
    
    // Test 1: API des offres
    console.log('1️⃣ Test de l\'API /api/public/offers');
    const response = await fetch('http://localhost:3000/api/public/offers');
    
    if (!response.ok) {
      console.log(`❌ Erreur API: ${response.status} ${response.statusText}`);
      return;
    }
    
    const offers = await response.json();
    console.log(`✅ API fonctionne: ${offers.length} offres récupérées`);
    
    // Afficher un résumé des offres
    console.log('\n📊 Résumé des offres:');
    offers.forEach(offer => {
      const platformName = offer.platform?.name || 'Plateforme inconnue';
      console.log(`  • ${platformName} - ${offer.name}: ${Number(offer.price).toLocaleString()} Ar (${offer.durationText})`);
    });
    
    // Test 2: Vérifier les champs importants
    console.log('\n2️⃣ Vérification des champs nécessaires');
    const firstOffer = offers[0];
    const requiredFields = ['id', 'name', 'price', 'durationText', 'maxProfiles', 'platform'];
    
    requiredFields.forEach(field => {
      if (firstOffer[field] !== undefined) {
        console.log(`✅ ${field}: ${typeof firstOffer[field] === 'object' ? JSON.stringify(firstOffer[field]) : firstOffer[field]}`);
      } else {
        console.log(`❌ ${field}: manquant`);
      }
    });
    
    // Test 3: Vérifier les features
    console.log('\n3️⃣ Test des fonctionnalités');
    if (firstOffer.features) {
      try {
        const features = JSON.parse(firstOffer.features);
        console.log(`✅ Features parsées: ${features.length} fonctionnalités`);
        features.slice(0, 3).forEach((feature, index) => {
          console.log(`    ${index + 1}. ${feature}`);
        });
      } catch (error) {
        console.log(`❌ Erreur parsing features: ${error.message}`);
      }
    } else {
      console.log('⚠️  Pas de features définies');
    }
    
    // Test 4: Page des abonnements
    console.log('\n4️⃣ Test de la page /subscriptions');
    const pageResponse = await fetch('http://localhost:3000/subscriptions');
    
    if (pageResponse.ok) {
      const pageContent = await pageResponse.text();
      const hasTitle = pageContent.includes('Nos Abonnements Streaming');
      const hasOffersContainer = pageContent.includes('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3');
      
      console.log(`✅ Page accessible: ${pageResponse.status}`);
      console.log(`${hasTitle ? '✅' : '❌'} Titre trouvé: "Nos Abonnements Streaming"`);
      console.log(`${hasOffersContainer ? '✅' : '❌'} Container des offres trouvé`);
    } else {
      console.log(`❌ Page inaccessible: ${pageResponse.status}`);
    }
    
    console.log('\n🎉 Tests terminés !');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

testSubscriptionsPage(); 