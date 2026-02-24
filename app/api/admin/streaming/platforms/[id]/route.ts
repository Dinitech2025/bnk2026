import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireStaff } from '@/lib/auth'
import { slugify } from '@/lib/utils'
import { Platform, Prisma, PlatformProviderOffer } from '@prisma/client'

type PlatformUpdateData = {
  name: string
  slug: string
  description: string | null
  logo: string | null
  websiteUrl: string | null
  isActive: boolean
  type: string
  hasProfiles: boolean
  maxProfilesPerAccount: number | null
  hasMultipleOffers: boolean
  hasGiftCards: boolean
  features: string | null
  tags: string | null
  popularity: number | null
  pricingModel: string | null
  logoMediaId: string | null
}

interface UpdatePlatformData extends Partial<Platform> {
  logoMediaId?: string | null
}

type PlatformWithRelations = Prisma.PlatformGetPayload<{
  include: {
    logoMedia: {
      select: {
        path: true
      }
    }
    providerOffers: true
  }
}>

// GET - Récupérer une plateforme spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Mode développement - désactiver temporairement l'authentification
    // En production, ce code serait remplacé par: const user = await requireStaff()

    // Récupérer la plateforme
    const platform = await db.platform.findUnique({
      where: {
        id: params.id,
      },
      include: {
        logoMedia: {
          select: {
            path: true
          }
        },
        providerOffers: {
          where: {
            isActive: true
          },
          orderBy: {
            name: 'asc'
          }
        }
      },
    }) as PlatformWithRelations | null

    if (!platform) {
      return NextResponse.json(
        { message: 'Plateforme non trouvée' },
        { status: 404 }
      )
    }

    // Formater les données pour l'API
    const formattedPlatform = {
      ...platform,
      logo: platform.logoMedia?.path || platform.logo,
      providerOffers: platform.providerOffers?.map(offer => ({
        ...offer,
        price: parseFloat(offer.price.toString()),
        deviceCount: parseInt(offer.deviceCount.toString())
      })) || []
    }

    return NextResponse.json(formattedPlatform)
  } catch (error) {
    console.error('Erreur lors de la récupération de la plateforme:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour une plateforme
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Mode développement - désactiver temporairement l'authentification
    // En production, ce code serait remplacé par:
    // const user = await requireStaff()
    // if (user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { message: 'Seuls les administrateurs peuvent modifier des plateformes' },
    //     { status: 403 }
    //   )
    // }

    // Récupérer les données du corps de la requête
    const data = await request.json()

    // Valider les données requises
    if (!data.name) {
      return NextResponse.json(
        { message: 'Le nom est requis' },
        { status: 400 }
      )
    }
    
    // Générer le slug automatiquement à partir du nom
    const slug = slugify(data.name)

    // Vérifier si la plateforme existe
    const existingPlatform = await db.platform.findUnique({
      where: {
        id: params.id,
      },
      include: {
        providerOffers: true
      }
    })

    if (!existingPlatform) {
      return NextResponse.json(
        { message: 'Plateforme non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier si le slug est déjà utilisé par une autre plateforme
    if (slug !== existingPlatform.slug) {
      const slugExists = await db.platform.findUnique({
        where: {
          slug,
        },
      })

      if (slugExists && slugExists.id !== params.id) {
        return NextResponse.json(
          { message: 'Une plateforme avec ce slug existe déjà' },
          { status: 400 }
        )
      }
    }

    // Si la plateforme n'a plus d'offres multiples, supprimer les offres fournisseur
    if (!data.hasMultipleOffers && existingPlatform.hasMultipleOffers) {
      await db.platformProviderOffer.deleteMany({
        where: {
          platformId: params.id
        }
      })
    }

    // Préparer les données de mise à jour
    const updateData: PlatformUpdateData = {
      name: data.name,
      slug,
      description: data.description || null,
      logo: data.logo || null,
      websiteUrl: data.websiteUrl || null,
      isActive: data.isActive ?? existingPlatform.isActive,
      type: data.type || existingPlatform.type,
      hasProfiles: data.hasProfiles ?? existingPlatform.hasProfiles,
      maxProfilesPerAccount: data.maxProfilesPerAccount ?? existingPlatform.maxProfilesPerAccount,
      hasMultipleOffers: data.hasMultipleOffers ?? existingPlatform.hasMultipleOffers,
      hasGiftCards: data.hasGiftCards ?? existingPlatform.hasGiftCards,
      features: data.features || existingPlatform.features,
      tags: data.tags || existingPlatform.tags,
      popularity: data.popularity || existingPlatform.popularity,
      pricingModel: data.pricingModel || existingPlatform.pricingModel,
      logoMediaId: data.logoMediaId || existingPlatform.logoMediaId
    }

    // Mettre à jour la plateforme
    const updatedPlatform = await db.platform.update({
      where: {
        id: params.id,
      },
      data: updateData,
      include: {
        logoMedia: {
          select: {
            path: true
          }
        },
        providerOffers: true
      },
    }) as PlatformWithRelations

    // Formater les données pour l'API
    const formattedPlatform = {
      ...updatedPlatform,
      logo: updatedPlatform.logoMedia?.path || updatedPlatform.logo,
      providerOffers: updatedPlatform.providerOffers?.map(offer => ({
        ...offer,
        price: parseFloat(offer.price.toString()),
        deviceCount: parseInt(offer.deviceCount.toString())
      })) || []
    }

    return NextResponse.json(formattedPlatform)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la plateforme:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour partiellement une plateforme (ex: statut actif/inactif)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Mode développement - désactiver temporairement l'authentification
    // En production, ce code serait remplacé par: const user = await requireStaff()

    // Récupérer les données du corps de la requête
    const data = await request.json()

    // Vérifier si la plateforme existe
    const existingPlatform = await db.platform.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingPlatform) {
      return NextResponse.json(
        { message: 'Plateforme non trouvée' },
        { status: 404 }
      )
    }

    // Si le nom est fourni, générer un nouveau slug
    let updateData = { ...data }
    if (data.name) {
      updateData.slug = slugify(data.name)
    }

    // Mettre à jour la plateforme
    const updatedPlatform = await db.platform.update({
      where: {
        id: params.id,
      },
      data: updateData,
    })

    return NextResponse.json(updatedPlatform)
  } catch (error) {
    console.error('Erreur lors de la mise à jour partielle de la plateforme:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une plateforme
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Mode développement - désactiver temporairement l'authentification
    // En production, ce code serait remplacé par:
    // const user = await requireStaff()
    // if (user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { message: 'Seuls les administrateurs peuvent supprimer des plateformes' },
    //     { status: 403 }
    //   )
    // }

    // Vérifier si la plateforme existe avec ses relations
    const existingPlatform = await db.platform.findUnique({
      where: {
        id: params.id,
      },
      include: {
        accounts: true,
        platformOffers: true,
        providerOffers: true,
        giftCards: true
      },
    })

    if (!existingPlatform) {
      return NextResponse.json(
        { message: 'Plateforme non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier s'il y a des dépendances
    if (existingPlatform.accounts.length > 0 || 
        existingPlatform.giftCards.length > 0) {
      return NextResponse.json(
        { 
          message: 'Impossible de supprimer cette plateforme car elle est utilisée par des comptes ou des cartes cadeaux',
          error: 'FOREIGN_KEY_CONSTRAINT'
        },
        { status: 400 }
      )
    }

    // Supprimer d'abord les offres fournisseur
    await db.platformProviderOffer.deleteMany({
      where: {
        platformId: params.id
      }
    })

    // Supprimer les offres de plateforme
    await db.platformOffer.deleteMany({
      where: {
        platformId: params.id
      }
    })

    // Supprimer la plateforme
    await db.platform.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json(
      { message: 'Plateforme supprimée avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression de la plateforme:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 