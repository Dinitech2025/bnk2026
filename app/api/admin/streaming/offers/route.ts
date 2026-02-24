import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, PrismaClient, Offer as PrismaOffer, PlatformOffer, Platform as PrismaPlatform, Media } from "@prisma/client";
import { CreateOfferData, Offer, Platform, PlatformConfig } from "@/types/offer";

interface OfferWithRelations extends PrismaOffer {
  platformOffers: (PlatformOffer & {
    platform: PrismaPlatform;
  })[];
  images: Media[];
}

export async function GET() {
  try {
    const offers = await prisma.offer.findMany({
      include: {
        platformOffers: {
          include: {
            platform: true
          }
        },
        images: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    const formattedOffers = offers.map((offer: OfferWithRelations) => ({
      id: offer.id,
      name: offer.name,
      description: offer.description,
      price: parseFloat(offer.price.toString()),
      duration: offer.duration,
      durationUnit: offer.durationUnit || "MONTH",
      features: offer.features ? JSON.parse(offer.features) : [],
      isPopular: offer.isPopular || false,
      isActive: offer.isActive || true,
      maxUsers: offer.maxUsers || 1,
      maxProfiles: offer.maxProfiles || 1,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
      images: offer.images.map((img: Media) => img.path),
      platformConfigs: offer.platformOffers.map((po) => ({
        platformId: po.platformId,
        profileCount: po.profileCount,
        isDefault: po.isDefault,
        isActive: true,
        platform: po.platform ? {
          id: po.platform.id,
          name: po.platform.name,
          logo: po.platform.logo,
          hasProfiles: po.platform.hasProfiles,
          maxProfilesPerAccount: po.platform.maxProfilesPerAccount || 1,
          isActive: po.platform.isActive
        } : undefined
      }))
    }));
    
    return NextResponse.json(formattedOffers);
  } catch (error) {
    console.error('Erreur lors de la récupération des offres:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des offres' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const data = await request.json() as CreateOfferData;

    // Validation des données
    if (!data.name) {
      return NextResponse.json(
        { error: "Le nom de l'offre est requis" },
        { status: 400 }
      );
    }
    
    if (!data.price || isNaN(Number(data.price)) || Number(data.price) <= 0) {
      return NextResponse.json(
        { error: "Le prix doit être un nombre positif" },
        { status: 400 }
      );
    }

    if (!data.duration || isNaN(Number(data.duration)) || Number(data.duration) <= 0) {
      return NextResponse.json(
        { error: "La durée doit être un nombre positif" },
        { status: 400 }
      );
    }

    if (!data.platformConfigs || !Array.isArray(data.platformConfigs) || data.platformConfigs.length === 0) {
      return NextResponse.json(
        { error: "Au moins une plateforme doit être sélectionnée" },
        { status: 400 }
      );
    }

    // Calculer le nombre total de profils
    const totalProfiles = data.platformConfigs.reduce(
      (sum, config) => sum + (config.profileCount || 1),
      0
    );

    // Créer l'offre d'abord sans les relations
    const newOffer = await prisma.offer.create({
      data: {
        name: data.name,
        description: data.description || null,
        price: new Prisma.Decimal(data.price),
        duration: data.duration,
        durationUnit: data.durationUnit || "MONTH",
        isPopular: data.isPopular ?? false,
        isActive: data.isActive ?? true,
        features: data.features && Array.isArray(data.features) ? JSON.stringify(data.features) : null,
        maxUsers: data.maxUsers || 1,
        profileCount: totalProfiles,
      }
    });

    // Ajouter les relations platformOffers
    for (const config of data.platformConfigs) {
      await prisma.platformOffer.create({
        data: {
          offerId: newOffer.id,
          platformId: config.platformId,
          profileCount: config.profileCount || 1,
          isDefault: config.isDefault ?? false,
        }
      });
    }

    // Ajouter les images
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      // Vérifier si les images sont déjà dans la base de données
      const existingMedia = await prisma.media.findMany({
        where: {
          path: {
            in: data.images
          }
        }
      });
      
      const existingPaths = existingMedia.map(media => media.path);
      
      // Connecter les images existantes à l'offre
      for (const media of existingMedia) {
        await prisma.offer.update({
          where: { id: newOffer.id },
          data: {
            images: {
              connect: { id: media.id }
            }
          }
        });
      }
      
      // Créer et connecter les nouvelles images
      const newImages = data.images.filter(img => !existingPaths.includes(img));
      for (const path of newImages) {
        const media = await prisma.media.create({
          data: {
            name: `Offer_${data.name}_image`,
            fileName: path.split('/').pop() || 'image.jpg',
            mimeType: 'image/jpeg',
            path: path,
            size: 0,
            alt: `Image pour ${data.name}`
          }
        });
        
        await prisma.offer.update({
          where: { id: newOffer.id },
          data: {
            images: {
              connect: { id: media.id }
            }
          }
        });
      }
    }

    // Récupérer l'offre complète avec toutes les relations
    const createdOffer = await prisma.offer.findUnique({
      where: { id: newOffer.id },
        include: {
          platformOffers: {
            include: {
              platform: true
            }
        },
        images: true
        }
      });

    if (!createdOffer) {
      return NextResponse.json(
        { error: "Erreur lors de la récupération de l'offre créée" },
        { status: 500 }
      );
    }

    // Créer un objet API pour la réponse
    const apiResponse = {
      id: createdOffer.id,
      name: createdOffer.name,
      description: createdOffer.description,
      price: parseFloat(createdOffer.price.toString()),
      duration: createdOffer.duration,
      durationUnit: data.durationUnit || "MONTH",
      features: createdOffer.features ? JSON.parse(createdOffer.features) : [],
      isPopular: createdOffer.isPopular,
      isActive: createdOffer.isActive,
      maxUsers: createdOffer.maxUsers,
      maxProfiles: totalProfiles,
      createdAt: createdOffer.createdAt,
      updatedAt: createdOffer.updatedAt,
      images: createdOffer.images.map(img => img.path),
      platformConfigs: createdOffer.platformOffers.map(po => ({
        platformId: po.platformId,
        profileCount: po.profileCount,
        isDefault: po.isDefault,
        platform: po.platform
      }))
    };

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error("Erreur détaillée lors de la création de l'offre:", error);

    // Gérer les erreurs spécifiques de Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: "Une offre avec ce nom existe déjà" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la création de l'offre" },
      { status: 500 }
    );
  }
}