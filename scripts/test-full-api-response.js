const fetch = require('node-fetch');

async function testFullAPIResponse() {
  try {
    console.log('🌐 Test complet de l\'API hero-banner...');
    
    const response = await fetch('http://localhost:3000/api/public/hero-banner');
    const data = await response.json();
    
    console.log('📊 Réponse API reçue:');
    console.log('✅ Status:', response.status);
    console.log('✅ Titre:', data.title);
    console.log('✅ Diaporama activé:', data.backgroundSlideshowEnabled);
    console.log('✅ Durée diaporama:', data.backgroundSlideshowDuration + 'ms');
    console.log('✅ Type de transition:', data.backgroundSlideshowTransition);
    
    if (data.backgroundImages) {
      console.log('🖼️ Images de fond:');
      console.log('   - Nombre d\'images:', data.backgroundImages.length);
      
      if (data.backgroundImages.length > 0) {
        console.log('   - Première image:', data.backgroundImages[0].title);
        console.log('   - URL:', data.backgroundImages[0].imageUrl.substring(0, 60) + '...');
        
        console.log('\n📋 Liste complète:');
        data.backgroundImages.forEach((img, index) => {
          console.log(`   ${index + 1}. ${img.title} (ordre: ${img.order})`);
        });
      }
    } else {
      console.log('❌ Aucune image de fond trouvée dans la réponse');
    }
    
    console.log('\n🎯 Test du composant:');
    console.log('- Le HeroBanner devrait maintenant utiliser le diaporama');
    console.log('- Les images devraient changer toutes les', data.backgroundSlideshowDuration/1000, 'secondes');
    console.log('- Transition:', data.backgroundSlideshowTransition);
    
  } catch (error) {
    console.error('❌ Erreur lors du test de l\'API:', error.message);
  }
}

testFullAPIResponse();
