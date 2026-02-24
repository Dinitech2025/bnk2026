// Vérification rapide des variables d'environnement PayPal
require('dotenv').config({ path: '.env.local' })

console.log('🔍 Vérification variables d\'environnement PayPal\n')

const vars = {
  'PAYPAL_CLIENT_ID': process.env.PAYPAL_CLIENT_ID,
  'NEXT_PUBLIC_PAYPAL_CLIENT_ID': process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
  'PAYPAL_CLIENT_SECRET': process.env.PAYPAL_CLIENT_SECRET,
  'PAYPAL_ENVIRONMENT': process.env.PAYPAL_ENVIRONMENT || 'sandbox (défaut)'
}

Object.entries(vars).forEach(([key, value]) => {
  const status = value ? '✅ Définie' : '❌ Manquante'
  const preview = value ? `(${value.substring(0, 10)}...)` : ''
  console.log(`${key}: ${status} ${preview}`)
})

const hasMinimalConfig = vars.PAYPAL_CLIENT_ID && vars.PAYPAL_CLIENT_SECRET
console.log(`\n💳 Configuration PayPal: ${hasMinimalConfig ? '✅ Complète' : '❌ Incomplète'}`)

if (!hasMinimalConfig) {
  console.log('\n📝 Pour configurer PayPal, créez/modifiez .env.local:')
  console.log('PAYPAL_CLIENT_ID=your_sandbox_client_id_here')
  console.log('PAYPAL_CLIENT_SECRET=your_sandbox_secret_here')
  console.log('PAYPAL_ENVIRONMENT=sandbox')
  console.log('\n📚 Guide: https://developer.paypal.com/developer/applications/')
}