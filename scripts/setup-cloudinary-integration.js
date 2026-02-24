const { execSync } = require('child_process')
const fs = require('fs')

console.log('🚀 Configuration de l\'intégration Cloudinary...')
console.log('=' .repeat(60))

// 1. Installer Cloudinary
console.log('📦 Installation de Cloudinary...')
try {
  execSync('npm install cloudinary', { stdio: 'inherit' })
  console.log('✅ Cloudinary installé avec succès')
} catch (error) {
  console.error('❌ Erreur lors de l\'installation de Cloudinary:', error.message)
  process.exit(1)
}

// 2. Vérifier les variables d'environnement
console.log('\n🔧 Vérification des variables d\'environnement...')

const envPath = '.env.local'
let envContent = ''

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8')
}

const requiredVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY', 
  'CLOUDINARY_API_SECRET'
]

const missingVars = requiredVars.filter(varName => 
  !envContent.includes(varName) && !process.env[varName]
)

if (missingVars.length > 0) {
  console.log('⚠️ Variables d\'environnement manquantes:')
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`)
  })
  
  console.log('\n📝 Ajout des variables d\'environnement au fichier .env.local...')
  
  const newVars = `
# Configuration Cloudinary pour les images de produits
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
`
  
  fs.appendFileSync(envPath, newVars)
  console.log('✅ Variables ajoutées au fichier .env.local')
  
  console.log('\n🔑 Configuration requise:')
  console.log('1. Créez un compte sur https://cloudinary.com')
  console.log('2. Récupérez vos identifiants depuis le dashboard')
  console.log('3. Remplacez les valeurs dans .env.local:')
  console.log('   - CLOUDINARY_CLOUD_NAME=votre_cloud_name')
  console.log('   - CLOUDINARY_API_KEY=votre_api_key')
  console.log('   - CLOUDINARY_API_SECRET=votre_api_secret')
  
} else {
  console.log('✅ Toutes les variables d\'environnement sont configurées')
}

// 3. Tester la configuration
console.log('\n🧪 Test de la configuration...')

try {
  const { v2: cloudinary } = require('cloudinary')
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  
  if (process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET &&
      !process.env.CLOUDINARY_CLOUD_NAME.includes('your_') &&
      !process.env.CLOUDINARY_API_KEY.includes('your_') &&
      !process.env.CLOUDINARY_API_SECRET.includes('your_')) {
    
    console.log('✅ Configuration Cloudinary valide')
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`)
    console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY.substring(0, 8)}...`)
    
  } else {
    console.log('⚠️ Configuration Cloudinary incomplète')
    console.log('   Veuillez configurer vos identifiants dans .env.local')
  }
  
} catch (error) {
  console.log('⚠️ Impossible de tester la configuration:', error.message)
}

console.log('\n📋 Prochaines étapes:')
console.log('1. Configurez vos identifiants Cloudinary dans .env.local')
console.log('2. Redémarrez le serveur Next.js: npm run dev')
console.log('3. Testez la création d\'un produit avec URL fournisseur')
console.log('4. Les images seront automatiquement uploadées sur Cloudinary')

console.log('\n🎉 Configuration terminée!') 
const fs = require('fs')

console.log('🚀 Configuration de l\'intégration Cloudinary...')
console.log('=' .repeat(60))

// 1. Installer Cloudinary
console.log('📦 Installation de Cloudinary...')
try {
  execSync('npm install cloudinary', { stdio: 'inherit' })
  console.log('✅ Cloudinary installé avec succès')
} catch (error) {
  console.error('❌ Erreur lors de l\'installation de Cloudinary:', error.message)
  process.exit(1)
}

// 2. Vérifier les variables d'environnement
console.log('\n🔧 Vérification des variables d\'environnement...')

const envPath = '.env.local'
let envContent = ''

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8')
}

const requiredVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY', 
  'CLOUDINARY_API_SECRET'
]

const missingVars = requiredVars.filter(varName => 
  !envContent.includes(varName) && !process.env[varName]
)

if (missingVars.length > 0) {
  console.log('⚠️ Variables d\'environnement manquantes:')
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`)
  })
  
  console.log('\n📝 Ajout des variables d\'environnement au fichier .env.local...')
  
  const newVars = `
# Configuration Cloudinary pour les images de produits
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
`
  
  fs.appendFileSync(envPath, newVars)
  console.log('✅ Variables ajoutées au fichier .env.local')
  
  console.log('\n🔑 Configuration requise:')
  console.log('1. Créez un compte sur https://cloudinary.com')
  console.log('2. Récupérez vos identifiants depuis le dashboard')
  console.log('3. Remplacez les valeurs dans .env.local:')
  console.log('   - CLOUDINARY_CLOUD_NAME=votre_cloud_name')
  console.log('   - CLOUDINARY_API_KEY=votre_api_key')
  console.log('   - CLOUDINARY_API_SECRET=votre_api_secret')
  
} else {
  console.log('✅ Toutes les variables d\'environnement sont configurées')
}

// 3. Tester la configuration
console.log('\n🧪 Test de la configuration...')

try {
  const { v2: cloudinary } = require('cloudinary')
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  
  if (process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET &&
      !process.env.CLOUDINARY_CLOUD_NAME.includes('your_') &&
      !process.env.CLOUDINARY_API_KEY.includes('your_') &&
      !process.env.CLOUDINARY_API_SECRET.includes('your_')) {
    
    console.log('✅ Configuration Cloudinary valide')
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`)
    console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY.substring(0, 8)}...`)
    
  } else {
    console.log('⚠️ Configuration Cloudinary incomplète')
    console.log('   Veuillez configurer vos identifiants dans .env.local')
  }
  
} catch (error) {
  console.log('⚠️ Impossible de tester la configuration:', error.message)
}

console.log('\n📋 Prochaines étapes:')
console.log('1. Configurez vos identifiants Cloudinary dans .env.local')
console.log('2. Redémarrez le serveur Next.js: npm run dev')
console.log('3. Testez la création d\'un produit avec URL fournisseur')
console.log('4. Les images seront automatiquement uploadées sur Cloudinary')

console.log('\n🎉 Configuration terminée!') 