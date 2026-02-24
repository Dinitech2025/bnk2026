import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function updateSpotify() {
  try {
    console.log('🔄 Connexion à la base de données en ligne...')
    
    const result = await prisma.platform.upsert({
      where: {
        slug: 'spotify'
      },
      update: {
        hasProfiles: false,
        maxProfilesPerAccount: 0
      },
      create: {
        name: 'Spotify',
        slug: 'spotify',
        description: 'Le service de streaming musical leader avec des millions de titres',
        logo: '/images/platforms/spotify.png',
        websiteUrl: 'https://www.spotify.com',
        type: 'MUSIC',
        hasProfiles: false,
        maxProfilesPerAccount: 0,
        isActive: true,
        tags: JSON.stringify(['musique', 'podcasts', 'playlists']),
        popularity: 4.9,
        features: JSON.stringify(['Qualité HD', 'Mode hors connexion', 'Crossfade']),
        pricingModel: 'FREEMIUM'
      }
    })

    console.log('✅ Configuration de Spotify mise à jour avec succès')
    console.log('📝 Détails de la mise à jour:', result)
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de Spotify:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateSpotify() 