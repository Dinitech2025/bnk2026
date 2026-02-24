const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Ajout des catégories et services de test...')

  // Créer les catégories principales
  const beautyCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'beaute-bien-etre' },
    update: {},
    create: {
      name: 'Beauté & Bien-être',
      slug: 'beaute-bien-etre',
      description: 'Services de beauté, soins esthétiques et bien-être',
      image: null
    }
  })

  const techCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'informatique-technologie' },
    update: {},
    create: {
      name: 'Informatique & Technologie',
      slug: 'informatique-technologie',
      description: 'Services informatiques, développement et support technique',
      image: null
    }
  })

  const homeCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'maison-jardin' },
    update: {},
    create: {
      name: 'Maison & Jardin',
      slug: 'maison-jardin',
      description: 'Services pour la maison, jardinage et entretien',
      image: null
    }
  })

  const educationCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'education-formation' },
    update: {},
    create: {
      name: 'Éducation & Formation',
      slug: 'education-formation',
      description: 'Cours particuliers, formations et accompagnement scolaire',
      image: null
    }
  })

  // Créer des sous-catégories
  const webDevCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'developpement-web' },
    update: {},
    create: {
      name: 'Développement Web',
      slug: 'developpement-web',
      description: 'Création de sites web, applications et e-commerce',
      parentId: techCategory.id,
      image: null
    }
  })

  const skinCareCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'soins-visage' },
    update: {},
    create: {
      name: 'Soins du visage',
      slug: 'soins-visage',
      description: 'Nettoyage, hydratation et soins anti-âge',
      parentId: beautyCategory.id,
      image: null
    }
  })

  console.log('✅ Catégories créées')

  // Créer les services
  const services = [
    // Services Beauté & Bien-être
    {
      name: 'Soin du visage hydratant',
      slug: 'soin-visage-hydratant',
      description: 'Soin complet du visage avec nettoyage en profondeur, gommage doux et masque hydratant. Idéal pour tous types de peaux.',
      price: 65.00,
      duration: 60,
      categoryId: skinCareCategory.id,
      published: true
    },
    {
      name: 'Massage relaxant',
      slug: 'massage-relaxant',
      description: 'Massage complet du corps aux huiles essentielles pour une détente profonde et l\'évacuation du stress.',
      price: 80.00,
      duration: 90,
      categoryId: beautyCategory.id,
      published: true
    },
    {
      name: 'Manucure française',
      slug: 'manucure-francaise',
      description: 'Soin complet des ongles avec pose de vernis français classique. Inclut le soin des cuticules.',
      price: 35.00,
      duration: 45,
      categoryId: beautyCategory.id,
      published: true
    },

    // Services Informatique & Technologie
    {
      name: 'Création de site web vitrine',
      slug: 'creation-site-web-vitrine',
      description: 'Développement d\'un site web professionnel responsive avec design moderne et optimisation SEO de base.',
      price: 1200.00,
      duration: 480, // 8 heures
      categoryId: webDevCategory.id,
      published: true
    },
    {
      name: 'Maintenance informatique',
      slug: 'maintenance-informatique',
      description: 'Diagnostic, nettoyage et optimisation de votre ordinateur. Installation de logiciels et mise à jour système.',
      price: 75.00,
      duration: 120,
      categoryId: techCategory.id,
      published: true
    },
    {
      name: 'Formation WordPress',
      slug: 'formation-wordpress',
      description: 'Formation personnalisée pour apprendre à gérer votre site WordPress : création de contenu, gestion des médias, SEO.',
      price: 150.00,
      duration: 180,
      categoryId: techCategory.id,
      published: true
    },

    // Services Maison & Jardin
    {
      name: 'Entretien de jardin',
      slug: 'entretien-jardin',
      description: 'Tonte de pelouse, taille des haies, désherbage et entretien général de votre espace vert.',
      price: 45.00,
      duration: 120,
      categoryId: homeCategory.id,
      published: true
    },
    {
      name: 'Ménage à domicile',
      slug: 'menage-domicile',
      description: 'Service de ménage complet : aspirateur, serpillière, dépoussiérage, nettoyage salle de bain et cuisine.',
      price: 25.00,
      duration: 60,
      categoryId: homeCategory.id,
      published: true
    },
    {
      name: 'Petit bricolage',
      slug: 'petit-bricolage',
      description: 'Montage de meubles, fixation d\'étagères, petites réparations et travaux de bricolage du quotidien.',
      price: 40.00,
      duration: 90,
      categoryId: homeCategory.id,
      published: true
    },

    // Services Éducation & Formation
    {
      name: 'Cours particuliers de mathématiques',
      slug: 'cours-maths',
      description: 'Soutien scolaire en mathématiques pour collège et lycée. Aide aux devoirs et préparation aux examens.',
      price: 30.00,
      duration: 60,
      categoryId: educationCategory.id,
      published: true
    },
    {
      name: 'Cours de français langue étrangère',
      slug: 'cours-fle',
      description: 'Apprentissage du français pour débutants et perfectionnement. Conversation, grammaire et vocabulaire.',
      price: 35.00,
      duration: 60,
      categoryId: educationCategory.id,
      published: true
    },
    {
      name: 'Initiation à l\'informatique',
      slug: 'initiation-informatique',
      description: 'Formation de base à l\'utilisation d\'un ordinateur, internet, email et logiciels bureautiques.',
      price: 40.00,
      duration: 90,
      categoryId: educationCategory.id,
      published: false // En brouillon
    }
  ]

  // Insérer tous les services
  for (const serviceData of services) {
    await prisma.service.upsert({
      where: { slug: serviceData.slug },
      update: {},
      create: serviceData
    })
  }

  console.log('✅ Services créés')
  console.log(`📊 Résumé :`)
  console.log(`   - ${await prisma.serviceCategory.count()} catégories`)
  console.log(`   - ${await prisma.service.count()} services`)
  
  // Afficher les statistiques par catégorie
  const categoriesWithCounts = await prisma.serviceCategory.findMany({
    include: {
      _count: {
        select: {
          services: true,
          children: true
        }
      }
    }
  })

  console.log('\n📋 Détail par catégorie :')
  categoriesWithCounts.forEach(cat => {
    const indent = cat.parentId ? '  └─ ' : '• '
    console.log(`${indent}${cat.name}: ${cat._count.services} services, ${cat._count.children} sous-catégories`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 