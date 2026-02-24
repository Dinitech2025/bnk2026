#!/usr/bin/env node

/**
 * Script pour tester les URLs PayPal en production
 * Vérifie que PayPal utilise les bonnes URLs de retour
 */

console.log('🧪 TEST URLs PayPal PRODUCTION')
console.log('==============================')
console.log('')

// Simuler l'environnement de production
const originalNodeEnv = process.env.NODE_ENV
process.env.NODE_ENV = 'production'

// Simuler les variables Netlify
process.env.URL = 'https://boutik-naka.com'
process.env.DEPLOY_URL = 'https://deploy-preview-123--boutik-naka.netlify.app'
process.env.NETLIFY = 'true'

console.log('🌐 ENVIRONNEMENT SIMULÉ:')
console.log('------------------------')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('URL (Netlify):', process.env.URL)
console.log('DEPLOY_URL (Netlify):', process.env.DEPLOY_URL)
console.log('NETLIFY:', process.env.NETLIFY)
console.log('')

try {
  // Importer les fonctions après avoir configuré l'environnement
  const { getBaseUrl, getSecureBaseUrl, getPayPalReturnUrls } = require('../lib/utils/get-base-url.ts')
  
  console.log('✅ RÉSULTATS DES FONCTIONS:')
  console.log('---------------------------')
  console.log('getBaseUrl():', getBaseUrl())
  console.log('getSecureBaseUrl():', getSecureBaseUrl())
  console.log('')
  
  const paypalUrls = getPayPalReturnUrls('ORDER_12345')
  console.log('🔗 URLs PayPal générées:')
  console.log('------------------------')
  console.log('Return URL:', paypalUrls.returnUrl)
  console.log('Cancel URL:', paypalUrls.cancelUrl)
  console.log('')
  
  // Vérifier que les URLs ne contiennent pas localhost
  const hasLocalhost = paypalUrls.returnUrl.includes('localhost') || paypalUrls.cancelUrl.includes('localhost')
  
  if (hasLocalhost) {
    console.log('❌ PROBLÈME DÉTECTÉ:')
    console.log('--------------------')
    console.log('Les URLs PayPal contiennent encore "localhost"')
    console.log('Cela causera des erreurs en production.')
  } else {
    console.log('✅ URLS CORRECTES:')
    console.log('------------------')
    console.log('Les URLs PayPal utilisent le domaine de production.')
  }
  
} catch (error) {
  console.error('❌ Erreur lors du test:', error.message)
  console.error('Stack:', error.stack)
}

// Restaurer l'environnement
process.env.NODE_ENV = originalNodeEnv

console.log('')
console.log('🎯 RECOMMANDATIONS:')
console.log('===================')
console.log('1. Vérifier que NODE_ENV=production sur Netlify')
console.log('2. Les variables URL et DEPLOY_URL sont automatiques sur Netlify')
console.log('3. Si le problème persiste, ajouter NEXT_PUBLIC_BASE_URL manuellement')
console.log('4. Redéployer après modification des variables d\'environnement')
console.log('')

console.log('📋 COMMANDES UTILES:')
console.log('====================')
console.log('# Tester en local:')
console.log('node scripts/test-paypal-production-urls.js')
console.log('')
console.log('# Diagnostiquer les URLs:')
console.log('node scripts/fix-production-urls.js')
console.log('')
console.log('# Vérifier la configuration PayPal:')
console.log('node scripts/debug-paypal.js')
