import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import AssignProfilesForm from '../assign-profiles-form';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const subscription = await prisma.subscription.findUnique({
    where: {
      id: params.id,
    },
    include: {
      user: true,
      offer: true,
    },
  });

  if (!subscription) {
    return {
      title: 'Abonnement non trouvé',
    };
  }

  return {
    title: `Gestion des profils pour ${subscription.user.firstName} ${subscription.user.lastName}`,
    description: `Assigner des profils à l'abonnement pour l'offre ${subscription.offer.name}`,
  };
}

async function getSubscriptionData(id: string) {
  const subscription = await prisma.subscription.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      offer: {
        select: {
          id: true,
          name: true,
          maxProfiles: true,
          platformOffers: {
            include: {
              platform: true,
            },
          },
        },
      },
      platformOffer: {
        include: {
          platform: {
            select: {
              id: true,
              name: true,
              logo: true,
              hasProfiles: true,
              maxProfilesPerAccount: true,
            },
          },
        },
      },
      subscriptionAccounts: {
        include: {
          account: true,
        },
      },
      Profile: true,
    },
  });

  if (!subscription) {
    notFound();
  }

  // Vérifier si la plateforme de l'abonnement supporte les profils
  if (!subscription.platformOffer || !subscription.platformOffer.platform.hasProfiles) {
    // Rediriger vers la page de détail si aucune plateforme ne supporte les profils
    redirect(`/admin/streaming/subscriptions/${id}`);
  }

  // Pour le MVP, nous allons traiter uniquement la plateforme actuelle de l'abonnement
  // Dans une version complète, on récupérerait toutes les plateformes de l'offre
  const platform = subscription.platformOffer.platform;
  
  // Récupérer les comptes disponibles pour cette plateforme
  const accounts = await prisma.account.findMany({
    where: {
      platformId: platform.id,
      status: 'AVAILABLE',
    },
    include: {
      accountProfiles: {
        where: {
          isAssigned: false,
        },
      },
    },
  });

  // Filtrer pour ne garder que les comptes avec des profils disponibles
  const accountsWithProfiles = accounts.filter(
    (account) => account.accountProfiles.length > 0
  );

  // Récupérer les profils déjà assignés pour cette plateforme
  const assignedProfiles = await prisma.profile.count({
    where: {
      subscriptionId: id,
      account: {
        platformId: platform.id,
      },
    },
  });

  // Calculer le nombre de profils restants à assigner
  const totalMaxProfiles = subscription.offer.maxProfiles;
  const totalAssignedProfiles = subscription.Profile.length;
  const remainingProfiles = totalMaxProfiles - totalAssignedProfiles;

  // Maximum de profils par plateforme
  const maxProfilesPerPlatform = platform.maxProfilesPerAccount || 5;
  const remainingProfilesForPlatform = maxProfilesPerPlatform - assignedProfiles;

  return {
    subscription: {
      ...subscription,
      user: {
        ...subscription.user,
        email: subscription.user.email || ""
      }
    },
    platform,
    availableAccounts: accountsWithProfiles,
    assignedProfilesCount: assignedProfiles,
    remainingProfiles,
    maxProfilesToAssign: Math.min(remainingProfilesForPlatform, remainingProfiles),
  };
}

export default async function AssignProfilesPage({ params }: PageProps) {
  const { subscription, platform, availableAccounts, assignedProfilesCount, remainingProfiles, maxProfilesToAssign } = await getSubscriptionData(params.id);

  // Si aucun profil à assigner
  if (remainingProfiles <= 0) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          Gestion des profils
        </h1>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">Le nombre maximum de profils pour cet abonnement a déjà été atteint.</p>
        </div>
        <div className="mt-4">
          <a 
            href={`/admin/streaming/subscriptions/${params.id}`} 
            className="text-blue-600 hover:underline"
          >
            Retour aux détails de l'abonnement
          </a>
        </div>
      </div>
    );
  }

  // Si aucun compte disponible
  if (availableAccounts.length === 0) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          Gestion des profils
        </h1>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">Aucun compte avec des profils disponibles n'a été trouvé pour la plateforme {platform.name}.</p>
        </div>
        <div className="mt-4">
          <a 
            href={`/admin/streaming/subscriptions/${params.id}`} 
            className="text-blue-600 hover:underline"
          >
            Retour aux détails de l'abonnement
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Gestion des profils
      </h1>
      <p className="text-gray-500 mb-6">
        Assignez des profils à l'abonnement de {subscription.user.firstName} {subscription.user.lastName} pour l'offre {subscription.offer.name}.
      </p>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-blue-700">
          Il vous reste <span className="font-bold">{remainingProfiles}</span> profil(s) à assigner au total pour cet abonnement.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          {platform.logo && (
            <img 
              src={platform.logo} 
              alt={platform.name} 
              className="h-6 w-6 mr-2"
            />
          )}
          {platform.name}
        </h2>
        
        <p className="text-gray-500 mb-4">
          Profils déjà assignés pour cette plateforme: {assignedProfilesCount}
        </p>
        
        <AssignProfilesForm 
          subscription={subscription}
          availableAccounts={availableAccounts}
          maxProfilesToAssign={maxProfilesToAssign}
        />
      </div>
      
      <div className="mt-8">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">À propos des offres multi-plateformes</h3>
          <p className="text-gray-600">
            Cette fonctionnalité permet actuellement d'assigner des profils à la plateforme principale de cet abonnement. 
            Pour gérer d'autres plateformes, veuillez contacter l'administrateur système.
          </p>
        </div>
      </div>
      
      <div className="mt-4">
        <a 
          href={`/admin/streaming/subscriptions/${params.id}`} 
          className="text-blue-600 hover:underline"
        >
          Retour aux détails de l'abonnement
        </a>
      </div>
    </div>
  );
} 