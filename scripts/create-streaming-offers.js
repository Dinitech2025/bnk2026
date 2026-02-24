const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Offres d'abonnement par plateforme (prix en Ariary - MGA)
const offersByPlatform = {
  'netflix': [
    {
      name: 'Netflix Essentiel',
      description: 'Accès à Netflix avec qualité standard sur 1 écran',
      price: 25000, // 25,000 Ar
      duration: 30, // 30 jours
      features: ['1 écran simultané', 'Qualité HD', 'Accès mobile et tablette'],
      maxProfiles: 1,
      isActive: true
    },
    {
      name: 'Netflix Standard',
      description: 'Accès à Netflix avec qualité HD sur 2 écrans',
      price: 40000, // 40,000 Ar
      duration: 30,
      features: ['2 écrans simultanés', 'Qualité HD', 'Accès tous appareils'],
      maxProfiles: 2,
      isActive: true
    },
    {
      name: 'Netflix Premium',
      description: 'Accès à Netflix avec qualité 4K sur 4 écrans',
      price: 60000, // 60,000 Ar
      duration: 30,
      features: ['4 écrans simultanés', 'Qualité 4K Ultra HD', 'Accès tous appareils', 'Audio spatial'],
      maxProfiles: 4,
      isActive: true
    }
  ],
  'disney-plus': [
    {
      name: 'Disney+ Mensuel',
      description: 'Accès complet à Disney+ pour 1 mois',
      price: 30000, // 30,000 Ar
      duration: 30,
      features: ['Accès illimité', 'Qualité 4K', '4 écrans simultanés', 'Téléchargement hors ligne'],
      maxProfiles: 4,
      isActive: true
    },
    {
      name: 'Disney+ Annuel',
      description: 'Accès complet à Disney+ pour 1 an avec économie',
      price: 300000, // 300,000 Ar
      duration: 365,
      features: ['Accès illimité', 'Qualité 4K', '4 écrans simultanés', 'Téléchargement hors ligne', 'Économie 17%'],
      maxProfiles: 4,
      isActive: true
    }
  ],
  'amazon-prime-video': [
    {
      name: 'Prime Video Mensuel',
      description: 'Accès à Amazon Prime Video',
      price: 20000, // 20,000 Ar
      duration: 30,
      features: ['Accès illimité', 'Qualité HD/4K', '3 écrans simultanés', 'Téléchargement hors ligne'],
      maxProfiles: 3,
      isActive: true
    },
    {
      name: 'Prime Video + Livraison',
      description: 'Prime Video + avantages Amazon Prime',
      price: 35000, // 35,000 Ar
      duration: 30,
      features: ['Prime Video complet', 'Livraison gratuite Amazon', 'Prime Reading', 'Prime Music'],
      maxProfiles: 6,
      isActive: true
    }
  ],
  'spotify-1750947067037': [
    {
      name: 'Spotify Premium',
      description: 'Accès premium à Spotify sans publicité',
      price: 15000, // 15,000 Ar
      duration: 30,
      features: ['Sans publicité', 'Qualité audio élevée', 'Écoute hors ligne', 'Lecture aléatoire désactivée'],
      maxProfiles: 1,
      isActive: true
    },
    {
      name: 'Spotify Famille',
      description: 'Spotify Premium pour 6 comptes',
      price: 25000, // 25,000 Ar
      duration: 30,
      features: ['6 comptes Premium', 'Mix famille', 'Contrôle parental', 'Adresses séparées'],
      maxProfiles: 6,
      isActive: true
    }
  ],
  'youtube-premium-1750947070713': [
    {
      name: 'YouTube Premium',
      description: 'YouTube sans pub + YouTube Music',
      price: 18000, // 18,000 Ar
      duration: 30,
      features: ['Sans publicité', 'Lecture en arrière-plan', 'YouTube Music inclus', 'Téléchargement vidéos'],
      maxProfiles: 1,
      isActive: true
    },
    {
      name: 'YouTube Premium Famille',
      description: 'YouTube Premium pour 6 membres',
      price: 30000, // 30,000 Ar
      duration: 30,
      features: ['6 comptes Premium', 'YouTube Music pour tous', 'Partage familial', 'Contrôle parental'],
      maxProfiles: 6,
      isActive: true
    }
  ]
};

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

async function createStreamingOffers() {
  try {
    console.log('🎬 Récupération des plateformes...');
    
    // Récupérer toutes les plateformes
    const platforms = await prisma.platform.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      }
    });
    
    console.log('Plateformes disponibles:');
    platforms.forEach(platform => {
      console.log(`- ${platform.name} (${platform.slug})`);
    });
    
    // Définir les offres par plateforme
    const offersByPlatform = {
      'netflix': [
        {
          name: 'Netflix Essentiel',
          description: 'Accès à Netflix avec qualité standard sur 1 écran',
          price: 25000, // 25,000 Ar
          duration: 30, // 30 jours
          features: ['1 écran simultané', 'Qualité HD', 'Accès mobile et tablette'],
          maxProfiles: 1,
          isActive: true
        },
        {
          name: 'Netflix Standard',
          description: 'Accès à Netflix avec qualité HD sur 2 écrans',
          price: 40000, // 40,000 Ar
          duration: 30,
          features: ['2 écrans simultanés', 'Qualité HD', 'Accès tous appareils'],
          maxProfiles: 2,
          isActive: true
        },
        {
          name: 'Netflix Premium',
          description: 'Accès à Netflix avec qualité 4K sur 4 écrans',
          price: 60000, // 60,000 Ar
          duration: 30,
          features: ['4 écrans simultanés', 'Qualité 4K Ultra HD', 'Accès tous appareils', 'Audio spatial'],
          maxProfiles: 4,
          isActive: true
        }
      ],
      'disney-plus': [
        {
          name: 'Disney+ Mensuel',
          description: 'Accès complet à Disney+ pour 1 mois',
          price: 30000, // 30,000 Ar
          duration: 30,
          features: ['Accès illimité', 'Qualité 4K', '4 écrans simultanés', 'Téléchargement hors ligne'],
          maxProfiles: 4,
          isActive: true
        },
        {
          name: 'Disney+ Annuel',
          description: 'Accès complet à Disney+ pour 1 an avec économie',
          price: 300000, // 300,000 Ar
          duration: 365,
          features: ['Accès illimité', 'Qualité 4K', '4 écrans simultanés', 'Téléchargement hors ligne', 'Économie 17%'],
          maxProfiles: 4,
          isActive: true
        }
      ],
      'amazon-prime-video': [
        {
          name: 'Prime Video Mensuel',
          description: 'Accès à Amazon Prime Video',
          price: 20000, // 20,000 Ar
          duration: 30,
          features: ['Accès illimité', 'Qualité HD/4K', '3 écrans simultanés', 'Téléchargement hors ligne'],
          maxProfiles: 3,
          isActive: true
        },
        {
          name: 'Prime Video + Livraison',
          description: 'Prime Video + avantages Amazon Prime',
          price: 35000, // 35,000 Ar
          duration: 30,
          features: ['Prime Video complet', 'Livraison gratuite Amazon', 'Prime Reading', 'Prime Music'],
          maxProfiles: 6,
          isActive: true
        }
      ],
      'spotify-1750947067037': [
        {
          name: 'Spotify Premium',
          description: 'Accès premium à Spotify sans publicité',
          price: 15000, // 15,000 Ar
          duration: 30,
          features: ['Sans publicité', 'Qualité audio élevée', 'Écoute hors ligne', 'Lecture aléatoire désactivée'],
          maxProfiles: 1,
          isActive: true
        },
        {
          name: 'Spotify Famille',
          description: 'Spotify Premium pour 6 comptes',
          price: 25000, // 25,000 Ar
          duration: 30,
          features: ['6 comptes Premium', 'Mix famille', 'Contrôle parental', 'Adresses séparées'],
          maxProfiles: 6,
          isActive: true
        }
      ],
      'youtube-premium-1750947070713': [
        {
          name: 'YouTube Premium',
          description: 'YouTube sans pub + YouTube Music',
          price: 18000, // 18,000 Ar
          duration: 30,
          features: ['Sans publicité', 'Lecture en arrière-plan', 'YouTube Music inclus', 'Téléchargement vidéos'],
          maxProfiles: 1,
          isActive: true
        },
        {
          name: 'YouTube Premium Famille',
          description: 'YouTube Premium pour 6 membres',
          price: 30000, // 30,000 Ar
          duration: 30,
          features: ['6 comptes Premium', 'YouTube Music pour tous', 'Partage familial', 'Contrôle parental'],
          maxProfiles: 6,
          isActive: true
        }
      ]
    };
    
    console.log('\n🎯 Création des offres...');
    let totalCreated = 0;
    
    for (const platform of platforms) {
      const offers = offersByPlatform[platform.slug];
      if (!offers) {
        console.log(`⚠️  Aucune offre définie pour ${platform.name}`);
        continue;
      }
      
      console.log(`\n📺 Création des offres pour ${platform.name}:`);
      
      for (const offerData of offers) {
        try {
          // Créer l'offre d'abord
          const offer = await prisma.offer.create({
            data: {
              name: offerData.name,
              description: offerData.description,
              price: offerData.price,
              duration: offerData.duration,
              features: JSON.stringify(offerData.features), // Convertir en JSON string
              maxProfiles: offerData.maxProfiles,
              isActive: offerData.isActive,
              type: 'SUBSCRIPTION' // Type par défaut
            }
          });
          
          // Créer la relation PlatformOffer
          await prisma.platformOffer.create({
            data: {
              platformId: platform.id,
              offerId: offer.id,
              profileCount: offerData.maxProfiles,
              isDefault: false
            }
          });
          
          console.log(`  ✅ ${offer.name} - ${offer.price} Ar`);
          totalCreated++;
          
        } catch (error) {
          console.error(`  ❌ Erreur pour ${offerData.name}:`, error.message);
        }
      }
    }
    
    console.log(`\n🎉 ${totalCreated} offres créées avec succès !`);
    
    // Afficher le résumé
    console.log('\n=== RÉSUMÉ DES OFFRES CRÉÉES ===');
    const allOffers = await prisma.offer.findMany({
      include: {
        platformOffers: {
          include: {
            platform: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { price: 'asc' }
      ]
    });
    
    allOffers.forEach(offer => {
      const features = JSON.parse(offer.features || '[]');
      const platformNames = offer.platformOffers.map(po => po.platform.name).join(', ');
      console.log(`${platformNames} - ${offer.name}: ${offer.price} Ar (${offer.duration} jours)`);
      console.log(`  Features: ${features.join(', ')}`);
      console.log(`  Max profils: ${offer.maxProfiles}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createStreamingOffers(); 