const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('📋 RÉSUMÉ COMPLET - Produits Importés avec Images\n')
  
  try {
    // Trouver la catégorie "Produits importés"
    const category = await prisma.productCategory.findFirst({
      where: { name: 'Produits importés' }
    })
    
    if (!category) {
      console.log('❌ Catégorie "Produits importés" non trouvée')
      return
    }
    
    // Récupérer tous les produits importés avec leurs images et attributs
    const importedProducts = await prisma.product.findMany({
      where: {
        categoryId: category.id
      },
      include: {
        attributes: true,
        images: true,
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`🎉 SUCCÈS! ${importedProducts.length} produits importés créés avec images\n`)
    
    // Statistiques générales
    const publishedCount = importedProducts.filter(p => p.published).length
    const draftCount = importedProducts.filter(p => !p.published).length
    const totalValue = importedProducts.reduce((sum, p) => sum + Number(p.price), 0)
    const totalImages = importedProducts.reduce((sum, p) => sum + p.images.length, 0)
    
    console.log('📊 STATISTIQUES GÉNÉRALES:')
    console.log(`   ✅ Produits créés: ${importedProducts.length}`)
    console.log(`   🟢 Publiés: ${publishedCount}`)
    console.log(`   🟡 Brouillons: ${draftCount}`)
    console.log(`   💰 Valeur totale: ${totalValue.toLocaleString('fr-FR')} MGA`)
    console.log(`   🖼️ Images ajoutées: ${totalImages}`)
    console.log(`   📂 Catégorie: ${category.name}`)
    
    // Répartition par mode de transport
    const airProducts = importedProducts.filter(p => 
      p.attributes?.find(a => a.name === 'transportMode')?.value === 'air'
    ).length
    const seaProducts = importedProducts.filter(p => 
      p.attributes?.find(a => a.name === 'transportMode')?.value === 'sea'
    ).length
    
    console.log(`\n🚚 RÉPARTITION PAR TRANSPORT:`)
    console.log(`   ✈️ Transport aérien: ${airProducts} produits`)
    console.log(`   🚢 Transport maritime: ${seaProducts} produits`)
    
    // Répartition par entrepôt
    const warehouseStats = {}
    importedProducts.forEach(p => {
      const warehouse = p.attributes?.find(a => a.name === 'warehouse')?.value
      if (warehouse) {
        warehouseStats[warehouse] = (warehouseStats[warehouse] || 0) + 1
      }
    })
    
    console.log(`\n🌍 RÉPARTITION PAR ENTREPÔT:`)
    Object.entries(warehouseStats).forEach(([warehouse, count]) => {
      const warehouseNames = {
        'usa': 'États-Unis 🇺🇸',
        'france': 'France 🇫🇷',
        'uk': 'Royaume-Uni 🇬🇧',
        'china': 'Chine 🇨🇳'
      }
      console.log(`   ${warehouseNames[warehouse] || warehouse}: ${count} produits`)
    })
    
    console.log(`\n📦 DÉTAIL DES PRODUITS CRÉÉS:`)
    console.log('=' .repeat(80))
    
    for (const product of importedProducts) {
      const attributes = product.attributes || []
      const supplierPrice = attributes.find(a => a.name === 'supplierPrice')?.value
      const supplierCurrency = attributes.find(a => a.name === 'supplierCurrency')?.value
      const warehouse = attributes.find(a => a.name === 'warehouse')?.value
      const transportMode = attributes.find(a => a.name === 'transportMode')?.value
      const transitTime = attributes.find(a => a.name === 'transitTime')?.value
      
      const warehouseNames = {
        'usa': 'États-Unis',
        'france': 'France',
        'uk': 'Royaume-Uni',
        'china': 'Chine'
      }
      
      console.log(`\n🏷️ ${product.name}`)
      console.log(`   SKU: ${product.sku}`)
      console.log(`   💰 Prix final: ${Number(product.price).toLocaleString('fr-FR')} MGA`)
      console.log(`   📊 Statut: ${product.published ? '✅ Publié' : '📝 Brouillon'}`)
      console.log(`   📦 Stock: ${product.inventory} unités`)
      
      if (supplierPrice && supplierCurrency) {
        console.log(`   💵 Prix fournisseur: ${supplierPrice} ${supplierCurrency}`)
      }
      
      if (warehouse && transportMode) {
        console.log(`   🚚 Import: ${transportMode === 'air' ? '✈️ Aérien' : '🚢 Maritime'} depuis ${warehouseNames[warehouse] || warehouse}`)
      }
      
      if (transitTime) {
        console.log(`   ⏱️ Délai: ${transitTime}`)
      }
      
      console.log(`   🖼️ Images: ${product.images.length} images ajoutées`)
      if (product.images.length > 0) {
        product.images.forEach((img, index) => {
          console.log(`      ${index + 1}. ${img.name}`)
        })
      }
    }
    
    console.log('\n' + '=' .repeat(80))
    console.log('🎯 FONCTIONNALITÉS IMPLÉMENTÉES:')
    console.log('   ✅ Simulateur d\'importation avec calculs réalistes')
    console.log('   ✅ Création automatique de produits depuis le simulateur')
    console.log('   ✅ Catégorie "Produits importés" créée automatiquement')
    console.log('   ✅ Calculs de coûts (transport, commission, taxes)')
    console.log('   ✅ Gestion des devises (MGA comme base)')
    console.log('   ✅ Images automatiques depuis Unsplash (libres de droits)')
    console.log('   ✅ Attributs détaillés pour chaque produit')
    console.log('   ✅ Support transport aérien et maritime')
    console.log('   ✅ Entrepôts multiples (USA, France, UK, Chine)')
    
    console.log('\n🔗 LIENS UTILES:')
    console.log('   📊 Administration: http://localhost:3000/admin/products')
    console.log('   📦 Produits importés: http://localhost:3000/admin/products/imported')
    console.log('   🧮 Simulateur: http://localhost:3000/admin/products/imported/simulation')
    console.log('   🛍️ Site public: http://localhost:3000/products')
    
    console.log('\n💡 PROCHAINES ÉTAPES POSSIBLES:')
    console.log('   • Configurer Cloudinary pour uploader les images officielles')
    console.log('   • Publier plus de produits depuis l\'administration')
    console.log('   • Ajouter plus de produits via le simulateur')
    console.log('   • Personnaliser les calculs d\'importation')
    console.log('   • Ajouter des variations de produits')
    
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