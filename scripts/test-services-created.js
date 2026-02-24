const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testServicesCreated() {
  console.log('🧪 Test des services créés...\n')

  try {
    // 1. Vérifier le nombre total de services
    console.log('1️⃣ Vérification du nombre de services...')
    const totalServices = await prisma.service.count()
    const publishedServices = await prisma.service.count({
      where: { published: true }
    })
    const unpublishedServices = await prisma.service.count({
      where: { published: false }
    })

    console.log(`   📊 Total: ${totalServices} services`)
    console.log(`   ✅ Publiés: ${publishedServices} services`)
    console.log(`   📝 Brouillons: ${unpublishedServices} services\n`)

    // 2. Lister tous les services avec détails
    console.log('2️⃣ Liste des services créés:')
    const services = await prisma.service.findMany({
      include: {
        category: true,
        images: true,
      },
      orderBy: [
        { price: 'asc' },
        { duration: 'asc' }
      ]
    })

    services.forEach((service, index) => {
      const price = Number(service.price)
      const duration = service.duration
      const durationText = duration < 60
        ? `${duration} min`
        : duration < 1440
        ? `${Math.floor(duration / 60)}h ${duration % 60}min`
        : `${Math.floor(duration / 1440)}j ${Math.floor((duration % 1440) / 60)}h`

      console.log(`\n${index + 1}. ${service.name}`)
      console.log(`   💰 Prix: ${price.toLocaleString('fr-FR')} Ar`)
      console.log(`   ⏱️ Durée: ${durationText}`)
      console.log(`   📂 Catégorie: ${service.category?.name || 'Non classé'}`)
      console.log(`   🔒 Statut: ${service.published ? 'Publié' : 'Brouillon'}`)
      console.log(`   🖼️ Images: ${service.images.length}`)
      console.log(`   🔗 Slug: ${service.slug}`)

      if (service.images.length > 0) {
        console.log(`   📸 Images:`)
        service.images.forEach((img, i) => {
          console.log(`      ${i + 1}. ${img.path}`)
        })
      }
    })

    // 3. Statistiques par catégorie
    console.log('\n\n3️⃣ Statistiques par catégorie:')
    const categoryStats = await prisma.service.groupBy({
      by: ['categoryId'],
      _count: true,
      _sum: {
        price: true,
      },
      _avg: {
        duration: true,
      },
      where: {
        published: true
      }
    })

    for (const stat of categoryStats) {
      const category = await prisma.serviceCategory.findUnique({
        where: { id: stat.categoryId }
      })

      console.log(`\n📁 ${category?.name || 'Non classé'}:`)
      console.log(`   📊 Services: ${stat._count}`)
      console.log(`   💰 Prix total: ${Number(stat._sum.price || 0).toLocaleString('fr-FR')} Ar`)
      console.log(`   ⏱️ Durée moyenne: ${Math.floor((stat._avg.duration || 0) / 60)}h ${Math.floor((stat._avg.duration || 0) % 60)}min`)
    }

    // 4. Services gratuits vs payants
    console.log('\n\n4️⃣ Répartition gratuit/payant:')
    const freeServices = await prisma.service.count({
      where: {
        price: 0,
        published: true
      }
    })

    const paidServices = await prisma.service.count({
      where: {
        price: { gt: 0 },
        published: true
      }
    })

    console.log(`   💰 Gratuits: ${freeServices} services`)
    console.log(`   💳 Payants: ${paidServices} services`)

    // 5. Durée des services
    console.log('\n\n5️⃣ Répartition par durée:')
    const shortServices = await prisma.service.count({
      where: {
        duration: { lte: 60 },
        published: true
      }
    })

    const mediumServices = await prisma.service.count({
      where: {
        duration: { gt: 60, lte: 480 },
        published: true
      }
    })

    const longServices = await prisma.service.count({
      where: {
        duration: { gt: 480 },
        published: true
      }
    })

    console.log(`   ⚡ Express (≤1h): ${shortServices} services`)
    console.log(`   📅 Standard (1h-8h): ${mediumServices} services`)
    console.log(`   🏗️ Projets (>8h): ${longServices} services`)

    // 6. Prix des services
    console.log('\n\n6️⃣ Répartition par prix:')
    const cheapServices = await prisma.service.count({
      where: {
        price: { lte: 50000 },
        published: true
      }
    })

    const mediumPriceServices = await prisma.service.count({
      where: {
        price: { gt: 50000, lte: 500000 },
        published: true
      }
    })

    const expensiveServices = await prisma.service.count({
      where: {
        price: { gt: 500000 },
        published: true
      }
    })

    console.log(`   💵 Abordables (≤50k): ${cheapServices} services`)
    console.log(`   💰 Moyens (50k-500k): ${mediumPriceServices} services`)
    console.log(`   💎 Premium (>500k): ${expensiveServices} services`)

    console.log('\n🎉 Test terminé avec succès!')
    console.log('\n💡 Vous pouvez maintenant:')
    console.log('   📋 Voir les services sur /admin/services')
    console.log('   🛒 Tester l\'ajout au panier')
    console.log('   📝 Créer des devis avec ces services')
    console.log('   🔄 Tester les filtres et la recherche')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testServicesCreated()

