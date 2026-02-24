import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const platforms = [
      {
        name: 'Netflix',
        slug: 'netflix',
        description: 'Le leader mondial du streaming',
        websiteUrl: 'https://www.netflix.com',
        type: 'VIDEO',
        hasProfiles: true,
        maxProfilesPerAccount: 5,
        isActive: true,
        features: JSON.stringify(['HD', 'Ultra HD', 'HDR', 'Dolby Vision', 'Dolby Atmos']),
        pricingModel: 'SUBSCRIPTION'
      },
      {
        name: 'Disney+',
        slug: 'disney-plus',
        description: 'La maison de Disney, Marvel, Star Wars et plus',
        websiteUrl: 'https://www.disneyplus.com',
        type: 'VIDEO',
        hasProfiles: true,
        maxProfilesPerAccount: 7,
        isActive: true,
        features: JSON.stringify(['HD', 'Ultra HD', 'HDR', 'IMAX Enhanced']),
        pricingModel: 'SUBSCRIPTION'
      }
    ]

    // Création/mise à jour des plateformes initiales
    for (const platformData of platforms) {
      try {
        const platform = await prisma.platform.upsert({
          where: { slug: platformData.slug },
          update: platformData,
          create: platformData
        })
        console.log(`Plateforme créée/mise à jour avec succès: ${platform.name}`)
      } catch (error) {
        console.error(`Erreur lors de la création/mise à jour de la plateforme ${platformData.name}:`, error)
      }
    }

    // Spotify
    await prisma.platform.upsert({
      where: { slug: 'spotify' },
      update: {},
      create: {
        name: 'Spotify',
        slug: 'spotify',
        description: 'Le service de streaming musical leader avec des millions de titres',
        logo: '/images/platforms/spotify.png',
        websiteUrl: 'https://www.spotify.com',
        type: 'MUSIC',
        hasProfiles: false,
        maxProfilesPerAccount: 1,
        isActive: true,
        tags: JSON.stringify(['musique', 'podcasts', 'playlists']),
        popularity: 4.9,
        features: JSON.stringify(['Qualité HD', 'Mode hors connexion', 'Crossfade']),
        pricingModel: 'FREEMIUM'
      }
    })

    // Prime Video
    await prisma.platform.upsert({
      where: { slug: 'prime-video' },
      update: {},
      create: {
        name: 'Prime Video',
        slug: 'prime-video',
        description: 'Le service de streaming d\'Amazon avec des contenus exclusifs et des achats à la carte',
        logo: '/images/platforms/prime.png',
        websiteUrl: 'https://www.primevideo.com',
        type: 'VIDEO',
        hasProfiles: true,
        maxProfilesPerAccount: 6,
        isActive: true,
        tags: JSON.stringify(['films', 'séries', 'sport', 'achat', 'location']),
        popularity: 4.5,
        features: JSON.stringify(['4K', 'HDR', 'X-Ray', 'Watch Party']),
        pricingModel: 'SUBSCRIPTION'
      }
    })

    // Canal+
    await prisma.platform.upsert({
      where: { slug: 'canal-plus' },
      update: {},
      create: {
        name: 'Canal+',
        slug: 'canal-plus',
        description: 'Le bouquet premium français avec du cinéma, du sport et des séries',
        logo: '/images/platforms/canal.png',
        websiteUrl: 'https://www.canalplus.com',
        type: 'VIDEO',
        hasProfiles: true,
        maxProfilesPerAccount: 4,
        isActive: true,
        tags: JSON.stringify(['films', 'séries', 'sport', 'documentaires', 'live']),
        popularity: 4.3,
        features: JSON.stringify(['4K', 'Multi-live', 'Téléchargement', 'Start-over']),
        pricingModel: 'SUBSCRIPTION'
      }
    })

    // YouTube Premium
    await prisma.platform.upsert({
      where: { slug: 'youtube' },
      update: {},
      create: {
        name: 'YouTube Premium',
        slug: 'youtube',
        description: 'La plus grande plateforme de vidéos en ligne, sans publicité',
        logo: '/images/platforms/youtube.png',
        websiteUrl: 'https://www.youtube.com',
        type: 'VIDEO',
        hasProfiles: false,
        maxProfilesPerAccount: 1,
        isActive: true,
        tags: JSON.stringify(['vidéos', 'musique', 'gaming', 'éducation']),
        popularity: 4.7,
        features: JSON.stringify(['Background Play', 'Downloads', 'Ad-free', 'YouTube Music']),
        pricingModel: 'FREEMIUM'
      }
    })

    // Deezer
    await prisma.platform.upsert({
      where: { slug: 'deezer' },
      update: {},
      create: {
        name: 'Deezer',
        slug: 'deezer',
        description: 'Service de streaming musical français avec une large bibliothèque',
        logo: '/images/platforms/deezer.png',
        websiteUrl: 'https://www.deezer.com',
        type: 'MUSIC',
        hasProfiles: false,
        maxProfilesPerAccount: 1,
        isActive: true,
        tags: JSON.stringify(['musique', 'podcasts', 'flow', 'lyrics']),
        popularity: 4.2,
        features: JSON.stringify(['HiFi', 'Lyrics', 'Flow', 'Offline Mode']),
        pricingModel: 'FREEMIUM'
      }
    })

    console.log('✅ Plateformes ajoutées avec succès')
  } catch (error) {
    console.error('Erreur lors de l\'exécution du script:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 