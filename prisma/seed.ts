import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Nettoyage de la base de données
    await prisma.accountProfile.deleteMany();
    await prisma.account.deleteMany();
    await prisma.platformOffer.deleteMany();
    await prisma.offer.deleteMany();
    await prisma.platform.deleteMany();
    await prisma.user.deleteMany();

    // Création des utilisateurs
    const adminPassword = await hash('admin123', 10);
    const staffPassword = await hash('staff123', 10);
    const clientPassword = await hash('client123', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@boutiknaka.com',
        password: adminPassword,
        name: 'Admin Principal',
        role: 'ADMIN',
        preferredLanguage: 'fr',
        newsletter: true,
        customerType: 'STAFF'
      }
    });

    const staff = await prisma.user.create({
      data: {
        email: 'staff@boutiknaka.com',
        password: staffPassword,
        name: 'Staff Support',
        role: 'STAFF',
        preferredLanguage: 'fr',
        newsletter: true,
        customerType: 'STAFF'
      }
    });

    const client = await prisma.user.create({
      data: {
        email: 'client@example.com',
        password: clientPassword,
        name: 'Client Test',
        firstName: 'Client',
        lastName: 'Test',
        role: 'CLIENT',
        preferredLanguage: 'fr',
        newsletter: true,
        customerType: 'INDIVIDUAL',
        phone: '+33612345678'
      }
    });

    // Création des plateformes
    const netflix = await prisma.platform.create({
      data: {
        name: 'Netflix',
        slug: 'netflix',
        description: 'Plateforme de streaming vidéo',
        logo: 'https://netflix.com/logo.png',
        websiteUrl: 'https://netflix.com',
        type: 'VIDEO',
        hasProfiles: true,
        maxProfilesPerAccount: 5,
        isActive: true,
        tags: JSON.stringify(['streaming', 'video', 'films', 'series']),
        popularity: 5,
        features: JSON.stringify(['HD', '4K', 'HDR', 'Dolby Atmos']),
        pricingModel: 'SUBSCRIPTION'
      }
    });

    const disney = await prisma.platform.create({
      data: {
        name: 'Disney+',
        slug: 'disney-plus',
        description: 'Plateforme de streaming Disney',
        logo: 'https://disney.com/logo.png',
        websiteUrl: 'https://disneyplus.com',
        type: 'VIDEO',
        hasProfiles: true,
        maxProfilesPerAccount: 7,
        isActive: true,
        tags: JSON.stringify(['streaming', 'video', 'films', 'series', 'disney']),
        popularity: 4.5,
        features: JSON.stringify(['HD', '4K', 'HDR', 'IMAX']),
        pricingModel: 'SUBSCRIPTION'
      }
    });

    const spotify = await prisma.platform.create({
      data: {
        name: 'Spotify',
        slug: 'spotify',
        description: 'Plateforme de streaming musical',
        logo: 'https://spotify.com/logo.png',
        websiteUrl: 'https://spotify.com',
        type: 'MUSIC',
        hasProfiles: false,
        maxProfilesPerAccount: 1,
        isActive: true,
        tags: JSON.stringify(['streaming', 'music', 'audio', 'podcasts']),
        popularity: 4.8,
        features: JSON.stringify(['HQ Audio', 'Offline Mode', 'Lyrics']),
        pricingModel: 'SUBSCRIPTION'
      }
    });

    // Création des offres
    const netflixBasic = await prisma.offer.create({
      data: {
        name: 'Netflix Basic',
        description: 'Offre de base Netflix',
        type: 'SINGLE',
        price: 8.99,
        duration: 1,
        durationUnit: 'MONTH',
        features: JSON.stringify(['HD', '1 écran']),
        isPopular: false,
        isActive: true,
        maxUsers: 1,
        maxProfiles: 1,
        platformOffers: {
          create: {
            platformId: netflix.id,
            profileCount: 1,
            isDefault: true
          }
        }
      },
      include: {
        platformOffers: true
      }
    });

    const netflixStandard = await prisma.offer.create({
      data: {
        name: 'Netflix Standard',
        description: 'Offre standard Netflix',
        type: 'FAMILY',
        price: 13.49,
        duration: 1,
        durationUnit: 'MONTH',
        features: JSON.stringify(['HD', '2 écrans']),
        isPopular: true,
        isActive: true,
        maxUsers: 2,
        maxProfiles: 2,
        platformOffers: {
          create: {
            platformId: netflix.id,
            profileCount: 2,
            isDefault: false
          }
        }
      },
      include: {
        platformOffers: true
      }
    });

    const disneyFamily = await prisma.offer.create({
      data: {
        name: 'Disney+ Family',
        description: 'Offre familiale Disney+',
        type: 'FAMILY',
        price: 11.99,
        duration: 1,
        durationUnit: 'MONTH',
        features: JSON.stringify(['4K', '4 écrans', 'IMAX']),
        isPopular: true,
        isActive: true,
        maxUsers: 4,
        maxProfiles: 4,
        platformOffers: {
          create: {
            platformId: disney.id,
            profileCount: 4,
            isDefault: true
          }
        }
      },
      include: {
        platformOffers: true
      }
    });

    const spotifyPremium = await prisma.offer.create({
      data: {
        name: 'Spotify Premium',
        description: 'Offre premium Spotify',
        type: 'SINGLE',
        price: 9.99,
        duration: 1,
        durationUnit: 'MONTH',
        features: JSON.stringify(['HQ Audio', 'Offline Mode']),
        isPopular: true,
        isActive: true,
        maxUsers: 1,
        profileCount: 1,
        platformOffers: {
          create: {
            platformId: spotify.id,
            profileCount: 1,
            isDefault: true
          }
        }
      },
      include: {
        platformOffers: true
      }
    });

    // Création des comptes
    const netflixAccounts = await Promise.all(
      Array.from({ length: 5 }).map((_, i) => 
        prisma.account.create({
          data: {
            platformId: netflix.id,
            username: `netflix_account_${i + 1}`,
            email: `netflix${i + 1}@example.com`,
            password: 'password123',
            status: 'AVAILABLE'
          }
        })
      )
    );

    const disneyAccounts = await Promise.all(
      Array.from({ length: 3 }).map((_, i) => 
        prisma.account.create({
          data: {
            platformId: disney.id,
            username: `disney_account_${i + 1}`,
            email: `disney${i + 1}@example.com`,
            password: 'password123',
            status: 'AVAILABLE'
          }
        })
      )
    );

    const spotifyAccounts = await Promise.all(
      Array.from({ length: 2 }).map((_, i) => 
        prisma.account.create({
          data: {
            platformId: spotify.id,
            username: `spotify_account_${i + 1}`,
            email: `spotify${i + 1}@example.com`,
            password: 'password123',
            status: 'AVAILABLE'
          }
        })
      )
    );

    // Création des clients supplémentaires
    const clients = await Promise.all(
      Array.from({ length: 5 }).map((_, i) =>
        prisma.user.create({
          data: {
            email: `client${i + 1}@example.com`,
            password: clientPassword,
            name: `Client ${i + 1}`,
            firstName: `Prénom${i + 1}`,
            lastName: `Nom${i + 1}`,
            role: 'CLIENT',
            preferredLanguage: 'fr',
            newsletter: true,
            customerType: 'INDIVIDUAL',
            phone: `+3361234567${i}`
          }
        })
      )
    );

    // Création des abonnements avec profils
    // Netflix Standard pour le client 1
    await prisma.subscription.create({
      data: {
        userId: clients[0].id,
        offerId: netflixStandard.id,
        platformOfferId: netflixStandard.platformOffers[0].id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        autoRenew: true
      }
    });

    // Disney+ Family pour le client 2
    await prisma.subscription.create({
      data: {
        userId: clients[1].id,
        offerId: disneyFamily.id,
        platformOfferId: disneyFamily.platformOffers[0].id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        autoRenew: true
      }
    });

    // Spotify Premium pour le client 3
    await prisma.subscription.create({
      data: {
        userId: clients[2].id,
        offerId: spotifyPremium.id,
        platformOfferId: spotifyPremium.platformOffers[0].id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        autoRenew: true
      }
    });

    // Netflix Basic pour le client 4 (en attente)
    await prisma.subscription.create({
      data: {
        userId: clients[3].id,
        offerId: netflixBasic.id,
        platformOfferId: netflixBasic.platformOffers[0].id,
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        autoRenew: false
      }
    });

    // Disney+ Family pour le client 5 (expiré)
    await prisma.subscription.create({
      data: {
        userId: clients[4].id,
        offerId: disneyFamily.id,
        platformOfferId: disneyFamily.platformOffers[0].id,
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        status: 'EXPIRED',
        autoRenew: false
      }
    });

    console.log('Base de données initialisée avec succès !');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 