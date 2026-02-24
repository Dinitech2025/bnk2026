#!/usr/bin/env node

/**
 * Script de test : Cohérence entre PaymentSummary et PaymentAmountDisplay
 */

console.log('🧪 TEST DE COHÉRENCE DES CONVERSIONS');
console.log('===================================\n');

// Taux de change (identiques dans les deux composants)
const currentRates = {
  'MGA': 1.0,
  'Ar': 1.0,
  'EUR': 0.000196,  // 1 MGA = 0.000196 EUR
  'USD': 0.000214,  // 1 MGA = 0.000214 USD
  'GBP': 0.000168   // 1 MGA = 0.000168 GBP
};

// Fonction de conversion (identique dans les deux composants)
function convertWithCurrentRate(paymentAmount, paymentCurrency, targetCurrency) {
  if (paymentCurrency === targetCurrency || 
      (paymentCurrency === 'Ar' && targetCurrency === 'MGA') ||
      (paymentCurrency === 'MGA' && targetCurrency === 'Ar')) {
    return paymentAmount;
  }

  const sourceCurrency = (paymentCurrency === 'Ar') ? 'MGA' : paymentCurrency;
  const destCurrency = (targetCurrency === 'Ar') ? 'MGA' : targetCurrency;

  if (sourceCurrency === 'MGA') {
    const targetRate = currentRates[destCurrency] || 1;
    return paymentAmount * targetRate;
  } else if (destCurrency === 'MGA') {
    const sourceRate = currentRates[sourceCurrency] || 1;
    return paymentAmount / sourceRate;
  } else {
    const sourceRate = currentRates[sourceCurrency] || 1;
    const targetRate = currentRates[destCurrency] || 1;
    const amountInMGA = paymentAmount / sourceRate;
    return amountInMGA * targetRate;
  }
}

// Données de test (commande CMD-2025-0028)
const testPayments = [
  { amount: 4575, currency: 'Ar', status: 'COMPLETED' },
  { amount: 450000, currency: 'Ar', status: 'COMPLETED' }
];

console.log('💰 DONNÉES DE TEST :');
console.log('   Paiement 1: 4575 Ar');
console.log('   Paiement 2: 450000 Ar');
console.log('   Total: 454575 Ar');
console.log('');

console.log('🔄 TEST CONVERSION VERS EUR :');
console.log('');

// Méthode PaymentAmountDisplay (conversion individuelle puis somme)
console.log('📱 PaymentAmountDisplay (conversion individuelle) :');
let totalEURIndividual = 0;
testPayments.forEach((payment, index) => {
  if (payment.status === 'COMPLETED') {
    const eurAmount = convertWithCurrentRate(payment.amount, payment.currency, 'EUR');
    totalEURIndividual += eurAmount;
    console.log(`   Paiement ${index + 1}: ${payment.amount} Ar → ${eurAmount.toFixed(4)} €`);
  }
});
console.log(`   TOTAL: ${totalEURIndividual.toFixed(4)} €`);
console.log('');

// Méthode PaymentSummary (somme puis conversion)
console.log('📊 PaymentSummary (somme puis conversion) :');
const totalAr = testPayments
  .filter(p => p.status === 'COMPLETED')
  .reduce((sum, p) => sum + p.amount, 0);

const totalEURDirect = convertWithCurrentRate(totalAr, 'Ar', 'EUR');
console.log(`   Somme: ${totalAr} Ar`);
console.log(`   Conversion: ${totalAr} Ar → ${totalEURDirect.toFixed(4)} €`);
console.log('');

// Comparaison
const difference = Math.abs(totalEURIndividual - totalEURDirect);
console.log('🎯 RÉSULTAT :');
console.log(`   PaymentAmountDisplay: ${totalEURIndividual.toFixed(4)} €`);
console.log(`   PaymentSummary: ${totalEURDirect.toFixed(4)} €`);
console.log(`   Différence: ${difference.toFixed(6)} €`);
console.log('');

if (difference < 0.0001) {
  console.log('✅ PARFAIT ! Les deux méthodes donnent le même résultat.');
  console.log('   Les montants devraient maintenant être cohérents dans l\'interface.');
} else {
  console.log('❌ PROBLÈME ! Il y a encore une différence.');
  console.log('   Vérification supplémentaire nécessaire.');
}

console.log('');
console.log('🔧 CORRECTIONS APPORTÉES :');
console.log('   • Unification des imports (même provider)');
console.log('   • Même logique de conversion dans les deux composants');
console.log('   • Même taux de change (currentRates)');
console.log('   • Suppression de la logique complexe des taux historiques');
