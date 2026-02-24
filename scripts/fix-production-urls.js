#!/usr/bin/env node

/**
 * Script pour diagnostiquer et corriger les URLs de production
 * Problème: PayPal utilise localhost au lieu de l'URL de production
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 DIAGNOSTIC URLs DE PRODUCTION')
console.log('=================================')
console.log('')

// 1. Vérifier les variables d'environnement actuelles
console.log('📋 VARIABLES D\'ENVIRONNEMENT ACTUELLES:')
console.log('----------------------------------------')
console.log('NODE_ENV:', process.env.NODE_ENV || 'non défini')
console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL || 'non défini')
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'non défini')
console.log('PAYPAL_MODE:', process.env.PAYPAL_MODE || 'non défini')
console.log('')

// 2. Tester la fonction getBaseUrl
console.log('🧪 TEST DE LA FONCTION getBaseUrl():')
console.log('------------------------------------')

// Simuler différents environnements
const originalNodeEnv = process.env.NODE_ENV
const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL

// Test 1: Production sans NEXT_PUBLIC_BASE_URL
process.env.NODE_ENV = 'production'
delete process.env.NEXT_PUBLIC_BASE_URL

try {
  const { getBaseUrl, getSecureBaseUrl, getPayPalReturnUrls } = require('../lib/utils/get-base-url.ts')
  
  console.log('✅ Test 1 - Production sans NEXT_PUBLIC_BASE_URL:')
  console.log('   getBaseUrl():', getBaseUrl())
  console.log('   getSecureBaseUrl():', getSecureBaseUrl())
  console.log('   PayPal Return URLs:', getPayPalReturnUrls('TEST123'))
  console.log('')
  
  // Test 2: Production avec NEXT_PUBLIC_BASE_URL
  process.env.NEXT_PUBLIC_BASE_URL = 'https://boutik-naka.com'
  
  console.log('✅ Test 2 - Production avec NEXT_PUBLIC_BASE_URL:')
  console.log('   getBaseUrl():', getBaseUrl())
  console.log('   getSecureBaseUrl():', getSecureBaseUrl())
  console.log('   PayPal Return URLs:', getPayPalReturnUrls('TEST123'))
  console.log('')
  
} catch (error) {
  console.error('❌ Erreur lors du test:', error.message)
}

// Restaurer les variables d'environnement
process.env.NODE_ENV = originalNodeEnv
if (originalBaseUrl) {
  process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl
}

// 3. Recommandations pour Netlify
console.log('🚀 RECOMMANDATIONS POUR NETLIFY:')
console.log('=================================')
console.log('')
console.log('📝 Variables d\'environnement à configurer dans Netlify:')
console.log('--------------------------------------------------------')
console.log('NEXT_PUBLIC_BASE_URL=https://boutik-naka.com')
console.log('NEXTAUTH_URL=https://boutik-naka.com')
console.log('NODE_ENV=production')
console.log('')

// 4. Vérifier si on est sur Netlify
if (process.env.NETLIFY) {
  console.log('🌐 DÉTECTION NETLIFY:')
  console.log('---------------------')
  console.log('✅ Exécution sur Netlify détectée')
  console.log('URL du site:', process.env.URL || 'non défini')
  console.log('URL de déploiement:', process.env.DEPLOY_URL || 'non défini')
  console.log('Contexte:', process.env.CONTEXT || 'non défini')
  console.log('')
} else {
  console.log('💻 Exécution en local')
  console.log('')
}

// 5. Créer un fichier de configuration pour Netlify
const netlifyEnvConfig = `# Variables d'environnement pour Netlify
# À configurer dans: Site settings > Environment variables

NEXT_PUBLIC_BASE_URL=https://boutik-naka.com
NEXTAUTH_URL=https://boutik-naka.com
NODE_ENV=production

# PayPal Production (à remplacer par vos vraies clés de production)
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=YOUR_PRODUCTION_PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_PRODUCTION_PAYPAL_CLIENT_SECRET
NEXT_PUBLIC_PAYPAL_CLIENT_ID=YOUR_PRODUCTION_PAYPAL_CLIENT_ID

# Base de données et autres variables existantes...
# (garder vos variables actuelles)`

fs.writeFileSync('NETLIFY-ENV-CONFIG.txt', netlifyEnvConfig)

console.log('📄 FICHIER CRÉÉ: NETLIFY-ENV-CONFIG.txt')
console.log('---------------------------------------')
console.log('Ce fichier contient la configuration recommandée pour Netlify.')
console.log('')

console.log('🎯 ÉTAPES SUIVANTES:')
console.log('====================')
console.log('1. Aller sur Netlify Dashboard > Site settings > Environment variables')
console.log('2. Ajouter: NEXT_PUBLIC_BASE_URL=https://boutik-naka.com')
console.log('3. Ajouter: NEXTAUTH_URL=https://boutik-naka.com')
console.log('4. Redéployer le site')
console.log('5. Tester PayPal en production')
console.log('')

console.log('⚠️  IMPORTANT:')
console.log('- Remplacer les clés PayPal sandbox par les clés de production')
console.log('- Configurer PAYPAL_MODE=live pour la production')
console.log('- Tester d\'abord avec de petits montants')
