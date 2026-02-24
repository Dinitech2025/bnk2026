import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { CreateOfferData } from "@/types/offer";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const offerId = params.id;
    
    if (!offerId) {
      return NextResponse.json(
        { error: "ID de l'offre requis" },
        { status: 400 }
      );
    }

    const offer = await prisma.offer.findUnique({
      where: {
        id: offerId,
      },
      include: {
        platformOffers: {
          include: {
            platform: true
          }
        },
        images: true
      }
    });

    if (!offer) {
      return NextResponse.json(
        { error: "Offre non trouvée" },
        { status: 404 }
      );
    }

    // Transformer les données pour le frontend
    const transformedOffer = {
      ...offer,
      features: offer.features ? JSON.parse(offer.features) : [],
      images: offer.images.map(img => img.path),
      platformConfigs: offer.platformOffers.map(po => ({
        platformId: po.platformId,
        profileCount: po.profileCount,
        isDefault: po.isDefault,
        platform: po.platform
      }))
    };

    // Déterminer l'unité correcte en fonction du nom de l'offre si nécessaire
    if (offer.name.toLowerCase().includes("jour") && transformedOffer.durationUnit === "MONTH") {
      transformedOffer.durationUnit = "DAY";
    }

    return NextResponse.json(transformedOffer);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'offre:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'offre" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const data = await request.json() as CreateOfferData;
    console.log('Données reçues pour mise à jour:', JSON.stringify(data));

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

    // Calcul du nombre total de profils
    let totalProfiles = 0;
    if (data.platformConfigs && Array.isArray(data.platformConfigs)) {
      totalProfiles = data.platformConfigs.reduce((sum, config) => sum + (config.profileCount || 1), 0);
    }

    // Supprimer d'abord les relations existantes pour les recréer proprement
    await prisma.platformOffer.deleteMany({
      where: {
        offerId: params.id
      }
    });

    // Traitement des images
    let imageConnections = {};
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      console.log('Images à connecter:', data.images);
      
      // Vérifier si les images sont déjà dans la base de données
      const existingMedia = await prisma.media.findMany({
        where: {
          path: {
            in: data.images
          }
        }
      });
      
      const existingPaths = existingMedia.map(media => media.path);
      const newImages = data.images.filter(img => !existingPaths.includes(img));
      
      // Préparer la connexion aux médias existants
      if (existingMedia.length > 0) {
        imageConnections = {
          ...imageConnections,
          connect: existingMedia.map(media => ({ id: media.id }))
        };
      }
      
      // Créer de nouveaux médias pour les nouvelles URLs
      if (newImages.length > 0) {
        imageConnections = {
          ...imageConnections,
          create: newImages.map(path => ({
            name: `Offer_${data.name}_image`,
            fileName: path.split('/').pop() || 'image.jpg',
            mimeType: 'image/jpeg',
            path: path,
            size: 0,
            alt: `Image pour ${data.name}`
          }))
        };
      }
    }

    // Mise à jour de l'offre avec les nouveaux paramètres
    await prisma.offer.update({
      where: {
        id: params.id
      },
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
        platformOffers: {
          create: data.platformConfigs.map(config => ({
            profileCount: config.profileCount || 1,
            isDefault: config.isDefault ?? false,
            platform: {
              connect: {
                id: config.platformId
              }
            }
          }))
        },
        images: imageConnections
      }
    });

    // Récupérer l'offre mise à jour avec toutes ses relations
    const updatedOffer = await prisma.offer.findUnique({
      where: {
        id: params.id
      },
      include: {
        platformOffers: {
          include: {
            platform: true
          }
        },
        images: true
      }
    });

    if (!updatedOffer) {
      return NextResponse.json(
        { error: "Erreur lors de la récupération de l'offre mise à jour" },
        { status: 404 }
      );
    }

    // Créer un objet API pour la réponse
    const apiResponse = {
      id: updatedOffer.id,
      name: updatedOffer.name,
      description: updatedOffer.description,
      price: parseFloat(updatedOffer.price.toString()),
      duration: updatedOffer.duration,
      durationUnit: updatedOffer.durationUnit || "MONTH", // Utiliser la valeur de la BDD
      features: updatedOffer.features ? JSON.parse(updatedOffer.features) : [],
      isPopular: updatedOffer.isPopular,
      isActive: updatedOffer.isActive,
      maxUsers: updatedOffer.maxUsers,
      maxProfiles: totalProfiles,
      createdAt: updatedOffer.createdAt,
      updatedAt: updatedOffer.updatedAt,
      images: updatedOffer.images.map(img => img.path),
      platformConfigs: updatedOffer.platformOffers.map(po => ({
        platformId: po.platformId,
        profileCount: po.profileCount,
        isDefault: po.isDefault,
        platform: po.platform
      }))
    };

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error("Erreur détaillée lors de la mise à jour de l'offre:", error);
    
    // Gérer les erreurs spécifiques de Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: "Une offre avec ce nom existe déjà" },
          { status: 400 }
        );
      }
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: "Référence à une entité qui n'existe pas (ID de plateforme invalide)" },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la mise à jour de l'offre" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    await prisma.offer.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'offre:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la suppression de l'offre" },
      { status: 500 }
    );
  }
} 