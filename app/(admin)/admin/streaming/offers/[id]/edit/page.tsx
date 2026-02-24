'use client'

import { OfferForm } from "@/components/offers/offer-form";
import { OfferFormData, FormPlatform } from "@/types/offer";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function EditOfferPage() {
  const params = useParams();
  const router = useRouter();
  const [offer, setOffer] = useState<OfferFormData | null>(null);
  const [platforms, setPlatforms] = useState<FormPlatform[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [offerResponse, platformsResponse] = await Promise.all([
          fetch(`/api/admin/streaming/offers/${params.id}`),
          fetch('/api/admin/streaming/platforms')
        ]);

        if (!offerResponse.ok) {
          throw new Error("Erreur lors du chargement de l'offre");
        }

        if (!platformsResponse.ok) {
          throw new Error("Erreur lors du chargement des plateformes");
        }

        const offerData = await offerResponse.json();
        const platformsData = await platformsResponse.json();

        // Enrichir les plateformes avec les informations de l'offre
        const enrichedPlatforms = platformsData.map((platform: FormPlatform) => {
          const platformConfig = offerData.platformConfigs.find(
            (pc: any) => pc.platformId === platform.id
          );
          
          if (platformConfig) {
            return {
              ...platform,
              selected: true,
              profileCount: platformConfig.profileCount,
              isDefault: platformConfig.isDefault
            };
          }
          
          return {
            ...platform,
            selected: false,
            profileCount: 1,
            isDefault: false
          };
        });

        // Transformer les données pour le formulaire
        const formData: OfferFormData = {
          id: offerData.id,
          name: offerData.name,
          description: offerData.description || '',
          price: offerData.price,
          duration: offerData.duration,
          durationUnit: offerData.durationUnit,
          features: offerData.features || [],
          isPopular: offerData.isPopular,
          isActive: offerData.isActive,
          maxUsers: offerData.maxUsers,
          maxProfiles: offerData.maxProfiles,
          platformConfigs: offerData.platformConfigs,
          images: offerData.images || []
        };

        setOffer(formData);
        setPlatforms(enrichedPlatforms);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError("Erreur lors du chargement des données. Veuillez réessayer.");
      } finally {
        setIsDataLoading(false);
      }
    }

    loadData();
  }, [params.id]);

  async function handleSubmit(formData: OfferFormData) {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/streaming/offers/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erreur lors de la mise à jour de l'offre");
      }

      toast.success("Offre mise à jour avec succès");
      router.push(`/admin/streaming/offers/${params.id}`);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour:", error);
      const errorMessage = error.message || "Erreur lors de la mise à jour de l'offre";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push(`/admin/streaming/offers/${params.id}`)}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Modifier l'offre</h2>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {isDataLoading ? (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !offer ? (
        <div className="p-4 text-center text-red-500">
          Impossible de charger les données de l'offre.
        </div>
      ) : (
        <OfferForm
          initialData={offer}
          platforms={platforms}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin/streaming/offers')}
          isSubmitting={isLoading}
          submitLabel="Mettre à jour l'offre"
        />
      )}
    </div>
  );
} 