const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Vérification des produits dans la base...')

  try {
    const products = await prisma.product.findMany({
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\n📦 ${products.length} produits trouvés :`)
    
    if (products.length === 0) {
      console.log('   Aucun produit trouvé dans la base de données')
    } else {
      products.forEach((product, index) => {
        const priceFormatted = product.price.toLocaleString()
        const category = product.category?.name || 'Sans catégorie'
        console.log(`   ${index + 1}. ${product.name}`)
        console.log(`      - Catégorie: ${category}`)
        console.log(`      - Prix: ${priceFormatted} MGA`)
        console.log(`      - SKU: ${product.sku || 'N/A'}`)
        console.log(`      - Stock: ${product.inventory}`)
        console.log(`      - Publié: ${product.published ? 'Oui' : 'Non'}`)
        console.log('')
      })
    }

    // Vérifier les catégories
    const categories = await prisma.productCategory.findMany({
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    console.log(`\n📂 ${categories.length} catégories de produits :`)
    categories.forEach(cat => {
      console.log(`   - ${cat.name}: ${cat._count.products} produits`)
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  }) 