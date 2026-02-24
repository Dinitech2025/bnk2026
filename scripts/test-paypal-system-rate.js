#!/usr/bin/env node

// Test de la conversion PayPal avec le taux système
const { defaultExchangeRates } = require('../lib/utils.js');

console.log('🧪 TEST CONVERSION PAYPAL AVEC TAUX SYSTÈME');
console.log('===========================================');
console.log('');

// Données de test
const testAmount = 25168000; // Ar (montant de l'image)
const systemEurRate = defaultExchangeRates['EUR']; // 0.000196

console.log('📊 CONFIGURATION SYSTÈME :');
console.log('   • Taux EUR système :', systemEurRate);
console.log('   • Équivalent : 1 EUR =', Math.round(1/systemEurRate), 'MGA');
console.log('');

console.log('💰 TEST DE CONVERSION :');
console.log('   • Montant original :', testAmount.toLocaleString(), 'Ar');
console.log('');

// Ancien calcul (hardcodé)
const oldConversion = (testAmount / 5000).toFixed(2);
console.log('❌ ANCIEN CALCUL (hardcodé) :');
console.log('   • ' + testAmount.toLocaleString() + ' Ar ÷ 5000 = ' + oldConversion + ' EUR');
console.log('');

// Nouveau calcul (système)
const newConversion = (testAmount * systemEurRate).toFixed(2);
console.log('✅ NOUVEAU CALCUL (système) :');
console.log('   • ' + testAmount.toLocaleString() + ' Ar × ' + systemEurRate + ' = ' + newConversion + ' EUR');
console.log('');

// Comparaison avec PayPal
const paypalRate = 27.45; // Taux affiché dans l'image
console.log('🔍 COMPARAISON :');
console.log('   • Taux PayPal (ancien) :', paypalRate, 'EUR');
console.log('   • Taux système (nouveau) :', newConversion, 'EUR');
console.log('   • Différence :', (parseFloat(newConversion) - paypalRate).toFixed(2), 'EUR');
console.log('');

console.log('🎯 RÉSULTAT ATTENDU :');
console.log('   • PayPal devrait maintenant afficher :', newConversion, 'EUR');
console.log('   • Au lieu de :', paypalRate, 'EUR');
console.log('');

console.log('✅ AVANTAGES :');
console.log('   • Cohérence avec le système de conversion');
console.log('   • Taux centralisé et configurable');
console.log('   • Évite les écarts de change');

