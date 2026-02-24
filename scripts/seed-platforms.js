const { PrismaClient } = require('@prisma/client')

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

    console.log('Script terminé avec succès')
  } catch (error) {
    console.error('Erreur lors de l\'exécution du script:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 
 
 
 
 