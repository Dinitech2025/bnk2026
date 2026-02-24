'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface Account {
  id: string;
  username: string | null;
  email: string | null;
  accountProfiles: {
    id: string;
    name: string | null;
    profileSlot: number;
    pin: string | null;
    isAssigned: boolean;
  }[];
}

interface Platform {
  id: string;
  name: string;
  logo: string | null;
  hasProfiles: boolean;
  maxProfilesPerAccount: number | null;
}

interface PlatformOffer {
  id: string;
  platform: Platform;
}

interface Subscription {
  id: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  offer: {
    id: string;
    name: string;
    maxProfiles: number;
  };
  platformOffer: PlatformOffer | null;
  Profile: any[];
}

interface SelectedProfile {
  accountId: string;
  profileId: string;
  profileSlot: number;
}

interface AssignProfilesFormProps {
  subscription: Subscription;
  availableAccounts: Account[];
  maxProfilesToAssign: number;
}

export default function AssignProfilesForm({
  subscription,
  availableAccounts,
  maxProfilesToAssign,
}: AssignProfilesFormProps) {
  const router = useRouter();
  const [selectedProfiles, setSelectedProfiles] = useState<SelectedProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Gérer la sélection/désélection d'un profil
  const toggleProfileSelection = (account: Account, profileId: string, profileSlot: number) => {
    // Vérifier si le profil est déjà sélectionné
    const profileIndex = selectedProfiles.findIndex(
      (p) => p.accountId === account.id && p.profileId === profileId
    );

    if (profileIndex >= 0) {
      // Le profil est déjà sélectionné, on le retire
      setSelectedProfiles((prev) => prev.filter((_, index) => index !== profileIndex));
    } else {
      // Le profil n'est pas sélectionné

      // Vérifier si le maximum de profils est atteint
      if (selectedProfiles.length >= maxProfilesToAssign) {
        toast.error(`Vous ne pouvez pas sélectionner plus de ${maxProfilesToAssign} profils.`);
        return;
      }

      // Ajouter le profil aux sélections
      setSelectedProfiles((prev) => [
        ...prev,
        { accountId: account.id, profileId, profileSlot },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedProfiles.length === 0) {
      toast.error('Veuillez sélectionner au moins un profil.');
      return;
    }

    setIsLoading(true);

    try {
      // Préparer les données pour l'API
      const data = {
        subscriptionId: subscription.id,
        profiles: selectedProfiles.map((p) => ({
          accountId: p.accountId,
          profileId: p.profileId,
          profileSlot: p.profileSlot,
        })),
      };

      // Appeler l'API pour assigner les profils
      const response = await fetch(`/api/admin/streaming/subscriptions/${subscription.id}/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Une erreur est survenue lors de l\'assignation des profils.');
      }

      toast.success('Profils assignés avec succès.');
      router.push(`/admin/streaming/subscriptions/${subscription.id}`);
      router.refresh();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  // Afficher une interface pour sélectionner les profils disponibles
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Profils disponibles</h2>
        <p className="text-gray-500 mb-4">
          Sélectionnez jusqu'à {maxProfilesToAssign} profil(s) à assigner à cet abonnement.
        </p>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {availableAccounts.map((account) => (
            <Card key={account.id} className="border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Compte: {account.username || account.email || `Compte ${account.id.slice(0, 8)}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {account.accountProfiles.map((profile) => {
                    const isSelected = selectedProfiles.some(
                      (p) => p.accountId === account.id && p.profileId === profile.id
                    );
                    
                    return (
                      <div
                        key={profile.id}
                        className={`flex items-center space-x-2 p-2 border rounded cursor-pointer ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => toggleProfileSelection(account, profile.id, profile.profileSlot)}
                      >
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => {}}
                          className="h-4 w-4"
                        />
                        <div className="flex-1">
                          <div className="font-medium">
                            {profile.name || `Profil ${profile.profileSlot}`}
                          </div>
                          {profile.pin && (
                            <div className="text-xs text-gray-500">PIN: {profile.pin}</div>
                          )}
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-blue-500" />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/admin/streaming/subscriptions/${subscription.id}`)}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isLoading || selectedProfiles.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Assignation en cours...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Assigner les profils ({selectedProfiles.length})
            </>
          )}
        </Button>
      </div>
    </form>
  );
} 