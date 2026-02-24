const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Images de démonstration (vous pouvez remplacer par vos vraies images)
const demoImages = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1572635196184-84e35138cf62?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1503602642458-232111445657?w=800&h=800&fit=crop'
]

// Images spécifiques par catégorie
const categoryImages = {
  'electronique': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop'
  ],
  'vetements': [
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop'
  ],
  'maison': [
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1572635196184-84e35138cf62?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=800&h=800&fit=crop'
  ],
  'sport': [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop'
  ]
}

function getRandomImages(categoryName, count = 3) {
  const categoryKey = categoryName.toLowerCase()
  let availableImages = categoryImages[categoryKey] || demoImages
  
  // Mélanger les images
  const shuffled = [...availableImages].sort(() => 0.5 - Math.random())
  
  // Retourner le nombre demandé (entre 2 et 5)
  const imageCount = Math.min(count, Math.max(2, Math.floor(Math.random() * 4) + 2))
  return shuffled.slice(0, imageCount)
}

async function addImagesToProducts() {
  console.log('🖼️  Ajout d\'images aux produits existants...')
  
  try {
    // Récupérer tous les produits sans images ou avec peu d'images
    const products = await prisma.product.findMany({
      include: {
        images: true,
        category: true
      }
    })
    
    console.log(`📦 ${products.length} produits trouvés`)
    
    let updatedCount = 0
    
    for (const product of products) {
      const currentImageCount = product.images.length
      
      // Si le produit a déjà 3+ images, on passe
      if (currentImageCount >= 3) {
        console.log(`⏭️  ${product.name} a déjà ${currentImageCount} images, ignoré`)
        continue
      }
      
      // Calculer combien d'images ajouter
      const imagesToAdd = Math.max(0, 3 - currentImageCount)
      
      if (imagesToAdd > 0) {
        const newImages = getRandomImages(product.category?.name || 'general', imagesToAdd)
        
        console.log(`📸 Ajout de ${imagesToAdd} images à "${product.name}"`)
        
        // Créer les images
        for (let i = 0; i < newImages.length; i++) {
          await prisma.media.create({
            data: {
              name: `${product.name} - Image ${currentImageCount + i + 1}`,
              fileName: `product-${product.id}-${currentImageCount + i + 1}.jpg`,
              mimeType: 'image/jpeg',
              path: newImages[i],
              size: 800000, // Taille approximative
              alt: `${product.name} - Image ${currentImageCount + i + 1}`,
              type: 'image',
              products: {
                connect: { id: product.id }
              }
            }
          })
        }
        
        updatedCount++
      }
    }
    
    console.log(`✅ ${updatedCount} produits mis à jour avec de nouvelles images`)
    
    // Statistiques finales
    const finalStats = await prisma.product.findMany({
      include: {
        images: true
      }
    })
    
    const statsMap = {}
    finalStats.forEach(product => {
      const imageCount = product.images.length
      statsMap[imageCount] = (statsMap[imageCount] || 0) + 1
    })
    
    console.log('\n📊 Statistiques finales des images par produit:')
    Object.entries(statsMap).forEach(([count, products]) => {
      console.log(`   ${count} image(s): ${products} produit(s)`)
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des images:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function addSpecificProductImages() {
  console.log('🎯 Ajout d\'images spécifiques pour les produits de démonstration...')
  
  try {
    // Produits spécifiques avec images personnalisées
    const specificProducts = [
      {
        name: 'Console Gaming Rare',
        images: [
          'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=800&fit=crop'
        ]
      },
      {
        name: 'Smartphone Premium',
        images: [
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&h=800&fit=crop'
        ]
      },
      {
        name: 'Laptop Professionnel',
        images: [
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=800&h=800&fit=crop'
        ]
      }
    ]
    
    for (const productData of specificProducts) {
      const product = await prisma.product.findFirst({
        where: {
          name: {
            contains: productData.name,
            mode: 'insensitive'
          }
        },
        include: {
          images: true
        }
      })
      
      if (product) {
        // Supprimer les anciennes images
        await prisma.media.deleteMany({
          where: {
            products: {
              some: { id: product.id }
            }
          }
        })
        
        // Ajouter les nouvelles images
        for (let i = 0; i < productData.images.length; i++) {
          await prisma.media.create({
            data: {
              name: `${product.name} - Image ${i + 1}`,
              fileName: `product-${product.id}-${i + 1}.jpg`,
              mimeType: 'image/jpeg',
              path: productData.images[i],
              size: 800000, // Taille approximative
              alt: `${product.name} - Image ${i + 1}`,
              type: 'image',
              products: {
                connect: { id: product.id }
              }
            }
          })
        }
        
        console.log(`✅ Images mises à jour pour "${product.name}" (${productData.images.length} images)`)
      } else {
        console.log(`⚠️  Produit "${productData.name}" non trouvé`)
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des images spécifiques:', error)
  }
}

async function main() {
  console.log('🚀 Démarrage de l\'ajout d\'images aux produits...\n')
  
  // Ajouter des images génériques à tous les produits
  await addImagesToProducts()
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Ajouter des images spécifiques aux produits de démo
  await addSpecificProductImages()
  
  console.log('\n🎉 Terminé ! Tous les produits ont maintenant des images.')
  console.log('🔄 Rafraîchissez votre navigateur pour voir les changements.')
}

main()
  .catch((e) => {
    console.error('💥 Erreur fatale:', e)
    process.exit(1)
  })
