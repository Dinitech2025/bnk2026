const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🛒 RÉSUMÉ COMPLET - Système d\'Images Amazon\n')
  
  try {
    // Statistiques générales
    const totalProducts = await prisma.product.count()
    const importedProducts = await prisma.product.count({
      where: {
        category: {
          name: 'Produits importés'
        }
      }
    })
    
    const productsWithASIN = await prisma.product.count({
      where: {
        attributes: {
          some: {
            name: 'asin'
          }
        }
      }
    })
    
    const publishedProducts = await prisma.product.count({
      where: {
        published: true,
        category: {
          name: 'Produits importés'
        }
      }
    })
    
    console.log('📊 STATISTIQUES GÉNÉRALES:')
    console.log(`   Total produits: ${totalProducts}`)
    console.log(`   Produits importés: ${importedProducts}`)
    console.log(`   Produits avec ASIN Amazon: ${productsWithASIN}`)
    console.log(`   Produits importés publiés: ${publishedProducts}`)
    
    // Détails des produits avec ASIN
    if (productsWithASIN > 0) {
      const amazonProducts = await prisma.product.findMany({
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
      
      console.log(`\n🔖 PRODUITS AVEC ASIN AMAZON:`)
      console.log('=' .repeat(80))
      
      for (const product of amazonProducts) {
        const asin = product.attributes.find(a => a.name === 'asin')?.value
        const amazonUrl = product.attributes.find(a => a.name === 'amazon_url')?.value
        
        console.log(`\n🏷️ ${product.name}`)
        console.log(`   SKU: ${product.sku}`)
        console.log(`   ASIN: ${asin}`)
        console.log(`   Prix: ${Number(product.price).toLocaleString('fr-FR')} MGA`)
        console.log(`   Statut: ${product.published ? '✅ Publié' : '📝 Brouillon'}`)
        console.log(`   Images: ${product.images.length}`)
        
        if (amazonUrl) {
          console.log(`   URL Amazon: ${amazonUrl}`)
        }
        
        if (product.images.length > 0) {
          console.log(`   Dernière image: ${product.images[0].name}`)
        }
      }
    }
    
    console.log('\n' + '=' .repeat(80))
    console.log('🚀 SCRIPTS DISPONIBLES:')
    console.log('')
    
    console.log('1️⃣ ASSOCIATION SIMPLE (Recommandé):')
    console.log('   node scripts/fetch-amazon-images-simple.js')
    console.log('   • Utilise des images de fallback Unsplash')
    console.log('   • Fonctionne immédiatement')
    console.log('   • Associe automatiquement un ASIN')
    console.log('')
    
    console.log('2️⃣ ASSOCIATION AVANCÉE (Cloudinary):')
    console.log('   node scripts/setup-cloudinary.js')
    console.log('   node scripts/fetch-amazon-images.js')
    console.log('   • Tente de récupérer les vraies images Amazon')
    console.log('   • Upload optimisé sur Cloudinary')
    console.log('   • Nécessite configuration')
    console.log('')
    
    console.log('3️⃣ VÉRIFICATION:')
    console.log('   node scripts/check-amazon-association.js')
    console.log('   • Affiche tous les produits avec ASIN')
    console.log('   • Montre les images associées')
    console.log('   • Statistiques détaillées')
    console.log('')
    
    console.log('📚 DOCUMENTATION:')
    console.log('   Voir: scripts/README-amazon-images.md')
    console.log('   Guide complet d\'utilisation')
    console.log('')
    
    console.log('🔧 CONFIGURATION NEXT.JS:')
    console.log('   ✅ images.unsplash.com autorisé dans next.config.js')
    console.log('   ✅ Redémarrage serveur nécessaire après modification')
    console.log('')
    
    console.log('🎯 FONCTIONNALITÉS IMPLÉMENTÉES:')
    console.log('   ✅ Extraction automatique ASIN depuis URL Amazon')
    console.log('   ✅ Association intelligente aux produits importés')
    console.log('   ✅ Gestion des images via système Media')
    console.log('   ✅ Attributs produits pour traçabilité')
    console.log('   ✅ Images de fallback haute qualité')
    console.log('   ✅ Support Cloudinary optionnel')
    console.log('   ✅ Scripts de vérification et debug')
    console.log('')
    
    console.log('🔗 LIENS UTILES:')
    console.log('   📊 Administration: http://localhost:3000/admin/products')
    console.log('   📦 Produits importés: http://localhost:3000/admin/products/imported')
    console.log('   🧮 Simulateur: http://localhost:3000/admin/products/imported/simulation')
    console.log('   🛍️ Site public: http://localhost:3000/products')
    
    if (productsWithASIN > 0) {
      const latestProduct = await prisma.product.findFirst({
        where: {
          attributes: {
            some: {
              name: 'asin'
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })
      
      console.log(`   🔖 Dernier produit Amazon: http://localhost:3000/admin/products/${latestProduct.id}`)
    }
    
    console.log('\n💡 PROCHAINES ÉTAPES SUGGÉRÉES:')
    
    if (productsWithASIN === 0) {
      console.log('   1. Testez avec: node scripts/fetch-amazon-images-simple.js')
      console.log('   2. Modifiez l\'URL Amazon dans le script')
      console.log('   3. Vérifiez le résultat avec check-amazon-association.js')
    } else {
      console.log('   1. Publiez les produits depuis l\'administration')
      console.log('   2. Configurez Cloudinary pour de vraies images')
      console.log('   3. Ajoutez plus de produits Amazon')
      console.log('   4. Personnalisez les images si nécessaire')
    }
    
    console.log('   5. Consultez la documentation complète')
    console.log('   6. Intégrez avec votre workflow de gestion produits')
    
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