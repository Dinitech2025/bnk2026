const { PrismaClient } = require('@prisma/client')
const axios = require('axios')
const { v2: cloudinary } = require('cloudinary')
const sharp = require('sharp')

const prisma = new PrismaClient()

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// URLs d'images pour chaque produit (images de haute qualité)
const PRODUCT_IMAGES = {
  'iPhone 15 Pro 128GB': [
    'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-bluetitanium-select?wid=470&hei=556&fmt=png-alpha&.v=1693009279145',
    'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-bluetitanium-back-select?wid=470&hei=556&fmt=png-alpha&.v=1693009279145'
  ],
  'MacBook Air M3 13"': [
    'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-13-midnight-select-202402?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1708367688034',
    'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-13-midnight-select-202402_AV2?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1708367688034'
  ],
  'AirPods Pro 2ème génération': [
    'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83?wid=572&hei=572&fmt=jpeg&qlt=95&.v=1660803972361',
    'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airpods-pro-2nd-gen-hero-select?wid=470&hei=556&fmt=png-alpha&.v=1660803972361'
  ],
  'Parfum Dior Sauvage 100ml': [
    'https://www.dior.com/dw/image/v2/BDGP_PRD/on/demandware.static/-/Sites-master_dior/default/dw8b8b8b8b/Y0685240_C099600001_E01_GHC.jpg',
    'https://www.dior.com/dw/image/v2/BDGP_PRD/on/demandware.static/-/Sites-master_dior/default/dw8b8b8b8b/Y0685240_C099600001_E02_GHC.jpg'
  ],
  'Sac Louis Vuitton Neverfull MM': [
    'https://fr.louisvuitton.com/images/is/image/lv/1/PP_VP_L/louis-vuitton-neverfull-mm-monogram-handbags--M40156_PM2_Front%20view.jpg',
    'https://fr.louisvuitton.com/images/is/image/lv/1/PP_VP_L/louis-vuitton-neverfull-mm-monogram-handbags--M40156_PM1_Side%20view.jpg'
  ],
  'Montre Rolex Submariner Date': [
    'https://content.rolex.com/dam/2023-11/upright-bba-with-shadow/m126610ln-0001.png',
    'https://content.rolex.com/dam/2023-11/upright-bba-with-shadow/m126610ln-0001_001.png'
  ],
  'Vélo électrique Xiaomi Mi Smart': [
    'https://cdn.shopify.com/s/files/1/0024/9803/5810/products/xiaomi-mi-smart-electric-folding-bike-1_800x.jpg',
    'https://cdn.shopify.com/s/files/1/0024/9803/5810/products/xiaomi-mi-smart-electric-folding-bike-2_800x.jpg'
  ],
  'Trottinette électrique Ninebot Max G30': [
    'https://segway-discovery.com/wp-content/uploads/2020/03/ninebot-kickscooter-max-g30-1.jpg',
    'https://segway-discovery.com/wp-content/uploads/2020/03/ninebot-kickscooter-max-g30-2.jpg'
  ],
  'Drone DJI Mini 3': [
    'https://dji-official-fe.djicdn.com/dps/9f6e0b8b8b8b8b8b8b8b8b8b8b8b8b8b/cms/uploads/dji-mini-3-1.jpg',
    'https://dji-official-fe.djicdn.com/dps/9f6e0b8b8b8b8b8b8b8b8b8b8b8b8b8b/cms/uploads/dji-mini-3-2.jpg'
  ],
  'Machine à café Delonghi Magnifica S': [
    'https://www.delonghi.com/Global/recipes/multimediaObject/ECAM22.110.B_1.jpg',
    'https://www.delonghi.com/Global/recipes/multimediaObject/ECAM22.110.B_2.jpg'
  ]
}

// URLs d'images alternatives (Unsplash - images libres de droits)
const FALLBACK_IMAGES = {
  'iPhone 15 Pro 128GB': [
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=600&fit=crop'
  ],
  'MacBook Air M3 13"': [
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop'
  ],
  'AirPods Pro 2ème génération': [
    'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&h=800&fit=crop'
  ],
  'Parfum Dior Sauvage 100ml': [
    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1588405748880-12d1d2a59d32?w=800&h=800&fit=crop'
  ],
  'Sac Louis Vuitton Neverfull MM': [
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=800&fit=crop'
  ],
  'Montre Rolex Submariner Date': [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=800&h=800&fit=crop'
  ],
  'Vélo électrique Xiaomi Mi Smart': [
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
  ],
  'Trottinette électrique Ninebot Max G30': [
    'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1544191696-15693072b5a7?w=800&h=600&fit=crop'
  ],
  'Drone DJI Mini 3': [
    'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=800&h=600&fit=crop'
  ],
  'Machine à café Delonghi Magnifica S': [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=600&fit=crop'
  ]
}

// Fonction pour télécharger une image
async function downloadImage(url) {
  try {
    console.log(`   📥 Téléchargement: ${url}`)
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    return Buffer.from(response.data)
  } catch (error) {
    console.log(`   ❌ Erreur téléchargement: ${error.message}`)
    return null
  }
}

// Fonction pour optimiser une image
async function optimizeImage(buffer) {
  try {
    return await sharp(buffer)
      .resize(800, 800, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ 
        quality: 85,
        progressive: true 
      })
      .toBuffer()
  } catch (error) {
    console.log(`   ⚠️ Erreur optimisation: ${error.message}`)
    return buffer // Retourner l'image originale si l'optimisation échoue
  }
}

// Fonction pour uploader sur Cloudinary
async function uploadToCloudinary(buffer, productName, imageIndex) {
  try {
    const base64 = buffer.toString('base64')
    const dataURI = `data:image/jpeg;base64,${base64}`
    
    // Créer un nom de fichier propre
    const cleanName = productName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
    
    const publicId = `products/imported/${cleanName}-${imageIndex + 1}`
    
    console.log(`   ☁️ Upload Cloudinary: ${publicId}`)
    
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'products/imported',
      public_id: publicId,
      resource_type: 'image',
      overwrite: true,
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto:good' },
        { format: 'auto' }
      ]
    })
    
    console.log(`   ✅ Uploadé: ${result.secure_url}`)
    return result.secure_url
  } catch (error) {
    console.log(`   ❌ Erreur upload Cloudinary: ${error.message}`)
    return null
  }
}

// Fonction pour traiter les images d'un produit
async function processProductImages(product) {
  console.log(`\n📸 Traitement des images: ${product.name}`)
  
  // Récupérer les URLs d'images (priorité aux images officielles, fallback vers Unsplash)
  const imageUrls = PRODUCT_IMAGES[product.name] || FALLBACK_IMAGES[product.name] || []
  
  if (imageUrls.length === 0) {
    console.log(`   ⚠️ Aucune URL d'image trouvée pour ${product.name}`)
    return []
  }
  
  const uploadedImages = []
  
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i]
    
    // Télécharger l'image
    const buffer = await downloadImage(url)
    if (!buffer) continue
    
    // Optimiser l'image
    const optimizedBuffer = await optimizeImage(buffer)
    
    // Uploader sur Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(optimizedBuffer, product.name, i)
    if (cloudinaryUrl) {
      uploadedImages.push(cloudinaryUrl)
    }
    
    // Petite pause entre les uploads
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return uploadedImages
}

// Fonction pour mettre à jour le produit avec les images
async function updateProductWithImages(productId, imageUrls) {
  try {
    if (imageUrls.length === 0) return false
    
    // Mettre à jour le produit avec la première image comme image principale
    await prisma.product.update({
      where: { id: productId },
      data: {
        image: imageUrls[0] // Image principale
      }
    })
    
    // Ajouter toutes les images comme attributs
    for (let i = 0; i < imageUrls.length; i++) {
      await prisma.productAttribute.create({
        data: {
          productId: productId,
          name: `image_${i + 1}`,
          value: imageUrls[i]
        }
      })
    }
    
    console.log(`   ✅ Produit mis à jour avec ${imageUrls.length} images`)
    return true
  } catch (error) {
    console.log(`   ❌ Erreur mise à jour produit: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('📸 Upload des images des produits importés sur Cloudinary...\n')
  
  // Vérifier la configuration Cloudinary
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.log('❌ Configuration Cloudinary manquante!')
    console.log('Veuillez configurer les variables d\'environnement:')
    console.log('- CLOUDINARY_CLOUD_NAME')
    console.log('- CLOUDINARY_API_KEY')
    console.log('- CLOUDINARY_API_SECRET')
    return
  }
  
  try {
    // Trouver la catégorie "Produits importés"
    const category = await prisma.productCategory.findFirst({
      where: { name: 'Produits importés' }
    })
    
    if (!category) {
      console.log('❌ Catégorie "Produits importés" non trouvée')
      return
    }
    
    // Récupérer tous les produits importés
    const importedProducts = await prisma.product.findMany({
      where: {
        categoryId: category.id
      },
      include: {
        attributes: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`📦 ${importedProducts.length} produits importés trouvés`)
    
    let processedCount = 0
    let successCount = 0
    
    for (const product of importedProducts) {
      // Vérifier si le produit a déjà des images
      const hasImages = product.image || product.attributes?.some(attr => attr.name.startsWith('image_'))
      
      if (hasImages) {
        console.log(`\n⏭️ ${product.name} - Images déjà présentes, ignoré`)
        continue
      }
      
      processedCount++
      
      // Traiter les images du produit
      const imageUrls = await processProductImages(product)
      
      if (imageUrls.length > 0) {
        // Mettre à jour le produit avec les images
        const updated = await updateProductWithImages(product.id, imageUrls)
        if (updated) {
          successCount++
        }
      }
      
      // Pause entre les produits pour éviter de surcharger les APIs
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    console.log(`\n🎉 Traitement terminé!`)
    console.log(`📊 Statistiques:`)
    console.log(`   Produits traités: ${processedCount}`)
    console.log(`   Succès: ${successCount}`)
    console.log(`   Échecs: ${processedCount - successCount}`)
    
    if (successCount > 0) {
      console.log(`\n🔗 Voir les produits avec images: http://localhost:3000/admin/products`)
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 