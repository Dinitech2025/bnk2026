const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// URLs d'images Unsplash (libres de droits) pour chaque produit
const PRODUCT_IMAGES = {
  'iPhone 15 Pro 128GB': [
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=800&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop&auto=format'
  ],
  'MacBook Air M3 13"': [
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=600&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop&auto=format'
  ],
  'AirPods Pro 2ème génération': [
    'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800&h=800&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&h=800&fit=crop&auto=format'
  ],
  'Parfum Dior Sauvage 100ml': [
    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&h=800&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1588405748880-12d1d2a59d32?w=800&h=800&fit=crop&auto=format'
  ],
  'Sac Louis Vuitton Neverfull MM': [
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=800&fit=crop&auto=format'
  ],
  'Montre Rolex Submariner Date': [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=800&h=800&fit=crop&auto=format'
  ],
  'Vélo électrique Xiaomi Mi Smart': [
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&h=600&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&auto=format'
  ],
  'Trottinette électrique Ninebot Max G30': [
    'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1544191696-15693072b5a7?w=800&h=600&fit=crop&auto=format'
  ],
  'Drone DJI Mini 3': [
    'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&h=600&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=800&h=600&fit=crop&auto=format'
  ],
  'Machine à café Delonghi Magnifica S': [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=600&fit=crop&auto=format'
  ]
}

// Fonction pour mettre à jour un produit avec ses images
async function updateProductWithImages(product, imageUrls) {
  try {
    if (imageUrls.length === 0) return false
    
    console.log(`📸 Ajout de ${imageUrls.length} images pour: ${product.name}`)
    
    // Supprimer les anciennes images attributs s'il y en a
    await prisma.productAttribute.deleteMany({
      where: {
        productId: product.id,
        name: {
          startsWith: 'image_'
        }
      }
    })
    
    // Créer les entrées Media et les lier au produit
    const mediaEntries = []
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i]
      const fileName = `${product.slug}-image-${i + 1}.jpg`
      
      // Créer l'entrée Media
      const media = await prisma.media.create({
        data: {
          name: `${product.name} - Image ${i + 1}`,
          fileName: fileName,
          mimeType: 'image/jpeg',
          path: url,
          size: 0, // Taille inconnue pour les URLs externes
          alt: `${product.name} - Image ${i + 1}`,
          products: {
            connect: { id: product.id }
          }
        }
      })
      
      mediaEntries.push(media)
      
      // Ajouter aussi comme attribut pour compatibilité
      await prisma.productAttribute.create({
        data: {
          productId: product.id,
          name: `image_${i + 1}`,
          value: url
        }
      })
    }
    
    console.log(`   ✅ ${imageUrls.length} images ajoutées`)
    console.log(`   🖼️ Image principale: ${imageUrls[0]}`)
    
    return true
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🖼️ Ajout d\'images aux produits importés...\n')
  
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
    
    console.log(`📦 ${importedProducts.length} produits importés trouvés\n`)
    
    let processedCount = 0
    let successCount = 0
    let skippedCount = 0
    
    for (const product of importedProducts) {
      console.log(`\n🏷️ ${product.name}`)
      
      // Vérifier si le produit a déjà des images
      const hasImages = product.image || product.attributes?.some(attr => attr.name.startsWith('image_'))
      
      if (hasImages) {
        console.log(`   ⏭️ Images déjà présentes, ignoré`)
        skippedCount++
        continue
      }
      
      // Récupérer les URLs d'images pour ce produit
      const imageUrls = PRODUCT_IMAGES[product.name] || []
      
      if (imageUrls.length === 0) {
        console.log(`   ⚠️ Aucune image définie pour ce produit`)
        continue
      }
      
      processedCount++
      
      // Mettre à jour le produit avec les images
      const success = await updateProductWithImages(product, imageUrls)
      if (success) {
        successCount++
      }
    }
    
    console.log(`\n🎉 Traitement terminé!`)
    console.log(`📊 Statistiques:`)
    console.log(`   Produits traités: ${processedCount}`)
    console.log(`   Succès: ${successCount}`)
    console.log(`   Ignorés (déjà des images): ${skippedCount}`)
    console.log(`   Échecs: ${processedCount - successCount}`)
    
    if (successCount > 0) {
      console.log(`\n🔗 Voir les produits avec images:`)
      console.log(`   Administration: http://localhost:3000/admin/products`)
      console.log(`   Site public: http://localhost:3000/products`)
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