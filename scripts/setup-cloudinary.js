console.log('🔧 Configuration Cloudinary pour l\'upload d\'images\n')

console.log('📋 Étapes de configuration:')
console.log('1. Créez un compte sur https://cloudinary.com/')
console.log('2. Récupérez vos identifiants depuis le Dashboard')
console.log('3. Ajoutez ces variables à votre fichier .env.local:\n')

console.log('CLOUDINARY_CLOUD_NAME=your_cloud_name')
console.log('CLOUDINARY_API_KEY=your_api_key')
console.log('CLOUDINARY_API_SECRET=your_api_secret\n')

console.log('📍 Où trouver ces informations:')
console.log('- Connectez-vous à https://cloudinary.com/')
console.log('- Allez dans Dashboard')
console.log('- Copiez Cloud Name, API Key et API Secret')
console.log('- Collez-les dans votre fichier .env.local\n')

console.log('🚀 Une fois configuré, lancez:')
console.log('node scripts/upload-product-images.js\n')

console.log('💡 Le script va:')
console.log('- Télécharger les images depuis les URLs officielles')
console.log('- Les optimiser (redimensionnement, compression)')
console.log('- Les uploader sur votre Cloudinary')
console.log('- Mettre à jour vos produits avec les URLs Cloudinary')

// Vérifier si les variables sont déjà configurées
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  console.log('\n✅ Configuration Cloudinary détectée!')
  console.log('Vous pouvez maintenant lancer: node scripts/upload-product-images.js')
} else {
  console.log('\n⚠️ Configuration Cloudinary manquante')
  console.log('Veuillez configurer les variables d\'environnement avant de continuer')
} 