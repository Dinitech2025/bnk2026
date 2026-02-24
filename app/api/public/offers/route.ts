import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const offers = await prisma.offer.findMany({
      where: {
        isActive: true,
      },
      include: {
        platformOffers: {
          include: {
            platform: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                description: true,
                type: true
              }
            }
          }
        },
        images: {
          take: 1,
        },
      },
      orderBy: {
        price: 'asc',
      },
    })

    // Transformer les données pour inclure les informations de plateforme directement
    const transformedOffers = offers.map(offer => ({
      ...offer,
      platforms: offer.platformOffers.map(po => po.platform),
      // Calculer le texte de durée
      durationText: getDurationText(offer.duration, offer.durationUnit),
      // Garder la compatibilité avec l'ancien format
      platform: offer.platformOffers[0]?.platform || null,
    }))
    
    return NextResponse.json(transformedOffers)
  } catch (error) {
    console.error('[OFFERS_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}