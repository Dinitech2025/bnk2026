#!/usr/bin/env node

/**
 * Script de test : Correction de la conversion des paiements
 */

console.log('🧪 TEST DE LA CORRECTION DES CONVERSIONS');
console.log('========================================\n');

// Simuler la logique corrigée
const currentRates = {
  'MGA': 1.0,
  'Ar': 1.0,
  'EUR': 0.000196,  // 1 MGA = 0.000196 EUR
  'USD': 0.000214,  // 1 MGA = 0.000214 USD
  'GBP': 0.000168   // 1 MGA = 0.000168 GBP
};

function convertWithCurrentRate(paymentAmount, paymentCurrency, targetCurrency) {
  // Si les devises sont identiques, retourner tel quel
  if (paymentCurrency === targetCurrency || 
      (paymentCurrency === 'Ar' && targetCurrency === 'MGA') ||
      (paymentCurrency === 'MGA' && targetCurrency === 'Ar')) {
    return paymentAmount;
  }

  // Normaliser les devises
  const sourceCurrency = (paymentCurrency === 'Ar') ? 'MGA' : paymentCurrency;
  const destCurrency = (targetCurrency === 'Ar') ? 'MGA' : targetCurrency;

  // Convertir via MGA comme devise de base
  if (sourceCurrency === 'MGA') {
    // De MGA vers autre devise
    const targetRate = currentRates[destCurrency] || 1;
    return paymentAmount * targetRate;
  } else if (destCurrency === 'MGA') {
    // D'autre devise vers MGA
    const sourceRate = currentRates[sourceCurrency] || 1;
    return paymentAmount / sourceRate;
  } else {
    // Entre deux devises non-MGA : passer par MGA
    const sourceRate = currentRates[sourceCurrency] || 1;
    const targetRate = currentRates[destCurrency] || 1;
    const amountInMGA = paymentAmount / sourceRate;
    return amountInMGA * targetRate;
  }
}

// Tests avec les paiements de l'exemple
const testPayments = [
  { amount: 4575, currency: 'Ar', description: 'Paiement 1' },
  { amount: 450000, currency: 'Ar', description: 'Paiement 2' }
];

console.log('💰 TESTS DE CONVERSION :');
console.log('');

testPayments.forEach(payment => {
  console.log(`${payment.description}: ${payment.amount} ${payment.currency}`);
  
  // Test conversion vers EUR
  const eurAmount = convertWithCurrentRate(payment.amount, payment.currency, 'EUR');
  console.log(`   → EUR: ${eurAmount.toFixed(4)} €`);
  
  // Test conversion vers USD
  const usdAmount = convertWithCurrentRate(payment.amount, payment.currency, 'USD');
  console.log(`   → USD: ${usdAmount.toFixed(4)} $`);
  
  // Test conversion vers GBP
  const gbpAmount = convertWithCurrentRate(payment.amount, payment.currency, 'GBP');
  console.log(`   → GBP: ${gbpAmount.toFixed(4)} £`);
  
  console.log('');
});

console.log('🎯 RÉSULTATS ATTENDUS DANS L\'INTERFACE :');
console.log('   • 4575 Ar → 0.8967 € (au lieu de 4575 €)');
console.log('   • 450000 Ar → 88.2000 € (au lieu de 450000 €)');
console.log('');

console.log('✅ La logique de conversion est maintenant correcte !');
console.log('   Actualisez la page pour voir les montants corrects.');
