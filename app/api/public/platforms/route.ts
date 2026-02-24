import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const platforms = await prisma.platform.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        type: true,
        hasProfiles: true,
        maxProfilesPerAccount: true,
        popularity: true,
        logoMedia: {
          select: {
            path: true
          }
        }
      },
      orderBy: [
        {
          popularity: 'desc'
        },
        {
          name: 'asc'
        }
      ],
      take: 15 // Limiter à 15 plateformes pour le menu
    })

    // Formater les données pour inclure le logo correct
    const formattedPlatforms = platforms.map(platform => ({
      ...platform,
      logo: platform.logoMedia?.path || platform.logo
    }))

    return NextResponse.json(formattedPlatforms)
  } catch (error) {
    console.error('[PLATFORMS_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 