import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 Création des données de test...')

    // 1. Création des utilisateurs
    const users = await createUsers()
    console.log('✅ Utilisateurs créés')

    // 2. Création des plateformes
    const platforms = await createPlatforms()
    console.log('✅ Plateformes créées')

    // 3. Création des offres
    const offers = await createOffers(platforms)
    console.log('✅ Offres créées')

    // 4. Création des comptes
    const accounts = await createAccounts(platforms)
    console.log('✅ Comptes créés')

    // 5. Création des abonnements
    await createSubscriptions(users.filter(u => u.role === 'CLIENT'), offers, accounts)
    console.log('✅ Abonnements créés')

    console.log('✨ Données de test créées avec succès !')
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function createUsers() {
  const users = []
  
  // Admin principal
  users.push(await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      name: 'Admin Principal',
      firstName: 'Admin',
      lastName: 'Principal'
    },
    create: {
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      name: 'Admin Principal',
      firstName: 'Admin',
      lastName: 'Principal'
    }
  }))

  // Admin secondaire
  users.push(await prisma.user.upsert({
    where: { email: 'admin2@example.com' },
    update: {
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      name: 'Admin Secondaire',
      firstName: 'Admin',
      lastName: 'Secondaire'
    },
    create: {
      email: 'admin2@example.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      name: 'Admin Secondaire',
      firstName: 'Admin',
      lastName: 'Secondaire'
    }
  }))

  // Clients actifs
  for (let i = 1; i <= 3; i++) {
    users.push(await prisma.user.upsert({
      where: { email: `client${i}@example.com` },
      update: {
        password: await bcrypt.hash('client123', 10),
        role: 'CLIENT',
        name: `Client ${i}`,
        firstName: `Prénom${i}`,
        lastName: `Nom${i}`
      },
      create: {
        email: `client${i}@example.com`,
        password: await bcrypt.hash('client123', 10),
        role: 'CLIENT',
        name: `Client ${i}`,
        firstName: `Prénom${i}`,
        lastName: `Nom${i}`
      }
    }))
  }

  // Client inactif
  users.push(await prisma.user.upsert({
    where: { email: 'client.inactif@example.com' },
    update: {
      password: await bcrypt.hash('client123', 10),
      role: 'CLIENT',
      name: 'Client Inactif',
      firstName: 'Client',
      lastName: 'Inactif'
    },
    create: {
      email: 'client.inactif@example.com',
      password: await bcrypt.hash('client123', 10),
      role: 'CLIENT',
      name: 'Client Inactif',
      firstName: 'Client',
      lastName: 'Inactif'
    }
  }))

  return users
}

async function createPlatforms() {
  const platforms = []

  // Netflix (avec profils)
  platforms.push(await prisma.platform.upsert({
    where: { slug: 'netflix' },
    update: {
      name: 'Netflix',
      description: 'Le leader mondial du streaming vidéo',
      logo: '/images/platforms/netflix.png',
      websiteUrl: 'https://www.netflix.com',
      type: 'VIDEO',
      hasProfiles: true,
      maxProfilesPerAccount: 5,
      isActive: true,
      tags: JSON.stringify(['films', 'séries', '4K', 'HDR']),
      popularity: 5.0,
      features: JSON.stringify(['4K', 'HDR', 'Dolby Vision', 'Téléchargements'])
    },
    create: {
      name: 'Netflix',
      slug: 'netflix',
      description: 'Le leader mondial du streaming vidéo',
      logo: '/images/platforms/netflix.png',
      websiteUrl: 'https://www.netflix.com',
      type: 'VIDEO',
      hasProfiles: true,
      maxProfilesPerAccount: 5,
      isActive: true,
      tags: JSON.stringify(['films', 'séries', '4K', 'HDR']),
      popularity: 5.0,
      features: JSON.stringify(['4K', 'HDR', 'Dolby Vision', 'Téléchargements'])
    }
  }))

  // Disney+ (avec profils)
  platforms.push(await prisma.platform.upsert({
    where: { slug: 'disney-plus' },
    update: {
      name: 'Disney+',
      description: 'La maison de Disney, Marvel, Star Wars et plus',
      logo: '/images/platforms/disney.png',
      websiteUrl: 'https://www.disneyplus.com',
      type: 'VIDEO',
      hasProfiles: true,
      maxProfilesPerAccount: 4,
      isActive: true,
      tags: JSON.stringify(['disney', 'marvel', 'star wars', '4K']),
      popularity: 4.8,
      features: JSON.stringify(['4K', 'IMAX Enhanced', 'GroupWatch'])
    },
    create: {
      name: 'Disney+',
      slug: 'disney-plus',
      description: 'La maison de Disney, Marvel, Star Wars et plus',
      logo: '/images/platforms/disney.png',
      websiteUrl: 'https://www.disneyplus.com',
      type: 'VIDEO',
      hasProfiles: true,
      maxProfilesPerAccount: 4,
      isActive: true,
      tags: JSON.stringify(['disney', 'marvel', 'star wars', '4K']),
      popularity: 4.8,
      features: JSON.stringify(['4K', 'IMAX Enhanced', 'GroupWatch'])
    }
  }))

  // Spotify (sans profils)
  platforms.push(await prisma.platform.upsert({
    where: { slug: 'spotify' },
    update: {
      name: 'Spotify',
      description: 'Le service de streaming musical leader',
      logo: '/images/platforms/spotify.png',
      websiteUrl: 'https://www.spotify.com',
      type: 'MUSIC',
      hasProfiles: false,
      maxProfilesPerAccount: 0,
      isActive: true,
      tags: JSON.stringify(['musique', 'podcasts', 'playlists']),
      popularity: 4.9,
      features: JSON.stringify(['Qualité HD', 'Mode hors connexion', 'Crossfade'])
    },
    create: {
      name: 'Spotify',
      slug: 'spotify',
      description: 'Le service de streaming musical leader',
      logo: '/images/platforms/spotify.png',
      websiteUrl: 'https://www.spotify.com',
      type: 'MUSIC',
      hasProfiles: false,
      maxProfilesPerAccount: 0,
      isActive: true,
      tags: JSON.stringify(['musique', 'podcasts', 'playlists']),
      popularity: 4.9,
      features: JSON.stringify(['Qualité HD', 'Mode hors connexion', 'Crossfade'])
    }
  }))

  // Prime Video (avec profils)
  platforms.push(await prisma.platform.upsert({
    where: { slug: 'prime-video' },
    update: {
      name: 'Prime Video',
      description: 'Le service de streaming d\'Amazon',
      logo: '/images/platforms/prime.png',
      websiteUrl: 'https://www.primevideo.com',
      type: 'VIDEO',
      hasProfiles: true,
      maxProfilesPerAccount: 6,
      isActive: true,
      tags: JSON.stringify(['films', 'séries', 'amazon originals']),
      popularity: 4.7,
      features: JSON.stringify(['4K', 'HDR', 'X-Ray'])
    },
    create: {
      name: 'Prime Video',
      slug: 'prime-video',
      description: 'Le service de streaming d\'Amazon',
      logo: '/images/platforms/prime.png',
      websiteUrl: 'https://www.primevideo.com',
      type: 'VIDEO',
      hasProfiles: true,
      maxProfilesPerAccount: 6,
      isActive: true,
      tags: JSON.stringify(['films', 'séries', 'amazon originals']),
      popularity: 4.7,
      features: JSON.stringify(['4K', 'HDR', 'X-Ray'])
    }
  }))

  // Plateforme inactive
  platforms.push(await prisma.platform.upsert({
    where: { slug: 'inactive' },
    update: {
      name: 'Plateforme Inactive',
      description: 'Une plateforme inactive pour les tests',
      logo: '/images/platforms/default.png',
      websiteUrl: 'https://example.com',
      type: 'VIDEO',
      hasProfiles: true,
      maxProfilesPerAccount: 2,
      isActive: false,
      tags: JSON.stringify(['test']),
      popularity: 0,
      features: JSON.stringify(['Test'])
    },
    create: {
      name: 'Plateforme Inactive',
      slug: 'inactive',
      description: 'Une plateforme inactive pour les tests',
      logo: '/images/platforms/default.png',
      websiteUrl: 'https://example.com',
      type: 'VIDEO',
      hasProfiles: true,
      maxProfilesPerAccount: 2,
      isActive: false,
      tags: JSON.stringify(['test']),
      popularity: 0,
      features: JSON.stringify(['Test'])
    }
  }))

  return platforms
}

async function createOffers(platforms) {
  const offers = []

  // Offres Netflix
  const netflixStandardId = 'netflix-standard'
  offers.push(await prisma.offer.upsert({
    where: { id: netflixStandardId },
    update: {
      description: 'Qualité HD sur 2 écrans',
      price: 13.49,
      maxProfiles: 2,
      isActive: true,
      duration: 30,
      features: JSON.stringify(['HD', '2 écrans simultanés']),
      platformOffers: {
        create: {
          platform: {
            connect: { id: platforms[0].id }
          }
        }
      }
    },
    create: {
      id: netflixStandardId,
      name: 'Netflix Standard',
      description: 'Qualité HD sur 2 écrans',
      price: 13.49,
      maxProfiles: 2,
      isActive: true,
      duration: 30,
      features: JSON.stringify(['HD', '2 écrans simultanés']),
      platformOffers: {
        create: {
          platform: {
            connect: { id: platforms[0].id }
          }
        }
      }
    }
  }))

  const netflixPremiumId = 'netflix-premium'
  offers.push(await prisma.offer.upsert({
    where: { id: netflixPremiumId },
    update: {
      description: 'Qualité 4K sur 4 écrans',
      price: 17.99,
      maxProfiles: 4,
      isActive: true,
      duration: 30,
      features: JSON.stringify(['4K', '4 écrans simultanés', 'HDR']),
      platformOffers: {
        create: {
          platform: {
            connect: { id: platforms[0].id }
          }
        }
      }
    },
    create: {
      id: netflixPremiumId,
      name: 'Netflix Premium',
      description: 'Qualité 4K sur 4 écrans',
      price: 17.99,
      maxProfiles: 4,
      isActive: true,
      duration: 30,
      features: JSON.stringify(['4K', '4 écrans simultanés', 'HDR']),
      platformOffers: {
        create: {
          platform: {
            connect: { id: platforms[0].id }
          }
        }
      }
    }
  }))

  // Offres Disney+
  const disneyStandardId = 'disney-standard'
  offers.push(await prisma.offer.upsert({
    where: { id: disneyStandardId },
    update: {
      description: 'Tout le catalogue en HD',
      price: 8.99,
      maxProfiles: 4,
      isActive: true,
      duration: 30,
      features: JSON.stringify(['HD', '4 écrans simultanés']),
      platformOffers: {
        create: {
          platform: {
            connect: { id: platforms[1].id }
          }
        }
      }
    },
    create: {
      id: disneyStandardId,
      name: 'Disney+ Standard',
      description: 'Tout le catalogue en HD',
      price: 8.99,
      maxProfiles: 4,
      isActive: true,
      duration: 30,
      features: JSON.stringify(['HD', '4 écrans simultanés']),
      platformOffers: {
        create: {
          platform: {
            connect: { id: platforms[1].id }
          }
        }
      }
    }
  }))

  // Offres Spotify
  const spotifyPremiumId = 'spotify-premium'
  offers.push(await prisma.offer.upsert({
    where: { id: spotifyPremiumId },
    update: {
      description: 'Musique sans pub',
      price: 9.99,
      maxProfiles: 1,
      isActive: true,
      duration: 30,
      features: JSON.stringify(['Sans pub', 'Qualité supérieure']),
      platformOffers: {
        create: {
          platform: {
            connect: { id: platforms[2].id }
          }
        }
      }
    },
    create: {
      id: spotifyPremiumId,
      name: 'Spotify Premium',
      description: 'Musique sans pub',
      price: 9.99,
      maxProfiles: 1,
      isActive: true,
      duration: 30,
      features: JSON.stringify(['Sans pub', 'Qualité supérieure']),
      platformOffers: {
        create: {
          platform: {
            connect: { id: platforms[2].id }
          }
        }
      }
    }
  }))

  const spotifyDuoId = 'spotify-duo'
  offers.push(await prisma.offer.upsert({
    where: { id: spotifyDuoId },
    update: {
      description: 'Pour 2 personnes',
      price: 12.99,
      maxProfiles: 1,
      isActive: true,
      duration: 30,
      features: JSON.stringify(['2 comptes Premium']),
      platformOffers: {
        create: {
          platform: {
            connect: { id: platforms[2].id }
          }
        }
      }
    },
    create: {
      id: spotifyDuoId,
      name: 'Spotify Duo',
      description: 'Pour 2 personnes',
      price: 12.99,
      maxProfiles: 1,
      isActive: true,
      duration: 30,
      features: JSON.stringify(['2 comptes Premium']),
      platformOffers: {
        create: {
          platform: {
            connect: { id: platforms[2].id }
          }
        }
      }
    }
  }))

  // Offre inactive
  const inactiveOfferId = 'inactive-offer'
  offers.push(await prisma.offer.upsert({
    where: { id: inactiveOfferId },
    update: {
      description: 'Une offre inactive pour les tests',
      price: 0,
      maxProfiles: 1,
      isActive: false,
      duration: 30,
      features: JSON.stringify(['Test']),
      platformOffers: {
        create: {
          platform: {
            connect: { id: platforms[4].id }
          }
        }
      }
    },
    create: {
      id: inactiveOfferId,
      name: 'Offre Inactive',
      description: 'Une offre inactive pour les tests',
      price: 0,
      maxProfiles: 1,
      isActive: false,
      duration: 30,
      features: JSON.stringify(['Test']),
      platformOffers: {
        create: {
          platform: {
            connect: { id: platforms[4].id }
          }
        }
      }
    }
  }))

  return offers
}

async function createAccounts(platforms) {
  const accounts = []

  // Comptes Netflix
  for (let i = 1; i <= 3; i++) {
    const platform = platforms[0] // Netflix
    const account = await prisma.account.create({
      data: {
        username: `netflix${i}@test.com`,
        password: 'password123',
        email: `netflix${i}@test.com`,
        platformId: platform.id,
        status: 'AVAILABLE',
        accountProfiles: platform.hasProfiles ? {
          create: Array.from({ length: platform.maxProfilesPerAccount }, (_, j) => ({
            name: `Profil ${j + 1}`,
            pin: '1234',
            isAssigned: false,
            profileSlot: j + 1
          }))
        } : undefined
      },
      include: {
        accountProfiles: true
      }
    })
    accounts.push(account)
  }

  // Comptes Disney+
  for (let i = 1; i <= 2; i++) {
    const platform = platforms[1] // Disney+
    const account = await prisma.account.create({
      data: {
        username: `disney${i}@test.com`,
        password: 'password123',
        email: `disney${i}@test.com`,
        platformId: platform.id,
        status: 'AVAILABLE',
        accountProfiles: platform.hasProfiles ? {
          create: Array.from({ length: platform.maxProfilesPerAccount }, (_, j) => ({
            name: `Profil ${j + 1}`,
            pin: '1234',
            isAssigned: false,
            profileSlot: j + 1
          }))
        } : undefined
      },
      include: {
        accountProfiles: true
      }
    })
    accounts.push(account)
  }

  // Comptes Spotify (sans profils)
  for (let i = 1; i <= 2; i++) {
    const platform = platforms[2] // Spotify
    const account = await prisma.account.create({
      data: {
        username: `spotify${i}@test.com`,
        password: 'password123',
        email: `spotify${i}@test.com`,
        platformId: platform.id,
        status: 'AVAILABLE'
      }
    })
    accounts.push(account)
  }

  // Comptes Prime Video
  for (let i = 1; i <= 2; i++) {
    const platform = platforms[3] // Prime Video
    const account = await prisma.account.create({
      data: {
        username: `prime${i}@test.com`,
        password: 'password123',
        email: `prime${i}@test.com`,
        platformId: platform.id,
        status: 'AVAILABLE',
        accountProfiles: platform.hasProfiles ? {
          create: Array.from({ length: platform.maxProfilesPerAccount }, (_, j) => ({
            name: `Profil ${j + 1}`,
            pin: '1234',
            isAssigned: false,
            profileSlot: j + 1
          }))
        } : undefined
      },
      include: {
        accountProfiles: true
      }
    })
    accounts.push(account)
  }

  // Compte en maintenance
  accounts.push(await prisma.account.create({
    data: {
      username: 'maintenance@test.com',
      password: 'password123',
      email: 'maintenance@test.com',
      platformId: platforms[0].id,
      status: 'MAINTENANCE',
      accountProfiles: platforms[0].hasProfiles ? {
        create: Array.from({ length: platforms[0].maxProfilesPerAccount }, (_, j) => ({
          name: `Profil ${j + 1}`,
          pin: '1234',
          isAssigned: false,
          profileSlot: j + 1
        }))
      } : undefined
    },
    include: {
      accountProfiles: true
    }
  }))

  return accounts
}

async function createSubscriptions(clients, offers, accounts) {
  // Abonnement Netflix Standard
  const netflixSubscription = await prisma.subscription.create({
    data: {
      userId: clients[0].id,
      offerId: offers[0].id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      subscriptionAccounts: {
        create: {
          accountId: accounts[0].id,
          status: 'ACTIVE'
        }
      },
      Profile: {
        create: [
          {
            accountId: accounts[0].id,
            profileSlot: 1,
            name: 'Profil Principal'
          },
          {
            accountId: accounts[0].id,
            profileSlot: 2,
            name: 'Profil Secondaire'
          }
        ]
      },
      UserSubscription: {
        create: {
          userId: clients[0].id,
          isOwner: true
        }
      }
    }
  })

  // Mise à jour des AccountProfiles pour les marquer comme assignés
  await prisma.accountProfile.updateMany({
    where: {
      accountId: accounts[0].id,
      profileSlot: { in: [1, 2] }
    },
    data: {
      isAssigned: true,
      subscriptionId: netflixSubscription.id
    }
  })

  // Abonnement Disney+
  const disneySubscription = await prisma.subscription.create({
    data: {
      userId: clients[1].id,
      offerId: offers[2].id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      subscriptionAccounts: {
        create: {
          accountId: accounts[3].id,
          status: 'ACTIVE'
        }
      },
      Profile: {
        create: [
          {
            accountId: accounts[3].id,
            profileSlot: 1,
            name: 'Profil Disney'
          }
        ]
      },
      UserSubscription: {
        create: {
          userId: clients[1].id,
          isOwner: true
        }
      }
    }
  })

  // Mise à jour des AccountProfiles pour Disney+
  await prisma.accountProfile.updateMany({
    where: {
      accountId: accounts[3].id,
      profileSlot: 1
    },
    data: {
      isAssigned: true,
      subscriptionId: disneySubscription.id
    }
  })

  // Abonnement Spotify (sans profil)
  await prisma.subscription.create({
    data: {
      userId: clients[2].id,
      offerId: offers[3].id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      subscriptionAccounts: {
        create: {
          accountId: accounts[4].id,
          status: 'ACTIVE'
        }
      },
      UserSubscription: {
        create: {
          userId: clients[2].id,
          isOwner: true
        }
      }
    }
  })

  // Abonnement expiré
  await prisma.subscription.create({
    data: {
      userId: clients[0].id,
      offerId: offers[1].id,
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      status: 'EXPIRED',
      UserSubscription: {
        create: {
          userId: clients[0].id,
          isOwner: true
        }
      }
    }
  })
}

main() 