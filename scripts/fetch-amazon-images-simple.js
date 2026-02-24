const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// URL Amazon à analyser
const AMAZON_URL = 'https://www.amazon.fr/dp/B0DMVB5XFF'

// Images de fallback pour le produit (basées sur l'ASIN B0DMVB5XFF qui semble être un vêtement)
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop&auto=format', // Vêtement homme
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=800&fit=crop&auto=format', // Mode masculine
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&h=800&fit=crop&auto=format', // Vêtement style
  'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&h=800&fit=crop&auto=format', // Mode
  'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&h=800&fit=crop&auto=format'  // Vêtement détail
]

// Fonction pour extraire l'ASIN depuis l'URL Amazon
function extractASIN(amazonUrl) {
  const asinMatch = amazonUrl.match(/\/dp\/([A-Z0-9]{10})/)
  return asinMatch ? asinMatch[1] : null
}

// Fonction pour trouver ou créer un produit correspondant
async function findOrCreateProduct(asin) {
  try {
    console.log(`🔍 Recherche du produit avec ASIN: ${asin}`)
    
    // Chercher un produit existant avec cet ASIN
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
        images: true,
        category: true
      }
    })
    
    if (product) {
      console.log(`✅ Produit trouvé: ${product.name}`)
      return product
    }
    
    // Si pas trouvé, lister les produits importés disponibles
    const importedProducts = await prisma.product.findMany({
      where: {
        category: {
          name: 'Produits importés'
        }
      },
      include: {
        attributes: true,
        images: true,
        category: true
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    if (importedProducts.length === 0) {
      console.log('❌ Aucun produit importé trouvé')
      return null
    }
    
    console.log('\n📦 Produits importés disponibles:')
    importedProducts.forEach((p, index) => {
      const hasImages = p.images.length > 0
      console.log(`   ${index + 1}. ${p.name} (${p.sku}) ${hasImages ? '🖼️' : '📷'}`)
    })
    
    // Prendre le premier produit sans images, ou le premier si tous ont des images
    const productWithoutImages = importedProducts.find(p => p.images.length === 0)
    const selectedProduct = productWithoutImages || importedProducts[0]
    
    // Ajouter l'ASIN comme attribut
    await prisma.productAttribute.create({
      data: {
        productId: selectedProduct.id,
        name: 'asin',
        value: asin
      }
    })
    
    // Ajouter l'URL Amazon comme attribut
    await prisma.productAttribute.create({
      data: {
        productId: selectedProduct.id,
        name: 'amazon_url',
        value: AMAZON_URL
      }
    })
    
    console.log(`✅ Produit associé: ${selectedProduct.name}`)
    
    // Recharger le produit avec les nouveaux attributs
    return await prisma.product.findUnique({
      where: { id: selectedProduct.id },
      include: {
        attributes: true,
        images: true,
        category: true
      }
    })
    
  } catch (error) {
    console.log(`❌ Erreur recherche produit: ${error.message}`)
    return null
  }
}

// Fonction pour mettre à jour un produit avec les images
async function updateProductWithImages(product, imageUrls) {
  try {
    if (imageUrls.length === 0) return false
    
    console.log(`📸 Ajout de ${imageUrls.length} images à: ${product.name}`)
    
    // Supprimer les anciennes images si elles existent
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
      
      // Ajouter aussi comme attribut pour compatibilité
      await prisma.productAttribute.create({
        data: {
          productId: product.id,
          name: `image_${i + 1}`,
          value: url
        }
      })
    }
    
    console.log(`   ✅ ${imageUrls.length} images ajoutées avec succès`)
    return true
  } catch (error) {
    console.log(`   ❌ Erreur mise à jour produit: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🛒 Association d\'images Amazon aux produits importés\n')
  console.log(`🔗 URL Amazon: ${AMAZON_URL}`)
  
  try {
    // Extraire l'ASIN
    const asin = extractASIN(AMAZON_URL)
    if (!asin) {
      console.log('❌ ASIN non trouvé dans l\'URL Amazon')
      return
    }
    
    console.log(`📋 ASIN détecté: ${asin}`)
    
    // Trouver ou associer un produit
    const product = await findOrCreateProduct(asin)
    if (!product) {
      console.log('❌ Aucun produit disponible pour associer les images')
      return
    }
    
    // Vérifier si le produit a déjà des images
    if (product.images.length > 0) {
      console.log(`⚠️ Le produit ${product.name} a déjà ${product.images.length} images`)
      console.log('Voulez-vous les remplacer ? (Ce script va les remplacer)')
    }
    
    console.log(`\n📸 Utilisation d'images de fallback (${FALLBACK_IMAGES.length} images)`)
    console.log('💡 Ces images sont des exemples depuis Unsplash')
    
    // Mettre à jour le produit avec les images de fallback
    const success = await updateProductWithImages(product, FALLBACK_IMAGES)
    
    if (success) {
      console.log(`\n🎉 Succès! Images associées au produit: ${product.name}`)
      console.log(`📊 Détails:`)
      console.log(`   ASIN: ${asin}`)
      console.log(`   SKU: ${product.sku}`)
      console.log(`   Prix: ${Number(product.price).toLocaleString('fr-FR')} MGA`)
      console.log(`   Images: ${FALLBACK_IMAGES.length} ajoutées`)
      
      console.log(`\n🔗 Liens utiles:`)
      console.log(`   Produit admin: http://localhost:3000/admin/products/${product.id}`)
      console.log(`   Produits importés: http://localhost:3000/admin/products/imported`)
      console.log(`   URL Amazon: ${AMAZON_URL}`)
      
      console.log(`\n💡 Prochaines étapes:`)
      console.log('   • Configurez Cloudinary pour uploader les vraies images Amazon')
      console.log('   • Lancez: node scripts/fetch-amazon-images.js')
      console.log('   • Ou remplacez manuellement les images dans l\'administration')
    } else {
      console.log('\n❌ Échec de l\'association des images')
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