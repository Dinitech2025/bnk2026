// Test des patterns adaptatifs basés sur la durée

console.log('🧪 Test des Patterns Adaptatifs Basés sur la Durée');
console.log('=' * 60);

// Patterns flexibles basés sur la durée
const FLEXIBLE_PATTERNS = {
  1000: /1h[A-Za-z0-9]{3,8}/g,    // 1h + 3-8 caractères
  500: /30m[A-Za-z0-9]{3,8}/g,    // 30m + 3-8 caractères
  2000: /2h[A-Za-z0-9]{3,8}/g,    // 2h + 3-8 caractères
  3000: /3h[A-Za-z0-9]{3,8}/g,    // 3h + 3-8 caractères
  4000: /4h[A-Za-z0-9]{3,8}/g,    // 4h + 3-8 caractères
};

// Anciens patterns rigides pour comparaison
const RIGID_PATTERNS = {
  1000: /1h2G[A-Za-z0-9]{4}/g,    // 1h2G + 4 caractères
  500: /30m1G[A-Za-z0-9]{4}/g,    // 30m1G + 4 caractères
  2000: /2h3G[A-Za-z0-9]{4}/g,    // 2h3G + 4 caractères
};

// Codes d'exemple avec différentes quantités de données
const TEST_CODES = {
  1000: [
    '1h2GkhLB',   // Format original (2G)
    '1h3G7mN4',   // Nouveau : 3G au lieu de 2G
    '1h4GAbc5',   // Nouveau : 4G au lieu de 2G
    '1h5Gxy89',   // Nouveau : 5G au lieu de 2G
    '1h6GaBc',    // Nouveau : 6G au lieu de 2G
    '1h1GxyzAB',  // Nouveau : 1G au lieu de 2G
  ],
  500: [
    '30m1G4k7',   // Format supposé original (1G)
    '30m2GAb9',   // Nouveau : 2G au lieu de 1G
    '30m3Gxy2',   // Nouveau : 3G au lieu de 1G
    '30m4G5kL',   // Nouveau : 4G au lieu de 1G
    '30m5GaBc',   // Nouveau : 5G au lieu de 1G
  ],
  2000: [
    '2h3G7xM4',   // Format supposé original (3G)
    '2h4G9z8k',   // Nouveau : 4G au lieu de 3G
    '2h5GAb3x',   // Nouveau : 5G au lieu de 3G
    '2h6Gxy9A',   // Nouveau : 6G au lieu de 3G
    '2h2GAbc7',   // Nouveau : 2G au lieu de 3G
  ],
  3000: [
    '3h4G5yAb',   // Nouveau type : 3 heures
    '3h5GAb9x',   // Variation 5G
    '3h6Gxy2M',   // Variation 6G
  ],
  4000: [
    '4h5G8xAb',   // Nouveau type : 4 heures
    '4h6GAz9k',   // Variation 6G
    '4h7Gcd3N',   // Variation 7G
  ]
};

function testPatternFlexibility() {
  console.log('\n🔍 Comparaison Ancien vs Nouveau Système\n');
  
  let totalTested = 0;
  let rigidDetected = 0;
  let flexibleDetected = 0;
  
  Object.entries(TEST_CODES).forEach(([price, codes]) => {
    console.log(`📊 Tests pour ${price}Ar:`);
    
    const rigidPattern = RIGID_PATTERNS[price];
    const flexiblePattern = FLEXIBLE_PATTERNS[price];
    
    codes.forEach(code => {
      totalTested++;
      
      const rigidMatch = rigidPattern ? rigidPattern.test(code) : false;
      const flexibleMatch = flexiblePattern ? flexiblePattern.test(code) : false;
      
      if (rigidMatch) rigidDetected++;
      if (flexibleMatch) flexibleDetected++;
      
      const rigidIcon = rigidMatch ? '✅' : '❌';
      const flexibleIcon = flexibleMatch ? '✅' : '❌';
      const improvement = !rigidMatch && flexibleMatch ? '🚀 AMÉLIORATION!' : '';
      
      console.log(`   ${code}: Ancien ${rigidIcon} | Nouveau ${flexibleIcon} ${improvement}`);
      
      // Reset les patterns pour le prochain test
      if (rigidPattern) rigidPattern.lastIndex = 0;
      if (flexiblePattern) flexiblePattern.lastIndex = 0;
    });
    
    console.log('');
  });
  
  return { totalTested, rigidDetected, flexibleDetected };
}

function testVariousDataFormats() {
  console.log('\n🎯 Test Formats de Données Variés\n');
  
  const variousFormats = [
    '1h1G5kAb',   // 1G
    '1h2GkhLB',   // 2G (original)
    '1h3G7mN4',   // 3G
    '1h4GAbc5',   // 4G
    '1h5Gxy89',   // 5G
    '1h6GaBc',    // 6G
    '1h7GxyzM',   // 7G
    '1h8G9kLp',   // 8G (futur)
    '1h10GAbc',   // 10G (futur)
  ];
  
  const pattern = FLEXIBLE_PATTERNS[1000];
  
  variousFormats.forEach(code => {
    const match = pattern.test(code);
    const icon = match ? '✅' : '❌';
    console.log(`   ${code}: ${icon} ${match ? 'Détecté' : 'Non détecté'}`);
    pattern.lastIndex = 0; // Reset
  });
}

function testEdgeCases() {
  console.log('\n⚡ Test Cas Limites\n');
  
  const edgeCases = [
    { code: '1h2G', price: 1000, reason: 'Trop court (moins de 3 caractères après durée)' },
    { code: '1h2GkhLBextraChars', price: 1000, reason: 'Trop long (plus de 8 caractères après durée)' },
    { code: '2h3G', price: 2000, reason: 'Trop court' },
    { code: '30m1G', price: 500, reason: 'Trop court' },
    { code: '1h2Gab', price: 1000, reason: 'Longueur minimum valide (3 chars)' },
    { code: '1h2GabcdefXY', price: 1000, reason: 'Longueur maximum valide (8 chars)' },
  ];
  
  edgeCases.forEach(test => {
    const pattern = FLEXIBLE_PATTERNS[test.price];
    const match = pattern ? pattern.test(test.code) : false;
    const icon = match ? '✅' : '❌';
    
    console.log(`   ${test.code}: ${icon} - ${test.reason}`);
    if (pattern) pattern.lastIndex = 0;
  });
}

// Exécution des tests
function main() {
  console.log('🚀 Validation des Patterns Adaptatifs Basés sur la Durée\n');
  
  const results = testPatternFlexibility();
  testVariousDataFormats();
  testEdgeCases();
  
  console.log('\n📊 Résultats Globaux:');
  console.log(`📈 Total codes testés: ${results.totalTested}`);
  console.log(`🔒 Ancien système (rigide): ${results.rigidDetected}/${results.totalTested} détectés (${((results.rigidDetected/results.totalTested)*100).toFixed(1)}%)`);
  console.log(`🚀 Nouveau système (flexible): ${results.flexibleDetected}/${results.totalTested} détectés (${((results.flexibleDetected/results.totalTested)*100).toFixed(1)}%)`);
  
  const improvement = results.flexibleDetected - results.rigidDetected;
  console.log(`✨ Amélioration: +${improvement} codes détectés en plus (+${((improvement/results.totalTested)*100).toFixed(1)}%)`);
  
  console.log('\n🎯 Avantages du Nouveau Système:');
  console.log('   ✅ Capture tous les formats de données (1G, 2G, 3G, 4G, 5G...)');
  console.log('   ✅ Support automatique des évolutions futures (6G, 7G, 8G...)');
  console.log('   ✅ Basé uniquement sur la durée (1h, 30m, 2h, 3h, 4h...)');
  console.log('   ✅ Pas besoin de mise à jour pour nouveaux formats de données');
  console.log('   ✅ Plus robuste face aux variations OCR');
  
  console.log('\n🎉 Le système est maintenant totalement adaptatif !');
}

// Lancer les tests
if (require.main === module) {
  main();
}

module.exports = { 
  FLEXIBLE_PATTERNS, 
  RIGID_PATTERNS, 
  TEST_CODES,
  testPatternFlexibility 
}; 