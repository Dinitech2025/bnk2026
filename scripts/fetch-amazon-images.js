const { PrismaClient } = require('@prisma/client')
const axios = require('axios')
const { v2: cloudinary } = require('cloudinary')
const cheerio = require('cheerio')

const prisma = new PrismaClient()

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// URL Amazon à analyser
const AMAZON_URL = 'https://www.amazon.fr/dp/B0DMVB5XFF/ref=sspa_dk_detail_1?pd_rd_i=B0DMVB5XFF&pd_rd_w=DlJc8&content-id=amzn1.sym.2295e42d-cd2a-4ee8-906d-272916f85e0f&pf_rd_p=2295e42d-cd2a-4ee8-906d-272916f85e0f&pf_rd_r=059608PT5SW1Q716QWBW&pd_rd_wg=QGUXn&pd_rd_r=45621f0c-920d-4e2f-afad-660034f333d1&s=apparel&sp_csd=d2lkZ2V0TmFtZT1zcF9kZXRhaWwy&th=1&psc=1'

// Headers pour simuler un navigateur réel
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Cache-Control': 'max-age=0'
}

// Fonction pour extraire les images depuis Amazon
async function extractAmazonImages(url) {
  try {
    console.log('🔍 Analyse de la page Amazon...')
    
    const response = await axios.get(url, {
      headers: BROWSER_HEADERS,
      timeout: 30000,
      maxRedirects: 5
    })
    
    const $ = cheerio.load(response.data)
    const images = []
    
    // Sélecteurs pour les images Amazon
    const imageSelectors = [
      '#landingImage',
      '#imgTagWrapperId img',
      '.a-dynamic-image',
      '.a-button-thumbnail img',
      '#altImages img',
      '.imageThumbnail img'
    ]
    
    // Extraire les images
    imageSelectors.forEach(selector => {
      $(selector).each((i, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src')
        if (src && src.includes('amazon') && !src.includes('gif')) {
          // Nettoyer l'URL pour obtenir une image de meilleure qualité
          let cleanUrl = src.replace(/\._.*?_\./, '._AC_SL1500_.')
          if (!cleanUrl.includes('_AC_SL')) {
            cleanUrl = src.replace(/\._.*?_\./, '._AC_SL800_.')
          }
          images.push(cleanUrl)
        }
      })
    })
    
    // Supprimer les doublons
    const uniqueImages = [...new Set(images)]
    
    console.log(`📸 ${uniqueImages.length} images trouvées`)
    return uniqueImages.slice(0, 5) // Limiter à 5 images max
    
  } catch (error) {
    console.log(`❌ Erreur extraction Amazon: ${error.message}`)
    return []
  }
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
      headers: BROWSER_HEADERS
    })
    
    return Buffer.from(response.data)
  } catch (error) {
    console.log(`   ❌ Erreur téléchargement: ${error.message}`)
    return null
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
    
    const publicId = `products/amazon/${cleanName}-${imageIndex + 1}`
    
    console.log(`   ☁️ Upload Cloudinary: ${publicId}`)
    
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'products/amazon',
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

// Fonction pour mettre à jour un produit avec les images
async function updateProductWithImages(product, imageUrls) {
  try {
    if (imageUrls.length === 0) return false
    
    console.log(`📸 Mise à jour de ${product.name} avec ${imageUrls.length} images`)
    
    // Supprimer les anciennes images Media liées au produit
    await prisma.media.deleteMany({
      where: {
        products: {
          some: {
            id: product.id
          }
        }
      }
    })
    
    // Supprimer les anciens attributs d'images
    await prisma.productAttribute.deleteMany({
      where: {
        productId: product.id,
        name: {
          startsWith: 'image_'
        }
      }
    })
    
    // Créer les nouvelles entrées Media
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i]
      const fileName = `${product.slug}-amazon-${i + 1}.jpg`
      
      // Créer l'entrée Media
      await prisma.media.create({
        data: {
          name: `${product.name} - Image Amazon ${i + 1}`,
          fileName: fileName,
          mimeType: 'image/jpeg',
          path: url,
          size: 0,
          alt: `${product.name} - Image ${i + 1}`,
          products: {
            connect: { id: product.id }
          }
        }
      })
      
      // Ajouter aussi comme attribut
      await prisma.productAttribute.create({
        data: {
          productId: product.id,
          name: `image_${i + 1}`,
          value: url
        }
      })
    }
    
    console.log(`   ✅ ${imageUrls.length} images ajoutées au produit`)
    return true
  } catch (error) {
    console.log(`   ❌ Erreur mise à jour produit: ${error.message}`)
    return false
  }
}

// Fonction pour trouver le produit correspondant
async function findMatchingProduct(amazonUrl) {
  try {
    // Extraire l'ASIN depuis l'URL Amazon
    const asinMatch = amazonUrl.match(/\/dp\/([A-Z0-9]{10})/)
    if (!asinMatch) {
      console.log('❌ ASIN non trouvé dans l\'URL')
      return null
    }
    
    const asin = asinMatch[1]
    console.log(`🔍 ASIN détecté: ${asin}`)
    
    // Chercher un produit avec cet ASIN dans les attributs
    let product = await prisma.product.findFirst({
      where: {
        attributes: {
          some: {
            name: 'asin',
            value: asin
          }
        }
      },
      include: {
        attributes: true,
        images: true
      }
    })
    
    if (!product) {
      // Si pas trouvé par ASIN, proposer de l'associer manuellement
      console.log('❌ Aucun produit trouvé avec cet ASIN')
      console.log('💡 Suggestion: Choisissez un produit à associer')
      
      // Lister les produits importés disponibles
      const importedProducts = await prisma.product.findMany({
        where: {
          category: {
            name: 'Produits importés'
          }
        },
        select: {
          id: true,
          name: true,
          sku: true
        },
        take: 10
      })
      
      console.log('\n📦 Produits importés disponibles:')
      importedProducts.forEach((p, index) => {
        console.log(`   ${index + 1}. ${p.name} (${p.sku})`)
      })
      
      // Pour ce script, on va prendre le premier produit comme exemple
      if (importedProducts.length > 0) {
        product = await prisma.product.findUnique({
          where: { id: importedProducts[0].id },
          include: {
            attributes: true,
            images: true
          }
        })
        
        // Ajouter l'ASIN comme attribut
        await prisma.productAttribute.create({
          data: {
            productId: product.id,
            name: 'asin',
            value: asin
          }
        })
        
        console.log(`✅ Produit associé: ${product.name}`)
      }
    }
    
    return product
  } catch (error) {
    console.log(`❌ Erreur recherche produit: ${error.message}`)
    return null
  }
}

async function main() {
  console.log('🛒 Récupération d\'images Amazon vers Cloudinary\n')
  
  // Vérifier la configuration Cloudinary
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.log('❌ Configuration Cloudinary manquante!')
    console.log('Veuillez configurer les variables d\'environnement:')
    console.log('- CLOUDINARY_CLOUD_NAME')
    console.log('- CLOUDINARY_API_KEY')
    console.log('- CLOUDINARY_API_SECRET')
    console.log('\nLancez: node scripts/setup-cloudinary.js pour plus d\'infos')
    return
  }
  
  try {
    // Trouver le produit correspondant
    const product = await findMatchingProduct(AMAZON_URL)
    if (!product) {
      console.log('❌ Aucun produit trouvé pour associer les images')
      return
    }
    
    // Extraire les images depuis Amazon
    const amazonImages = await extractAmazonImages(AMAZON_URL)
    
    if (amazonImages.length === 0) {
      console.log('❌ Aucune image trouvée sur Amazon')
      console.log('💡 Cela peut être dû aux protections anti-bot d\'Amazon')
      return
    }
    
    console.log(`\n📸 Traitement de ${amazonImages.length} images pour: ${product.name}`)
    
    const uploadedImages = []
    
    // Traiter chaque image
    for (let i = 0; i < amazonImages.length; i++) {
      const imageUrl = amazonImages[i]
      
      // Télécharger l'image
      const buffer = await downloadImage(imageUrl)
      if (!buffer) continue
      
      // Uploader sur Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(buffer, product.name, i)
      if (cloudinaryUrl) {
        uploadedImages.push(cloudinaryUrl)
      }
      
      // Pause entre les uploads
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    if (uploadedImages.length > 0) {
      // Mettre à jour le produit avec les nouvelles images
      const success = await updateProductWithImages(product, uploadedImages)
      
      if (success) {
        console.log(`\n🎉 Succès! ${uploadedImages.length} images Amazon ajoutées à ${product.name}`)
        console.log(`🔗 Voir le produit: http://localhost:3000/admin/products/${product.id}`)
      }
    } else {
      console.log('\n❌ Aucune image n\'a pu être uploadée')
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