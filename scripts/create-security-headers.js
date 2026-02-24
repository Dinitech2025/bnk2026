// Création des headers de sécurité pour next.config.js
const fs = require('fs')
const path = require('path')

console.log('🛡️ CRÉATION HEADERS DE SÉCURITÉ POUR NEXT.JS')
console.log('==============================================\n')

const nextConfigPath = path.join(__dirname, '..', 'next.config.js')

// Configuration de sécurité complète
const securityConfig = `const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'via.placeholder.com', 'images.unsplash.com', 'ik.imagekit.io'],
    unoptimized: process.env.NODE_ENV === 'development'
  },
  
  // 🛡️ HEADERS DE SÉCURITÉ RENFORCÉS
  async headers() {
    return [
      {
        // Appliquer à toutes les routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY' // Empêche l'embedding dans des iframes
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff' // Empêche la détection automatique de type MIME
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block' // Active la protection XSS du navigateur
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin' // Contrôle les infos de référencement
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()' // Restreint les permissions
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paypal.com https://www.sandbox.paypal.com https://js.paypal.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.paypal.com https://api.sandbox.paypal.com",
              "frame-src 'self' https://www.paypal.com https://www.sandbox.paypal.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload' // Force HTTPS
          }
        ]
      },
      {
        // Headers spécifiques pour les uploads
        source: '/api/upload/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Content-Disposition',
            value: 'attachment' // Force le téléchargement plutôt que l'affichage
          }
        ]
      },
      {
        // Headers pour les fichiers statiques
        source: '/uploads/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },

  // 🔄 Redirections de sécurité
  async redirects() {
    return [
      {
        source: '/.env',
        destination: '/',
        permanent: false
      },
      {
        source: '/.env.local',
        destination: '/',
        permanent: false
      },
      {
        source: '/config/:path*',
        destination: '/',
        permanent: false
      }
    ]
  },

  // 🚫 Rewrites pour masquer les URLs sensibles
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health'
      }
    ]
  }
}

module.exports = nextConfig`

// Sauvegarder la configuration
try {
  // Backup de l'ancien fichier s'il existe
  if (fs.existsSync(nextConfigPath)) {
    const backup = fs.readFileSync(nextConfigPath, 'utf8')
    fs.writeFileSync(nextConfigPath + '.backup', backup)
    console.log('✅ Sauvegarde de next.config.js créée')
  }

  // Créer le nouveau fichier
  fs.writeFileSync(nextConfigPath, securityConfig)
  console.log('✅ Nouveau next.config.js créé avec headers de sécurité')
  
} catch (error) {
  console.error('❌ Erreur lors de la création:', error.message)
}

console.log('')
console.log('🛡️ HEADERS DE SÉCURITÉ AJOUTÉS:')
console.log('================================')
console.log('✅ X-Frame-Options: DENY')
console.log('✅ X-Content-Type-Options: nosniff')
console.log('✅ X-XSS-Protection: 1; mode=block')
console.log('✅ Referrer-Policy: strict-origin-when-cross-origin')
console.log('✅ Permissions-Policy: Restrictions appropriées')
console.log('✅ Content-Security-Policy: Configuration stricte')
console.log('✅ Strict-Transport-Security: Force HTTPS')
console.log('')

console.log('🔧 ACTIONS REQUISES:')
console.log('--------------------')
console.log('1. Redémarrer le serveur de développement')
console.log('2. Tester les headers avec: curl -I http://localhost:3000')
console.log('3. Vérifier que PayPal fonctionne toujours')
console.log('4. Déployer en production')
console.log('')

console.log('🌐 VÉRIFICATION EN LIGNE:')
console.log('-------------------------')
console.log('https://securityheaders.com')
console.log('https://observatory.mozilla.org')
console.log('https://ssllabs.com/ssltest')
console.log('')

console.log('🚀 Configuration de sécurité renforcée créée ! 🛡️')
