import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireStaff } from '@/lib/auth'
import { slugify } from '@/lib/utils'

// Validation des données
const validatePlatformData = (data: any) => {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push('Le nom est requis');
  }

  if (data.maxProfilesPerAccount !== undefined && data.maxProfilesPerAccount !== null) {
    const maxProfiles = parseInt(data.maxProfilesPerAccount);
    if (isNaN(maxProfiles) || maxProfiles < 0) {
      errors.push('Le nombre maximum de profils doit être un nombre positif');
    }
  }

  if (data.type && !['VIDEO', 'AUDIO', 'GAMING', 'OTHER'].includes(data.type)) {
    errors.push('Le type de plateforme est invalide');
  }

  if (data.websiteUrl && !isValidUrl(data.websiteUrl)) {
    errors.push('L\'URL du site web est invalide');
  }

  return errors;
};

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// GET - Récupérer toutes les plateformes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('isActive');
    const type = searchParams.get('type');

    const where: any = {};
    
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }
    
    if (type) {
      where.type = type;
    }

    const platforms = await db.platform.findMany({
      where,
      include: {
        logoMedia: {
      select: {
            path: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Récupérer les offres fournisseur séparément pour chaque plateforme
    const platformsWithOffers = await Promise.all(
      platforms.map(async (platform) => {
        const providerOffers = await db.platformProviderOffer.findMany({
          where: {
            platformId: platform.id,
            isActive: true
          },
          orderBy: {
            name: 'asc'
          }
        })

        return {
          ...platform,
          providerOffers
        }
      })
    )

    return NextResponse.json(platformsWithOffers)
  } catch (error) {
    console.error('Erreur lors de la récupération des plateformes:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des plateformes' },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle plateforme
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent créer des plateformes' },
        { status: 403 }
      )
    }

    const data = await request.json()
    
    // Validation des données
    const validationErrors = validatePlatformData(data);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { errors: validationErrors },
        { status: 400 }
      )
    }

    // Générer le slug
    const slug = data.slug || slugify(data.name)
    
    // Vérifier si le slug existe déjà
    const existingPlatform = await db.platform.findUnique({
      where: {
        slug,
      },
    })

    if (existingPlatform) {
      return NextResponse.json(
        { error: 'Une plateforme avec ce slug existe déjà' },
        { status: 400 }
      )
    }

    // Créer la plateforme
    const platform = await db.platform.create({
      data: {
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
        logo: data.logo || null,
        logoMediaId: data.logoMediaId || null,
        websiteUrl: data.websiteUrl || null,
        type: data.type || 'VIDEO',
        maxProfilesPerAccount: data.maxProfilesPerAccount !== null ? 
          parseInt(data.maxProfilesPerAccount) : 
          ['VIDEO', 'AUDIO', 'GAMING'].includes(data.type || 'VIDEO') ? 5 : null,
        hasProfiles: data.hasProfiles ?? true,
        isActive: data.isActive ?? true,
        hasMultipleOffers: data.hasMultipleOffers ?? false,
        hasGiftCards: data.hasGiftCards ?? false,
        features: data.features || null,
        tags: data.tags || null,
        popularity: data.popularity || 0,
        pricingModel: data.pricingModel || 'SUBSCRIPTION'
      },
    })

    return NextResponse.json(platform, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la plateforme:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création de la plateforme' },
      { status: 500 }
    )
  }
} 