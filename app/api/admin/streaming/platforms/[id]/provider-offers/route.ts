import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Récupérer toutes les offres fournisseur d'une plateforme
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const offers = await db.platformProviderOffer.findMany({
      where: {
        platformId: params.id,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(offers)
  } catch (error) {
    console.error('Erreur lors de la récupération des offres:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des offres' },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle offre fournisseur
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const data = await request.json()

    // Validation des données
    if (!data.name || !data.price || !data.deviceCount) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Vérifier si la plateforme existe et supporte les offres multiples
    const platform = await db.platform.findUnique({
      where: { id: params.id }
    })

    if (!platform) {
      return NextResponse.json(
        { error: 'Plateforme non trouvée' },
        { status: 404 }
      )
    }

    if (!platform.hasMultipleOffers) {
      return NextResponse.json(
        { error: 'Cette plateforme ne supporte pas les offres multiples' },
        { status: 400 }
      )
    }

    // Vérifier si une offre avec le même nom existe déjà
    const existingOffer = await db.platformProviderOffer.findFirst({
      where: {
        platformId: params.id,
        name: data.name
      }
    })

    if (existingOffer) {
      return NextResponse.json(
        { error: 'Une offre avec ce nom existe déjà pour cette plateforme' },
        { status: 400 }
      )
    }

    // Créer l'offre
    const offer = await db.platformProviderOffer.create({
      data: {
        name: data.name,
        description: data.description || null,
        price: data.price,
        currency: data.currency || 'TRY',
        deviceCount: data.deviceCount,
        isActive: data.isActive ?? true,
        platformId: params.id,
      },
    })

    return NextResponse.json(offer, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de l\'offre:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création de l\'offre' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une offre fournisseur
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const offerId = searchParams.get('offerId')

    if (!offerId) {
      return NextResponse.json(
        { error: 'ID de l\'offre manquant' },
        { status: 400 }
      )
    }

    // Vérifier si l'offre existe et appartient à la plateforme
    const offer = await db.platformProviderOffer.findFirst({
      where: {
        id: offerId,
        platformId: params.id
      },
      include: {
        accounts: true
      }
    })

    if (!offer) {
      return NextResponse.json(
        { error: 'Offre non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier si l'offre est utilisée par des comptes
    if (offer.accounts.length > 0) {
      return NextResponse.json(
        { error: 'Cette offre est utilisée par des comptes et ne peut pas être supprimée' },
        { status: 400 }
      )
    }

    // Supprimer l'offre
    await db.platformProviderOffer.delete({
      where: {
        id: offerId
      }
    })

    return NextResponse.json(
      { message: 'Offre supprimée avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'offre:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la suppression de l\'offre' },
      { status: 500 }
    )
  }
} 