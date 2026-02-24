import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification et les droits
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Non autorisé. Vous devez être administrateur.' },
        { status: 401 }
      );
    }

    // Récupérer les données du corps de la requête
    const { profiles } = await request.json();

    // Validation de base
    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      return NextResponse.json(
        { message: 'Veuillez fournir au moins un profil à assigner.' },
        { status: 400 }
      );
    }

    const subscriptionId = params.id;

    // Vérifier l'existence de l'abonnement
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        offer: true,
        Profile: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { message: 'Abonnement non trouvé.' },
        { status: 404 }
      );
    }

    // Vérifier que le nombre de profils n'excède pas le maximum autorisé
    const currentProfileCount = subscription.Profile.length;
    const maxProfilesAllowed = subscription.offer.maxProfiles;
    const remainingSlots = maxProfilesAllowed - currentProfileCount;

    if (profiles.length > remainingSlots) {
      return NextResponse.json(
        { 
          message: `Trop de profils sélectionnés. Vous pouvez ajouter ${remainingSlots} profil(s) maximum.`,
          remainingSlots 
        },
        { status: 400 }
      );
    }

    // Créer les profils et les assigner à l'abonnement
    const profilesCreation = await Promise.all(
      profiles.map(async (profileData: any) => {
        // Vérifier que le profil n'est pas déjà assigné
        const existingProfile = await prisma.accountProfile.findUnique({
          where: { id: profileData.profileId },
        });

        if (!existingProfile || existingProfile.isAssigned) {
          throw new Error(`Le profil ${profileData.profileId} n'est pas disponible.`);
        }

        // Récupérer le compte pour s'assurer qu'il appartient à la bonne plateforme
        const account = await prisma.account.findUnique({
          where: { id: profileData.accountId },
          include: { platform: true },
        });

        if (!account) {
          throw new Error(`Le compte ${profileData.accountId} n'existe pas.`);
        }

        // Créer le profil pour l'abonnement
        const newProfile = await prisma.profile.create({
          data: {
            subscriptionId,
            accountId: profileData.accountId,
            profileSlot: profileData.profileSlot,
            name: existingProfile.name,
          },
        });

        // Marquer le profil comme assigné
        await prisma.accountProfile.update({
          where: { id: profileData.profileId },
          data: { isAssigned: true },
        });

        return newProfile;
      })
    );

    // Réponse avec les profiles créés
    return NextResponse.json(
      { 
        message: 'Profils assignés avec succès.', 
        profiles: profilesCreation,
        count: profilesCreation.length
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de l\'assignation des profils:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'assignation des profils.' },
      { status: 500 }
    );
  }
}

// API pour récupérer les profils assignés à un abonnement
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification et les droits
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Non autorisé. Vous devez être administrateur.' },
        { status: 401 }
      );
    }

    const subscriptionId = params.id;

    // Récupérer les profils assignés à l'abonnement
    const profiles = await prisma.profile.findMany({
      where: { subscriptionId },
      include: {
        account: {
          include: {
            platform: true,
          },
        },
      },
    });

    return NextResponse.json(
      { profiles },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des profils:', error);
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la récupération des profils.' },
      { status: 500 }
    );
  }
}

// API pour supprimer un profil assigné
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification et les droits
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Non autorisé. Vous devez être administrateur.' },
        { status: 401 }
      );
    }

    // Récupérer l'ID du profil à supprimer depuis les paramètres d'URL
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json(
        { message: 'ID du profil manquant.' },
        { status: 400 }
      );
    }

    const subscriptionId = params.id;

    // Vérifier que le profil appartient bien à l'abonnement
    const profile = await prisma.profile.findFirst({
      where: {
        id: profileId,
        subscriptionId,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { message: 'Profil non trouvé ou n\'appartient pas à cet abonnement.' },
        { status: 404 }
      );
    }

    // Pour libérer le profil dans AccountProfile, on a besoin de trouver le profil correspondant
    // Nous supposons qu'il y a une correspondance basée sur accountId et profileSlot
    await prisma.accountProfile.updateMany({
      where: { 
        accountId: profile.accountId,
        profileSlot: profile.profileSlot,
        isAssigned: true
      },
      data: { isAssigned: false },
    });

    // Supprimer le profil
    await prisma.profile.delete({
      where: { id: profileId },
    });

    return NextResponse.json(
      { message: 'Profil supprimé avec succès.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la suppression du profil:', error);
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la suppression du profil.' },
      { status: 500 }
    );
  }
} 