const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Vérification des associations Amazon\n')
  
  try {
    // Trouver tous les produits avec un ASIN
    const productsWithASIN = await prisma.product.findMany({
      where: {
        attributes: {
          some: {
            name: 'asin'
          }
        }
      },
      include: {
        attributes: true,
        images: true,
        category: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    
    if (productsWithASIN.length === 0) {
      console.log('❌ Aucun produit avec ASIN trouvé')
      return
    }
    
    console.log(`📦 ${productsWithASIN.length} produit(s) avec ASIN trouvé(s)\n`)
    
    for (const product of productsWithASIN) {
      const asin = product.attributes.find(a => a.name === 'asin')?.value
      const amazonUrl = product.attributes.find(a => a.name === 'amazon_url')?.value
      const imageAttributes = product.attributes.filter(a => a.name.startsWith('image_'))
      
      console.log(`🏷️ ${product.name}`)
      console.log(`   SKU: ${product.sku}`)
      console.log(`   Catégorie: ${product.category?.name || 'Non définie'}`)
      console.log(`   Prix: ${Number(product.price).toLocaleString('fr-FR')} MGA`)
      console.log(`   Statut: ${product.published ? '✅ Publié' : '📝 Brouillon'}`)
      
      if (asin) {
        console.log(`   🔖 ASIN: ${asin}`)
      }
      
      if (amazonUrl) {
        console.log(`   🔗 URL Amazon: ${amazonUrl}`)
      }
      
      console.log(`   🖼️ Images Media: ${product.images.length}`)
      if (product.images.length > 0) {
        product.images.forEach((img, index) => {
          console.log(`      ${index + 1}. ${img.name}`)
          console.log(`         URL: ${img.path}`)
        })
      }
      
      console.log(`   📋 Attributs images: ${imageAttributes.length}`)
      if (imageAttributes.length > 0) {
        imageAttributes.forEach((attr, index) => {
          console.log(`      ${attr.name}: ${attr.value.substring(0, 60)}...`)
        })
      }
      
      console.log(`   🕒 Dernière mise à jour: ${product.updatedAt.toLocaleString('fr-FR')}`)
      console.log('')
    }
    
    // Statistiques
    const totalImages = productsWithASIN.reduce((sum, p) => sum + p.images.length, 0)
    const publishedCount = productsWithASIN.filter(p => p.published).length
    
    console.log('📊 STATISTIQUES:')
    console.log(`   Produits avec ASIN: ${productsWithASIN.length}`)
    console.log(`   Produits publiés: ${publishedCount}`)
    console.log(`   Total images: ${totalImages}`)
    
    console.log('\n🔗 LIENS UTILES:')
    console.log('   Administration: http://localhost:3000/admin/products')
    console.log('   Produits importés: http://localhost:3000/admin/products/imported')
    
    if (productsWithASIN.length > 0) {
      const firstProduct = productsWithASIN[0]
      console.log(`   Dernier produit modifié: http://localhost:3000/admin/products/${firstProduct.id}`)
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