const fs = require('fs');
const { extractCodesFromPDF } = require('./extract-500ar-real-codes.js');

console.log('🧪 Test d\'extraction OCR automatique générique');
console.log('='* 50);

async function testOCRExtraction() {
  try {
    // Test avec différents types de PDFs
    const testCases = [
      { file: 'pdfs/500Ar2.pdf', price: 500, expected: 'Codes 30min/1GiB' },
      { file: 'pdfs/1000ar.pdf', price: 1000, expected: 'Codes 1h/2GiB' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📄 Test: ${testCase.file}`);
      console.log(`💰 Prix: ${testCase.price}Ar`);
      console.log(`🎯 Attendu: ${testCase.expected}`);
      
      if (!fs.existsSync(testCase.file)) {
        console.log(`⚠️ Fichier non trouvé: ${testCase.file} - Ignoré`);
        continue;
      }
      
      try {
        console.log('🔄 Lancement de l\'extraction...');
        const startTime = Date.now();
        
        const codes = await extractCodesFromPDF(testCase.file, testCase.price);
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        console.log(`✅ Extraction terminée en ${duration}s`);
        console.log(`📊 Résultats: ${codes.length} codes extraits`);
        
        if (codes.length > 0) {
          console.log(`🎫 Échantillon: ${codes.slice(0, 5).join(', ')}`);
          
          // Analyser les patterns des codes
          const patterns = analyzeCodes(codes);
          console.log('📋 Patterns détectés:');
          Object.entries(patterns).forEach(([pattern, count]) => {
            console.log(`   ${pattern}: ${count} codes`);
          });
        } else {
          console.log('⚠️ Aucun code extrait');
        }
        
      } catch (error) {
        console.error(`❌ Erreur extraction: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Test terminé!');
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
  }
}

// Fonction pour analyser les patterns de codes
function analyzeCodes(codes) {
  const patterns = {};
  
  codes.forEach(code => {
    let pattern = 'Autre';
    
    if (/^1h2G/.test(code)) {
      pattern = '1h2G (1000Ar)';
    } else if (/^30m1G/.test(code)) {
      pattern = '30m1G (500Ar)';
    } else if (/^2h3G/.test(code)) {
      pattern = '2h3G (2000Ar)';
    } else if (/^20m/.test(code)) {
      pattern = '20m (300Ar)';
    } else if (/^[A-Za-z0-9]{6,8}$/.test(code)) {
      pattern = `Générique (${code.length} chars)`;
    }
    
    patterns[pattern] = (patterns[pattern] || 0) + 1;
  });
  
  return patterns;
}

// Fonction de test rapide des dépendances
function checkDependencies() {
  console.log('📦 Vérification des dépendances...');
  
  const deps = [
    { name: 'pdf2pic', module: 'pdf2pic' },
    { name: 'ocr-space-api-wrapper', module: 'ocr-space-api-wrapper' }
  ];
  
  let allGood = true;
  
  for (const dep of deps) {
    try {
      require(dep.module);
      console.log(`✅ ${dep.name}: OK`);
    } catch (error) {
      console.log(`❌ ${dep.name}: Manquant`);
      console.log(`   Installation: npm install ${dep.module}`);
      allGood = false;
    }
  }
  
  if (!allGood) {
    console.log('\n⚠️ Installez les dépendances manquantes avant de continuer');
    return false;
  }
  
  return true;
}

// Exécution principale
async function main() {
  console.log('🔧 Vérification du système d\'extraction OCR générique');
  
  if (!checkDependencies()) {
    process.exit(1);
  }
  
  console.log('\n🚀 Lancement des tests...');
  await testOCRExtraction();
}

// Lancer si exécuté directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testOCRExtraction, analyzeCodes }; 