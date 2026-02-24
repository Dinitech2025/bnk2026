'use client'

import { OfferForm } from "@/components/offers/offer-form";
import { redirect } from "next/navigation";
import { OfferFormData, FormPlatform } from "@/types/offer";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function AddOfferPage() {
  const [platforms, setPlatforms] = useState<FormPlatform[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadPlatforms() {
      try {
        const response = await fetch('/api/admin/streaming/platforms');
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des plateformes");
        }
        const data = await response.json();
        setPlatforms(data);
      } catch (error) {
        console.error('Erreur lors du chargement des plateformes:', error);
        toast.error("Erreur lors du chargement des plateformes");
        setError("Erreur lors du chargement des plateformes. Veuillez réessayer.");
      }
    }
    loadPlatforms();
  }, []);

  async function handleSubmit(formData: OfferFormData) {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Données de l\'offre envoyées:', JSON.stringify(formData, null, 2));
      
      // Vérifier que les propriétés requises sont présentes
      if (!formData.name || !formData.price || !formData.duration || !formData.platformConfigs?.length) {
        throw new Error("Données incomplètes. Vérifiez tous les champs obligatoires.");
      }
      
      // Ajuster les données avant envoi
      const adjustedFormData = {
        ...formData,
        platformConfigs: formData.platformConfigs.map(config => ({
          ...config,
          profileCount: config.profileCount || 1,
          isDefault: !!config.isDefault,
          isActive: true
        })),
        images: formData.images && Array.isArray(formData.images) 
          ? formData.images.filter(img => typeof img === 'string' && img.trim() !== '')
          : []
      };

      console.log('Images envoyées:', adjustedFormData.images);

      const response = await fetch('/api/admin/streaming/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adjustedFormData)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Réponse d\'erreur du serveur:', responseData);
        throw new Error(responseData.error || "Une erreur est survenue lors de la création de l'offre");
      }

      toast.success("Offre créée avec succès");
      router.push('/admin/streaming/offers');
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'offre:', error);
      const errorMessage = error.message || "Erreur lors de la création de l'offre";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  if (error) {
    return (
      <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/admin/streaming/offers')}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Erreur</h2>
            </div>
          </div>
        </div>
        <Separator />
        <div className="text-red-500 mt-4">{error}</div>
        <Button 
          onClick={() => { setError(null); setIsLoading(false); }}
          className="mt-4"
        >
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/admin/streaming/offers')}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Nouvelle offre</h2>
          </div>
        </div>
      </div>
      <Separator />
      <OfferForm
        platforms={platforms}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/streaming/offers')}
        isSubmitting={isLoading}
      />
    </div>
  );
} 