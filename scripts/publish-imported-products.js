const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('📢 Publication de produits importés sélectionnés...\n')

  try {
    // Trouver la catégorie "Produits importés"
    const category = await prisma.productCategory.findFirst({
      where: { name: 'Produits importés' }
    })

    if (!category) {
      console.log('❌ Catégorie "Produits importés" non trouvée')
      return
    }

    // Récupérer tous les produits importés non publiés
    const unpublishedProducts = await prisma.product.findMany({
      where: {
        categoryId: category.id,
        published: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📦 ${unpublishedProducts.length} produits importés non publiés trouvés`)

    // Sélectionner quelques produits à publier (par exemple, les 5 premiers)
    const productsToPublish = [
      'iPhone 15 Pro 128GB',
      'MacBook Air M3 13"',
      'Parfum Dior Sauvage 100ml',
      'Vélo électrique Xiaomi Mi Smart',
      'Drone DJI Mini 3'
    ]

    let publishedCount = 0

    for (const productName of productsToPublish) {
      const product = unpublishedProducts.find(p => p.name === productName)
      
      if (product) {
        await prisma.product.update({
          where: { id: product.id },
          data: { 
            published: true,
            inventory: 5 // Ajouter un peu de stock
          }
        })
        
        console.log(`✅ Publié: ${product.name} (SKU: ${product.sku})`)
        console.log(`   Prix: ${Number(product.price).toLocaleString('fr-FR')} MGA`)
        console.log(`   Stock: 5 unités`)
        publishedCount++
      } else {
        console.log(`⚠️ Produit non trouvé: ${productName}`)
      }
    }

    console.log(`\n🎉 Publication terminée!`)
    console.log(`✅ ${publishedCount} produits publiés`)
    console.log(`📝 ${unpublishedProducts.length - publishedCount} produits restent en brouillon`)
    console.log(`\n🔗 Voir les produits publiés: http://localhost:3000/admin/products`)
    console.log(`🛍️ Voir sur le site: http://localhost:3000/products`)

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