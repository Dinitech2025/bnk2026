#!/usr/bin/env node

/**
 * Test simple des URLs PayPal - Version JavaScript pure
 */

console.log('🧪 TEST URLs PayPal PRODUCTION (Simple)')
console.log('=======================================')
console.log('')

// Fonction getBaseUrl réécrite en JavaScript
function getBaseUrl() {
  // En production, priorité aux variables d'environnement
  if (process.env.NODE_ENV === 'production') {
    // Netlify fournit automatiquement ces variables
    if (process.env.URL) {
      return process.env.URL // URL principale du site Netlify
    }
    if (process.env.DEPLOY_URL) {
      return process.env.DEPLOY_URL // URL de déploiement Netlify
    }
    // Fallback vers la variable configurée manuellement
    if (process.env.NEXT_PUBLIC_BASE_URL) {
      return process.env.NEXT_PUBLIC_BASE_URL
    }
    // Dernier fallback pour la production
    return 'https://boutik-naka.com'
  }
  
  // En développement, priorité à la variable d'environnement
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  
  // Fallback serveur : HTTP pour développement local
  return 'http://localhost:3000'
}

function getSecureBaseUrl() {
  const baseUrl = getBaseUrl()
  
  // Force HTTPS si on est en production ou si l'URL contient un domaine
  if (process.env.NODE_ENV === 'production' || !baseUrl.includes('localhost')) {
    return baseUrl.replace('http://', 'https://')
  }
  
  return baseUrl
}

function getPayPalReturnUrls(orderID) {
  const baseUrl = getSecureBaseUrl()
  
  return {
    returnUrl: `${baseUrl}/paypal-return?orderID=${orderID || 'ORDER_ID'}&success=true`,
    cancelUrl: `${baseUrl}/paypal-return?orderID=${orderID || 'ORDER_ID'}&success=false`
  }
}

// Simuler l'environnement de production
const originalNodeEnv = process.env.NODE_ENV
process.env.NODE_ENV = 'production'

// Test avec différentes configurations
console.log('🌐 TEST 1 - Production avec URL Netlify:')
console.log('----------------------------------------')
process.env.URL = 'https://boutik-naka.com'
process.env.DEPLOY_URL = 'https://deploy-preview-123--boutik-naka.netlify.app'

console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('URL (Netlify):', process.env.URL)
console.log('DEPLOY_URL (Netlify):', process.env.DEPLOY_URL)
console.log('')

console.log('✅ RÉSULTATS:')
console.log('getBaseUrl():', getBaseUrl())
console.log('getSecureBaseUrl():', getSecureBaseUrl())

const paypalUrls1 = getPayPalReturnUrls('ORDER_12345')
console.log('Return URL:', paypalUrls1.returnUrl)
console.log('Cancel URL:', paypalUrls1.cancelUrl)

const hasLocalhost1 = paypalUrls1.returnUrl.includes('localhost') || paypalUrls1.cancelUrl.includes('localhost')
console.log('Contient localhost?', hasLocalhost1 ? '❌ OUI' : '✅ NON')
console.log('')

// Test sans variables Netlify
console.log('🌐 TEST 2 - Production sans variables Netlify:')
console.log('-----------------------------------------------')
delete process.env.URL
delete process.env.DEPLOY_URL
delete process.env.NEXT_PUBLIC_BASE_URL

console.log('URL (Netlify):', process.env.URL || 'non défini')
console.log('DEPLOY_URL (Netlify):', process.env.DEPLOY_URL || 'non défini')
console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL || 'non défini')
console.log('')

console.log('✅ RÉSULTATS:')
console.log('getBaseUrl():', getBaseUrl())
console.log('getSecureBaseUrl():', getSecureBaseUrl())

const paypalUrls2 = getPayPalReturnUrls('ORDER_67890')
console.log('Return URL:', paypalUrls2.returnUrl)
console.log('Cancel URL:', paypalUrls2.cancelUrl)

const hasLocalhost2 = paypalUrls2.returnUrl.includes('localhost') || paypalUrls2.cancelUrl.includes('localhost')
console.log('Contient localhost?', hasLocalhost2 ? '❌ OUI' : '✅ NON')
console.log('')

// Test avec NEXT_PUBLIC_BASE_URL
console.log('🌐 TEST 3 - Production avec NEXT_PUBLIC_BASE_URL:')
console.log('--------------------------------------------------')
process.env.NEXT_PUBLIC_BASE_URL = 'https://boutik-naka.com'

console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL)
console.log('')

console.log('✅ RÉSULTATS:')
console.log('getBaseUrl():', getBaseUrl())
console.log('getSecureBaseUrl():', getSecureBaseUrl())

const paypalUrls3 = getPayPalReturnUrls('ORDER_ABCDE')
console.log('Return URL:', paypalUrls3.returnUrl)
console.log('Cancel URL:', paypalUrls3.cancelUrl)

const hasLocalhost3 = paypalUrls3.returnUrl.includes('localhost') || paypalUrls3.cancelUrl.includes('localhost')
console.log('Contient localhost?', hasLocalhost3 ? '❌ OUI' : '✅ NON')
console.log('')

// Restaurer l'environnement
process.env.NODE_ENV = originalNodeEnv

console.log('🎯 CONCLUSION:')
console.log('==============')
console.log('✅ La logique corrigée utilise maintenant:')
console.log('   1. process.env.URL (automatique sur Netlify)')
console.log('   2. process.env.DEPLOY_URL (automatique sur Netlify)')
console.log('   3. process.env.NEXT_PUBLIC_BASE_URL (manuel)')
console.log('   4. Fallback: https://boutik-naka.com')
console.log('')
console.log('🚀 PROCHAINES ÉTAPES:')
console.log('   1. Déployer les corrections sur Netlify')
console.log('   2. Vérifier les logs dans la console Netlify')
console.log('   3. Tester un paiement PayPal en production')
console.log('')
console.log('⚠️  Si le problème persiste:')
console.log('   Ajouter NEXT_PUBLIC_BASE_URL=https://boutik-naka.com dans Netlify')
