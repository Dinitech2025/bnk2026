const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Vérification des produits importés...\n')

  try {
    // Trouver la catégorie "Produits importés"
    const category = await prisma.productCategory.findFirst({
      where: { name: 'Produits importés' }
    })

    if (!category) {
      console.log('❌ Catégorie "Produits importés" non trouvée')
      return
    }

    console.log(`✅ Catégorie trouvée: "${category.name}" (ID: ${category.id})`)
    console.log(`   Slug: ${category.slug}`)
    console.log(`   Description: ${category.description}\n`)

    // Récupérer tous les produits importés
    const importedProducts = await prisma.product.findMany({
      where: {
        categoryId: category.id
      },
      include: {
        attributes: true,
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📦 ${importedProducts.length} produits importés trouvés:\n`)

    for (const product of importedProducts) {
      console.log(`🏷️ ${product.name}`)
      console.log(`   SKU: ${product.sku}`)
      console.log(`   Prix: ${Number(product.price).toLocaleString('fr-FR')} MGA`)
      console.log(`   Statut: ${product.published ? '✅ Publié' : '📝 Brouillon'}`)
      console.log(`   Poids: ${product.weight ? Number(product.weight) + 'kg' : 'Non spécifié'}`)
      
      // Afficher les attributs d'importation
      const attributes = product.attributes || []
      const supplierPrice = attributes.find(a => a.name === 'supplierPrice')?.value
      const supplierCurrency = attributes.find(a => a.name === 'supplierCurrency')?.value
      const warehouse = attributes.find(a => a.name === 'warehouse')?.value
      const transportMode = attributes.find(a => a.name === 'transportMode')?.value
      const transitTime = attributes.find(a => a.name === 'transitTime')?.value
      const transportCost = attributes.find(a => a.name === 'transportCost')?.value
      const commissionAmount = attributes.find(a => a.name === 'commissionAmount')?.value
      const taxAmount = attributes.find(a => a.name === 'taxAmount')?.value
      const productUrl = attributes.find(a => a.name === 'productUrl')?.value

      if (supplierPrice && supplierCurrency) {
        console.log(`   Prix fournisseur: ${supplierPrice} ${supplierCurrency}`)
      }
      if (warehouse && transportMode) {
        const warehouseNames = {
          'usa': 'États-Unis',
          'france': 'France',
          'uk': 'Royaume-Uni',
          'china': 'Chine'
        }
        console.log(`   Import: ${transportMode === 'air' ? 'Aérien' : 'Maritime'} depuis ${warehouseNames[warehouse] || warehouse}`)
      }
      if (transitTime) {
        console.log(`   Délai: ${transitTime}`)
      }
      if (transportCost) {
        console.log(`   Coût transport: ${Number(transportCost).toLocaleString('fr-FR')} MGA`)
      }
      if (commissionAmount) {
        console.log(`   Commission: ${Number(commissionAmount).toLocaleString('fr-FR')} MGA`)
      }
      if (taxAmount) {
        console.log(`   Taxes: ${Number(taxAmount).toLocaleString('fr-FR')} MGA`)
      }
      if (productUrl) {
        console.log(`   URL: ${productUrl}`)
      }
      
      console.log(`   Créé: ${new Date(product.createdAt).toLocaleDateString('fr-FR')}`)
      console.log('')
    }

    // Statistiques
    const publishedCount = importedProducts.filter(p => p.published).length
    const draftCount = importedProducts.filter(p => !p.published).length
    const totalValue = importedProducts.reduce((sum, p) => sum + Number(p.price), 0)

    console.log('📊 Statistiques:')
    console.log(`   Total produits: ${importedProducts.length}`)
    console.log(`   Publiés: ${publishedCount}`)
    console.log(`   Brouillons: ${draftCount}`)
    console.log(`   Valeur totale: ${totalValue.toLocaleString('fr-FR')} MGA`)

    // Répartition par mode de transport
    const airProducts = importedProducts.filter(p => 
      p.attributes?.find(a => a.name === 'transportMode')?.value === 'air'
    ).length
    const seaProducts = importedProducts.filter(p => 
      p.attributes?.find(a => a.name === 'transportMode')?.value === 'sea'
    ).length

    console.log(`   Transport aérien: ${airProducts}`)
    console.log(`   Transport maritime: ${seaProducts}`)

    // Répartition par entrepôt
    const warehouseStats = {}
    importedProducts.forEach(p => {
      const warehouse = p.attributes?.find(a => a.name === 'warehouse')?.value
      if (warehouse) {
        warehouseStats[warehouse] = (warehouseStats[warehouse] || 0) + 1
      }
    })

    console.log('\n🌍 Répartition par entrepôt:')
    Object.entries(warehouseStats).forEach(([warehouse, count]) => {
      const warehouseNames = {
        'usa': 'États-Unis',
        'france': 'France',
        'uk': 'Royaume-Uni',
        'china': 'Chine'
      }
      console.log(`   ${warehouseNames[warehouse] || warehouse}: ${count} produits`)
    })

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