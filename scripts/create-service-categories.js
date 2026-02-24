const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Catégories de services à créer
const serviceCategories = [
  {
    name: 'Réparation',
    slug: 'reparation',
    description: 'Services de réparation d\'appareils électroniques et électroménagers'
  },
  {
    name: 'Installation',
    slug: 'installation', 
    description: 'Installation de logiciels, systèmes et équipements'
  },
  {
    name: 'Maintenance',
    slug: 'maintenance',
    description: 'Services de maintenance préventive et curative'
  },
  {
    name: 'Consultation',
    slug: 'consultation',
    description: 'Conseil et consultation technique'
  },
  {
    name: 'Livraison',
    slug: 'livraison',
    description: 'Services de livraison et transport'
  },
  {
    name: 'Formation',
    slug: 'formation',
    description: 'Formation professionnelle et technique'
  },
  {
    name: 'Design',
    slug: 'design',
    description: 'Services de design graphique et création'
  },
  {
    name: 'Nettoyage',
    slug: 'nettoyage',
    description: 'Services de nettoyage domicile et bureau'
  },
  {
    name: 'Transport',
    slug: 'transport',
    description: 'Services de transport personnel et marchandises'
  }
];

async function createServiceCategories() {
  try {
    console.log('🚀 Création des catégories de services...');
    
    let totalCreated = 0;
    
    for (const categoryData of serviceCategories) {
      try {
        // Vérifier si la catégorie existe déjà
        const existingCategory = await prisma.serviceCategory.findUnique({
          where: {
            slug: categoryData.slug
          }
        });
        
        if (existingCategory) {
          console.log(`   ⏭️  Catégorie "${categoryData.name}" existe déjà`);
          continue;
        }
        
        const category = await prisma.serviceCategory.create({
          data: {
            name: categoryData.name,
            slug: categoryData.slug,
            description: categoryData.description
          }
        });
        
        console.log(`   ✅ Créée: "${category.name}" (${category.slug})`);
        totalCreated++;
        
      } catch (error) {
        console.error(`   ❌ Erreur lors de la création de "${categoryData.name}":`, error.message);
      }
    }
    
    console.log(`\n🎉 Création terminée! ${totalCreated} catégories de services créées.`);
    
    // Afficher le résumé final
    console.log('\n=== CATÉGORIES DE SERVICES CRÉÉES ===');
    const finalCategories = await prisma.serviceCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            services: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    finalCategories.forEach(cat => {
      console.log(`${cat.name} (${cat.slug}): ${cat._count.services} services`);
    });
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createServiceCategories(); 