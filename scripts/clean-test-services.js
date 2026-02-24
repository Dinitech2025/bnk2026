const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanTestServices() {
  console.log('🧹 Nettoyage des services de test...\n')

  try {
    // Vérifier ce qui existe
    const totalServices = await prisma.service.count()
    const totalCategories = await prisma.serviceCategory.count()
    const totalMedia = await prisma.media.count()

    console.log(`📊 Avant nettoyage:`)
    console.log(`   📋 Services: ${totalServices}`)
    console.log(`   📂 Catégories: ${totalCategories}`)
    console.log(`   🖼️ Images: ${totalMedia}`)

    if (totalServices === 0) {
      console.log('✅ Aucun service à nettoyer')
      return
    }

    console.log('\n⚠️ Cette action va supprimer TOUS les services de test créés')
    console.log('   - Services avec slugs: consultation-gratuite, maintenance-ordinateur-standard, etc.')
    console.log('   - Catégories de test créées')
    console.log('   - Images associées aux services\n')

    // ATTENTION: Décommentez les lignes suivantes si vous voulez vraiment supprimer
    /*
    console.log('🗑️ Suppression des services...')
    const deletedServices = await prisma.service.deleteMany({
      where: {
        slug: {
          in: [
            'consultation-gratuite',
            'maintenance-ordinateur-standard',
            'formation-bureautique-complete',
            'support-express',
            'installation-reseau-pro',
            'migration-cloud-entreprise',
            'audit-securite-complet',
            'diagnostic-express',
            'developpement-app-web',
            'pack-maintenance-premium'
          ]
        }
      }
    })

    console.log(`✅ ${deletedServices.count} services supprimés`)

    console.log('🗑️ Suppression des catégories...')
    const deletedCategories = await prisma.serviceCategory.deleteMany({
      where: {
        slug: {
          in: ['maintenance', 'installation', 'consultation', 'formation', 'support']
        }
      }
    })

    console.log(`✅ ${deletedCategories.count} catégories supprimées`)

    console.log('🗑️ Suppression des images orphelines...')
    const deletedMedia = await prisma.media.deleteMany({
      where: {
        services: {
          none: {}
        }
      }
    })

    console.log(`✅ ${deletedMedia.count} images supprimées`)

    // Vérifier après nettoyage
    const afterServices = await prisma.service.count()
    const afterCategories = await prisma.serviceCategory.count()
    const afterMedia = await prisma.media.count()

    console.log('\n📊 Après nettoyage:')
    console.log(`   📋 Services: ${afterServices}`)
    console.log(`   📂 Catégories: ${afterCategories}`)
    console.log(`   🖼️ Images: ${afterMedia}`)
    */

    console.log('\n💡 Pour nettoyer, décommentez le code dans le script et relancez-le')
    console.log('⚠️ ATTENTION: Cette action est irréversible!')

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanTestServices()

