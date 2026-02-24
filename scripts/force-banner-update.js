const http = require('http');

function makeRequest() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/public/hero-banner',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function forceBannerUpdate() {
  try {
    console.log('🔄 Forçage de la mise à jour de la bannière...');
    
    // Faire plusieurs appels pour déclencher le nettoyage
    for (let i = 0; i < 3; i++) {
      console.log(`📞 Appel ${i + 1}/3...`);
      const result = await makeRequest();
      console.log(`   - ID: ${result.id}`);
      console.log(`   - Couleur titre: ${result.titleColor}`);
      console.log(`   - Flou: ${result.backgroundBlur}px`);
      
      if (result.titleColor === '#ff0000') {
        console.log('✅ Bannière de test trouvée!');
        break;
      } else {
        console.log('⏳ Ancienne bannière encore active, nouvelle tentative...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n🎯 Test final...');
    const finalResult = await makeRequest();
    console.log('🏆 Bannière finale:');
    console.log('   - ID:', finalResult.id);
    console.log('   - Titre color:', finalResult.titleColor);
    console.log('   - Sous-titre color:', finalResult.subtitleColor);
    console.log('   - Flou:', finalResult.backgroundBlur + 'px');
    
    if (finalResult.titleColor === '#ff0000') {
      console.log('\n🎉 SUCCESS! La bannière de test est maintenant active!');
      console.log('🔗 Rafraîchissez http://localhost:3000 pour voir les couleurs vives!');
    } else {
      console.log('\n⚠️  La bannière n\'a pas encore changé. Vérifiez les logs du serveur.');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

forceBannerUpdate();
