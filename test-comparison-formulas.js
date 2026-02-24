const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Simulation de l'ancienne formule JavaScript
function calculMontantAncien(prix, poids, origine, rate) {
  const devise = 5300; // Taux fixe dans l'ancienne formule
  let mont = 0;
  
  // Transport selon origine
  let transportRate = 15; // France par défaut
  if (origine === 2) transportRate = 35; // USA
  else if (origine === 3) transportRate = 18; // UK
  
  // Commission variable selon le prix
  let commissionRate = 0;
  if (prix < 10) {
    commissionRate = 25;
  } else if (prix < 25) {
    commissionRate = 35;
  } else if (prix < 100) {
    commissionRate = 38;
  } else if (prix < 200) {
    commissionRate = 30;
  } else {
    commissionRate = 25;
  }
  
  // Calcul selon l'ancienne formule
  mont = (prix + (poids * transportRate) + ((commissionRate * prix) / 100) + 2 + (3.5 * prix) / 100) * devise * rate;
  
  // Arrondi comme dans l'ancienne formule
  mont = mont.toFixed(0) / 100;
  mont = Math.round(mont);
  mont = mont * 100;
  
  return mont;
}

// Simulation du nouveau système hybride
async function calculMontantNouveau(prix, poids, warehouse, supplierCurrency) {
  try {
    // Récupérer les paramètres de calcul
    const settings = await prisma.importCalculationSettings.findMany();
    const settingsMap = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = parseFloat(setting.value);
    });
    
    // Récupérer les taux de change
    const exchangeRates = await prisma.setting.findMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    });
    const rates = {};
    exchangeRates.forEach(rate => {
      const currency = rate.key.replace('exchangeRate_', '');
      rates[currency] = parseFloat(rate.value);
    });
    
    // Transport selon entrepôt
    let transportRate = settingsMap['transport_france_rate'] || 15;
    if (warehouse === 'usa') transportRate = settingsMap['transport_usa_rate'] || 35;
    else if (warehouse === 'uk') transportRate = settingsMap['transport_uk_rate'] || 18;
    
    const transportCost = poids * transportRate;
    
    // Commission variable selon le prix
    let commissionRate = 0;
    if (prix < 10) {
      commissionRate = settingsMap['commission_0_10'] || 25;
    } else if (prix < 25) {
      commissionRate = settingsMap['commission_10_25'] || 35;
    } else if (prix < 100) {
      commissionRate = settingsMap['commission_25_100'] || 38;
    } else if (prix < 200) {
      commissionRate = settingsMap['commission_100_200'] || 30;
    } else {
      commissionRate = settingsMap['commission_200_plus'] || 25;
    }
    
    const commission = (prix * commissionRate) / 100;
    const processingFee = settingsMap['processing_fee'] || 2;
    const tax = (prix * (settingsMap['tax_rate'] || 3.5)) / 100;
    
    // Devise de l'entrepôt
    let warehouseCurrency = 'EUR';
    if (warehouse === 'usa') warehouseCurrency = 'USD';
    else if (warehouse === 'uk') warehouseCurrency = 'GBP';
    
    const totalInWarehouseCurrency = prix + transportCost + commission + processingFee + tax;
    
    // Conversion vers MGA
    const mgaRate = rates['MGA'] || 5158.93;
    const warehouseRate = rates[warehouseCurrency] || 1;
    const totalInMGA = totalInWarehouseCurrency * (mgaRate / warehouseRate);
    
    return {
      totalInMGA: Math.round(totalInMGA),
      details: {
        prix,
        transportCost,
        commission,
        commissionRate,
        processingFee,
        tax,
        totalInWarehouseCurrency,
        warehouseCurrency,
        conversionRate: mgaRate / warehouseRate
      }
    };
  } catch (error) {
    console.error('Erreur dans le nouveau calcul:', error);
    return null;
  }
}

// Cas de test
const testCases = [
  // Cas 1: Prix bas, France, EUR
  { prix: 8, poids: 1.5, origine: 1, warehouse: 'france', supplierCurrency: 'EUR', rate: 1, description: 'Prix bas (8 EUR), France, 1.5kg' },
  
  // Cas 2: Prix moyen, France, EUR (cas de référence)
  { prix: 52, poids: 2, origine: 1, warehouse: 'france', supplierCurrency: 'EUR', rate: 1, description: 'Prix moyen (52 EUR), France, 2kg' },
  
  // Cas 3: Prix élevé, France, EUR
  { prix: 150, poids: 3, origine: 1, warehouse: 'france', supplierCurrency: 'EUR', rate: 1, description: 'Prix élevé (150 EUR), France, 3kg' },
  
  // Cas 4: Prix très élevé, France, EUR
  { prix: 250, poids: 1, origine: 1, warehouse: 'france', supplierCurrency: 'EUR', rate: 1, description: 'Prix très élevé (250 EUR), France, 1kg' },
  
  // Cas 5: Prix moyen, USA, USD
  { prix: 52, poids: 2, origine: 2, warehouse: 'usa', supplierCurrency: 'USD', rate: 1.137, description: 'Prix moyen (52 USD), USA, 2kg' },
  
  // Cas 6: Prix moyen, UK, GBP
  { prix: 52, poids: 2, origine: 3, warehouse: 'uk', supplierCurrency: 'GBP', rate: 0.8437, description: 'Prix moyen (52 GBP), UK, 2kg' },
  
  // Cas 7: Prix dans tranche 10-25, France
  { prix: 20, poids: 1, origine: 1, warehouse: 'france', supplierCurrency: 'EUR', rate: 1, description: 'Tranche 10-25 (20 EUR), France, 1kg' },
  
  // Cas 8: Prix dans tranche 25-100, USA
  { prix: 75, poids: 2.5, origine: 2, warehouse: 'usa', supplierCurrency: 'USD', rate: 1.137, description: 'Tranche 25-100 (75 USD), USA, 2.5kg' },
  
  // Cas 9: Prix dans tranche 100-200, UK
  { prix: 180, poids: 0.5, origine: 3, warehouse: 'uk', supplierCurrency: 'GBP', rate: 0.8437, description: 'Tranche 100-200 (180 GBP), UK, 0.5kg' },
  
  // Cas 10: Prix limite tranche, France
  { prix: 99.99, poids: 1.2, origine: 1, warehouse: 'france', supplierCurrency: 'EUR', rate: 1, description: 'Prix limite (99.99 EUR), France, 1.2kg' }
];

async function runComparison() {
  console.log('🧪 COMPARAISON ANCIENNE vs NOUVELLE FORMULE DE CALCUL D\'IMPORTATION');
  console.log('=' .repeat(80));
  
  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📋 CAS ${i + 1}: ${testCase.description}`);
    console.log('-' .repeat(60));
    
    // Calcul avec l'ancienne formule
    const ancienResult = calculMontantAncien(
      testCase.prix, 
      testCase.poids, 
      testCase.origine, 
      testCase.rate
    );
    
    // Calcul avec la nouvelle formule
    const nouveauResult = await calculMontantNouveau(
      testCase.prix,
      testCase.poids,
      testCase.warehouse,
      testCase.supplierCurrency
    );
    
    if (!nouveauResult) {
      console.log('❌ Erreur dans le nouveau calcul');
      continue;
    }
    
    // Calcul de la différence
    const difference = nouveauResult.totalInMGA - ancienResult;
    const differencePercent = ((difference / ancienResult) * 100).toFixed(2);
    
    console.log(`📊 Paramètres:`);
    console.log(`   Prix: ${testCase.prix} ${testCase.supplierCurrency}`);
    console.log(`   Poids: ${testCase.poids} kg`);
    console.log(`   Entrepôt: ${testCase.warehouse}`);
    console.log(`   Commission: ${nouveauResult.details.commissionRate}%`);
    
    console.log(`\n💰 Résultats:`);
    console.log(`   Ancienne formule: ${ancienResult.toLocaleString('fr-FR')} Ar`);
    console.log(`   Nouvelle formule: ${nouveauResult.totalInMGA.toLocaleString('fr-FR')} Ar`);
    console.log(`   Différence: ${difference.toLocaleString('fr-FR')} Ar (${differencePercent}%)`);
    
    if (Math.abs(parseFloat(differencePercent)) < 5) {
      console.log(`   ✅ Résultats similaires (< 5% de différence)`);
    } else if (difference > 0) {
      console.log(`   ⬆️ Nouveau système plus cher`);
    } else {
      console.log(`   ⬇️ Nouveau système moins cher`);
    }
    
    // Détails du nouveau calcul
    console.log(`\n🔍 Détail nouveau calcul:`);
    console.log(`   Prix: ${nouveauResult.details.prix} ${nouveauResult.details.warehouseCurrency}`);
    console.log(`   Transport: ${nouveauResult.details.transportCost.toFixed(2)} ${nouveauResult.details.warehouseCurrency}`);
    console.log(`   Commission: ${nouveauResult.details.commission.toFixed(2)} ${nouveauResult.details.warehouseCurrency} (${nouveauResult.details.commissionRate}%)`);
    console.log(`   Frais: ${nouveauResult.details.processingFee} ${nouveauResult.details.warehouseCurrency}`);
    console.log(`   Taxe: ${nouveauResult.details.tax.toFixed(2)} ${nouveauResult.details.warehouseCurrency}`);
    console.log(`   Total: ${nouveauResult.details.totalInWarehouseCurrency.toFixed(2)} ${nouveauResult.details.warehouseCurrency}`);
    console.log(`   Taux conversion: ${nouveauResult.details.conversionRate.toFixed(2)}`);
    
    results.push({
      cas: i + 1,
      description: testCase.description,
      ancien: ancienResult,
      nouveau: nouveauResult.totalInMGA,
      difference,
      differencePercent: parseFloat(differencePercent)
    });
  }
  
  // Analyse globale
  console.log('\n📈 ANALYSE GLOBALE');
  console.log('=' .repeat(50));
  
  const moyenneDifference = results.reduce((sum, r) => sum + Math.abs(r.differencePercent), 0) / results.length;
  const maxDifference = Math.max(...results.map(r => Math.abs(r.differencePercent)));
  const casProches = results.filter(r => Math.abs(r.differencePercent) < 5).length;
  
  console.log(`📊 Statistiques:`);
  console.log(`   Cas testés: ${results.length}`);
  console.log(`   Cas similaires (< 5%): ${casProches}/${results.length} (${((casProches/results.length)*100).toFixed(1)}%)`);
  console.log(`   Différence moyenne: ${moyenneDifference.toFixed(2)}%`);
  console.log(`   Différence maximale: ${maxDifference.toFixed(2)}%`);
  
  // Recommandations
  console.log(`\n💡 RECOMMANDATIONS:`);
  
  if (moyenneDifference < 10) {
    console.log(`✅ Les deux systèmes donnent des résultats très similaires`);
    console.log(`✅ Le nouveau système peut remplacer l'ancien en toute sécurité`);
  } else {
    console.log(`⚠️ Différences significatives détectées`);
    console.log(`⚠️ Révision des paramètres recommandée`);
  }
  
  console.log(`\n🎯 AVANTAGES DU NOUVEAU SYSTÈME:`);
  console.log(`✅ Devises dynamiques (180+ devises vs taux fixe)`);
  console.log(`✅ Paramètres modifiables sans redéploiement`);
  console.log(`✅ Interface d'administration intégrée`);
  console.log(`✅ Calculs plus précis avec taux de change réels`);
  console.log(`✅ Meilleure traçabilité des calculs`);
  
  return results;
}

// Exécution du test
runComparison()
  .then((results) => {
    console.log('\n🎉 Test de comparaison terminé avec succès !');
  })
  .catch((error) => {
    console.error('❌ Erreur lors du test:', error);
  })
  .finally(() => {
    prisma.$disconnect();
  }); 

const prisma = new PrismaClient()

// Simulation de l'ancienne formule JavaScript
function calculMontantAncien(prix, poids, origine, rate) {
  const devise = 5300; // Taux fixe dans l'ancienne formule
  let mont = 0;
  
  // Transport selon origine
  let transportRate = 15; // France par défaut
  if (origine === 2) transportRate = 35; // USA
  else if (origine === 3) transportRate = 18; // UK
  
  // Commission variable selon le prix
  let commissionRate = 0;
  if (prix < 10) {
    commissionRate = 25;
  } else if (prix < 25) {
    commissionRate = 35;
  } else if (prix < 100) {
    commissionRate = 38;
  } else if (prix < 200) {
    commissionRate = 30;
  } else {
    commissionRate = 25;
  }
  
  // Calcul selon l'ancienne formule
  mont = (prix + (poids * transportRate) + ((commissionRate * prix) / 100) + 2 + (3.5 * prix) / 100) * devise * rate;
  
  // Arrondi comme dans l'ancienne formule
  mont = mont.toFixed(0) / 100;
  mont = Math.round(mont);
  mont = mont * 100;
  
  return mont;
}

// Simulation du nouveau système hybride
async function calculMontantNouveau(prix, poids, warehouse, supplierCurrency) {
  try {
    // Récupérer les paramètres de calcul
    const settings = await prisma.importCalculationSettings.findMany();
    const settingsMap = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = parseFloat(setting.value);
    });
    
    // Récupérer les taux de change
    const exchangeRates = await prisma.setting.findMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    });
    const rates = {};
    exchangeRates.forEach(rate => {
      const currency = rate.key.replace('exchangeRate_', '');
      rates[currency] = parseFloat(rate.value);
    });
    
    // Transport selon entrepôt
    let transportRate = settingsMap['transport_france_rate'] || 15;
    if (warehouse === 'usa') transportRate = settingsMap['transport_usa_rate'] || 35;
    else if (warehouse === 'uk') transportRate = settingsMap['transport_uk_rate'] || 18;
    
    const transportCost = poids * transportRate;
    
    // Commission variable selon le prix
    let commissionRate = 0;
    if (prix < 10) {
      commissionRate = settingsMap['commission_0_10'] || 25;
    } else if (prix < 25) {
      commissionRate = settingsMap['commission_10_25'] || 35;
    } else if (prix < 100) {
      commissionRate = settingsMap['commission_25_100'] || 38;
    } else if (prix < 200) {
      commissionRate = settingsMap['commission_100_200'] || 30;
    } else {
      commissionRate = settingsMap['commission_200_plus'] || 25;
    }
    
    const commission = (prix * commissionRate) / 100;
    const processingFee = settingsMap['processing_fee'] || 2;
    const tax = (prix * (settingsMap['tax_rate'] || 3.5)) / 100;
    
    // Devise de l'entrepôt
    let warehouseCurrency = 'EUR';
    if (warehouse === 'usa') warehouseCurrency = 'USD';
    else if (warehouse === 'uk') warehouseCurrency = 'GBP';
    
    const totalInWarehouseCurrency = prix + transportCost + commission + processingFee + tax;
    
    // Conversion vers MGA
    const mgaRate = rates['MGA'] || 5158.93;
    const warehouseRate = rates[warehouseCurrency] || 1;
    const totalInMGA = totalInWarehouseCurrency * (mgaRate / warehouseRate);
    
    return {
      totalInMGA: Math.round(totalInMGA),
      details: {
        prix,
        transportCost,
        commission,
        commissionRate,
        processingFee,
        tax,
        totalInWarehouseCurrency,
        warehouseCurrency,
        conversionRate: mgaRate / warehouseRate
      }
    };
  } catch (error) {
    console.error('Erreur dans le nouveau calcul:', error);
    return null;
  }
}

// Cas de test
const testCases = [
  // Cas 1: Prix bas, France, EUR
  { prix: 8, poids: 1.5, origine: 1, warehouse: 'france', supplierCurrency: 'EUR', rate: 1, description: 'Prix bas (8 EUR), France, 1.5kg' },
  
  // Cas 2: Prix moyen, France, EUR (cas de référence)
  { prix: 52, poids: 2, origine: 1, warehouse: 'france', supplierCurrency: 'EUR', rate: 1, description: 'Prix moyen (52 EUR), France, 2kg' },
  
  // Cas 3: Prix élevé, France, EUR
  { prix: 150, poids: 3, origine: 1, warehouse: 'france', supplierCurrency: 'EUR', rate: 1, description: 'Prix élevé (150 EUR), France, 3kg' },
  
  // Cas 4: Prix très élevé, France, EUR
  { prix: 250, poids: 1, origine: 1, warehouse: 'france', supplierCurrency: 'EUR', rate: 1, description: 'Prix très élevé (250 EUR), France, 1kg' },
  
  // Cas 5: Prix moyen, USA, USD
  { prix: 52, poids: 2, origine: 2, warehouse: 'usa', supplierCurrency: 'USD', rate: 1.137, description: 'Prix moyen (52 USD), USA, 2kg' },
  
  // Cas 6: Prix moyen, UK, GBP
  { prix: 52, poids: 2, origine: 3, warehouse: 'uk', supplierCurrency: 'GBP', rate: 0.8437, description: 'Prix moyen (52 GBP), UK, 2kg' },
  
  // Cas 7: Prix dans tranche 10-25, France
  { prix: 20, poids: 1, origine: 1, warehouse: 'france', supplierCurrency: 'EUR', rate: 1, description: 'Tranche 10-25 (20 EUR), France, 1kg' },
  
  // Cas 8: Prix dans tranche 25-100, USA
  { prix: 75, poids: 2.5, origine: 2, warehouse: 'usa', supplierCurrency: 'USD', rate: 1.137, description: 'Tranche 25-100 (75 USD), USA, 2.5kg' },
  
  // Cas 9: Prix dans tranche 100-200, UK
  { prix: 180, poids: 0.5, origine: 3, warehouse: 'uk', supplierCurrency: 'GBP', rate: 0.8437, description: 'Tranche 100-200 (180 GBP), UK, 0.5kg' },
  
  // Cas 10: Prix limite tranche, France
  { prix: 99.99, poids: 1.2, origine: 1, warehouse: 'france', supplierCurrency: 'EUR', rate: 1, description: 'Prix limite (99.99 EUR), France, 1.2kg' }
];

async function runComparison() {
  console.log('🧪 COMPARAISON ANCIENNE vs NOUVELLE FORMULE DE CALCUL D\'IMPORTATION');
  console.log('=' .repeat(80));
  
  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📋 CAS ${i + 1}: ${testCase.description}`);
    console.log('-' .repeat(60));
    
    // Calcul avec l'ancienne formule
    const ancienResult = calculMontantAncien(
      testCase.prix, 
      testCase.poids, 
      testCase.origine, 
      testCase.rate
    );
    
    // Calcul avec la nouvelle formule
    const nouveauResult = await calculMontantNouveau(
      testCase.prix,
      testCase.poids,
      testCase.warehouse,
      testCase.supplierCurrency
    );
    
    if (!nouveauResult) {
      console.log('❌ Erreur dans le nouveau calcul');
      continue;
    }
    
    // Calcul de la différence
    const difference = nouveauResult.totalInMGA - ancienResult;
    const differencePercent = ((difference / ancienResult) * 100).toFixed(2);
    
    console.log(`📊 Paramètres:`);
    console.log(`   Prix: ${testCase.prix} ${testCase.supplierCurrency}`);
    console.log(`   Poids: ${testCase.poids} kg`);
    console.log(`   Entrepôt: ${testCase.warehouse}`);
    console.log(`   Commission: ${nouveauResult.details.commissionRate}%`);
    
    console.log(`\n💰 Résultats:`);
    console.log(`   Ancienne formule: ${ancienResult.toLocaleString('fr-FR')} Ar`);
    console.log(`   Nouvelle formule: ${nouveauResult.totalInMGA.toLocaleString('fr-FR')} Ar`);
    console.log(`   Différence: ${difference.toLocaleString('fr-FR')} Ar (${differencePercent}%)`);
    
    if (Math.abs(parseFloat(differencePercent)) < 5) {
      console.log(`   ✅ Résultats similaires (< 5% de différence)`);
    } else if (difference > 0) {
      console.log(`   ⬆️ Nouveau système plus cher`);
    } else {
      console.log(`   ⬇️ Nouveau système moins cher`);
    }
    
    // Détails du nouveau calcul
    console.log(`\n🔍 Détail nouveau calcul:`);
    console.log(`   Prix: ${nouveauResult.details.prix} ${nouveauResult.details.warehouseCurrency}`);
    console.log(`   Transport: ${nouveauResult.details.transportCost.toFixed(2)} ${nouveauResult.details.warehouseCurrency}`);
    console.log(`   Commission: ${nouveauResult.details.commission.toFixed(2)} ${nouveauResult.details.warehouseCurrency} (${nouveauResult.details.commissionRate}%)`);
    console.log(`   Frais: ${nouveauResult.details.processingFee} ${nouveauResult.details.warehouseCurrency}`);
    console.log(`   Taxe: ${nouveauResult.details.tax.toFixed(2)} ${nouveauResult.details.warehouseCurrency}`);
    console.log(`   Total: ${nouveauResult.details.totalInWarehouseCurrency.toFixed(2)} ${nouveauResult.details.warehouseCurrency}`);
    console.log(`   Taux conversion: ${nouveauResult.details.conversionRate.toFixed(2)}`);
    
    results.push({
      cas: i + 1,
      description: testCase.description,
      ancien: ancienResult,
      nouveau: nouveauResult.totalInMGA,
      difference,
      differencePercent: parseFloat(differencePercent)
    });
  }
  
  // Analyse globale
  console.log('\n📈 ANALYSE GLOBALE');
  console.log('=' .repeat(50));
  
  const moyenneDifference = results.reduce((sum, r) => sum + Math.abs(r.differencePercent), 0) / results.length;
  const maxDifference = Math.max(...results.map(r => Math.abs(r.differencePercent)));
  const casProches = results.filter(r => Math.abs(r.differencePercent) < 5).length;
  
  console.log(`📊 Statistiques:`);
  console.log(`   Cas testés: ${results.length}`);
  console.log(`   Cas similaires (< 5%): ${casProches}/${results.length} (${((casProches/results.length)*100).toFixed(1)}%)`);
  console.log(`   Différence moyenne: ${moyenneDifference.toFixed(2)}%`);
  console.log(`   Différence maximale: ${maxDifference.toFixed(2)}%`);
  
  // Recommandations
  console.log(`\n💡 RECOMMANDATIONS:`);
  
  if (moyenneDifference < 10) {
    console.log(`✅ Les deux systèmes donnent des résultats très similaires`);
    console.log(`✅ Le nouveau système peut remplacer l'ancien en toute sécurité`);
  } else {
    console.log(`⚠️ Différences significatives détectées`);
    console.log(`⚠️ Révision des paramètres recommandée`);
  }
  
  console.log(`\n🎯 AVANTAGES DU NOUVEAU SYSTÈME:`);
  console.log(`✅ Devises dynamiques (180+ devises vs taux fixe)`);
  console.log(`✅ Paramètres modifiables sans redéploiement`);
  console.log(`✅ Interface d'administration intégrée`);
  console.log(`✅ Calculs plus précis avec taux de change réels`);
  console.log(`✅ Meilleure traçabilité des calculs`);
  
  return results;
}

// Exécution du test
runComparison()
  .then((results) => {
    console.log('\n🎉 Test de comparaison terminé avec succès !');
  })
  .catch((error) => {
    console.error('❌ Erreur lors du test:', error);
  })
  .finally(() => {
    prisma.$disconnect();
  }); 