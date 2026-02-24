import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    // Récupérer l'ID de l'offre à partir du corps de la requête
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID d'offre requis" },
        { status: 400 }
      );
    }

    // Récupérer l'offre
    const offer = await prisma.offer.findUnique({
      where: {
        id
      },
      include: {
        platformOffers: {
          include: {
            platform: {
              select: {
                id: true,
                name: true,
                logo: true,
                hasProfiles: true,
                maxProfilesPerAccount: true,
                isActive: true
              }
            }
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

    // Transformer la réponse
    const response = {
      ...offer,
      price: parseFloat(offer.price.toString()),
      platformOffers: offer.platformOffers.map(po => ({
        id: po.id,
        platformId: po.platformId,
        profileCount: po.profileCount,
        isDefault: po.isDefault,
        isActive: true, // Valeur par défaut
        platform: po.platform
      }))
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'offre:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la récupération de l'offre" },
      { status: 500 }
    );
  }
} 
 
 
 
 