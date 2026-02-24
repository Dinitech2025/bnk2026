'use client'

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Plus,
  Users,
  Clock,
  CreditCard,
  Globe,
  Trash2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { DurationUnit, FormPlatform, PlatformConfig } from "@/types/offer";
import type { OfferFormData } from "@/types/offer";
import { Platform } from "@prisma/client";
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';

interface OfferFormProps {
  initialData?: OfferFormData;
  platforms: FormPlatform[];
  onSubmit: (data: OfferFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
}

// Import dynamique avec fallback pour le composant MultiImageUpload
const DynamicMultiImageUpload = dynamic(
  () => import('@/components/ui/multi-image-upload').then(mod => ({ default: mod.MultiImageUpload })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Chargement de l'uploader d'images...</p>
        </div>
      </div>
    )
  }
);

export function OfferForm({
  initialData,
  platforms,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = "Créer l'offre"
}: OfferFormProps) {
  const [formData, setFormData] = useState<OfferFormData>(
    initialData || {
      name: "",
      description: "",
      price: 0,
      duration: 1,
      durationUnit: "MONTH",
      features: [],
      isPopular: false,
      isActive: true,
      maxUsers: 1,
      maxProfiles: 1,
      platformConfigs: [],
      images: []
    }
  );

  const [newFeature, setNewFeature] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validatePlatformConfigs();
    if (error) {
      // Vous pouvez utiliser votre système de notification ici
      console.error(error);
      return;
    }

    await onSubmit(formData);
  };

  // Fonction pour uploader une seule image (pour MultiImageUpload)
  const handleSingleImageUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'offer');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur inconnue');
      }
      
      const data = await response.json();
      
      if (!data.url) {
        throw new Error('URL d\'image manquante dans la réponse');
      }
      
      return data.url;
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'image:', error);
      throw error;
    }
  };

  // Fonction pour uploader plusieurs images (pour MultiImageUpload)
  const handleMultipleImageUpload = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(file => handleSingleImageUpload(file));
    return Promise.all(uploadPromises);
  };

  const handleImagesChange = (newImages: string[]) => {
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), newFeature.trim()]
      });
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features?.filter((_, i) => i !== index) || []
    });
  };

  const addPlatform = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) return;

    setFormData({
      ...formData,
      platformConfigs: [
        ...formData.platformConfigs,
        {
          platformId,
          profileCount: platform.hasProfiles ? 1 : 0,
          isDefault: formData.platformConfigs.length === 0,
          platform,
          isActive: true
        }
      ]
    });
  };

  const removePlatform = (platformId: string) => {
    setFormData({
      ...formData,
      platformConfigs: formData.platformConfigs.filter(
        config => config.platformId !== platformId
      )
    });
  };

  const updatePlatformConfig = (
    platformId: string,
    updates: Partial<PlatformConfig>
  ) => {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) return;

    if (updates.profileCount !== undefined) {
      const maxProfiles = platform.maxProfilesPerAccount || 1;
      const minProfiles = platform.hasProfiles ? 1 : 0;
      
      if (updates.profileCount > maxProfiles) {
        updates.profileCount = maxProfiles;
      } else if (updates.profileCount < minProfiles) {
        updates.profileCount = minProfiles;
      }
    }

    setFormData((prev: OfferFormData) => ({
      ...prev,
      platformConfigs: prev.platformConfigs.map((config: PlatformConfig) =>
        config.platformId === platformId
          ? { ...config, ...updates }
          : config
      )
    }));

    const totalProfiles = calculateTotalProfiles();
    setFormData((prev: OfferFormData) => ({
      ...prev,
      maxProfiles: totalProfiles
    }));
  };

  const calculateTotalProfiles = () => {
    return formData.platformConfigs.reduce((total: number, config: PlatformConfig) => {
      const platform = platforms.find(p => p.id === config.platformId);
      if (!platform?.hasProfiles) return total;
      return total + (config.profileCount || 0);
    }, 0);
  };

  useEffect(() => {
    // Mettre à jour le nombre total de profils à chaque changement de configuration
    const totalProfiles = calculateTotalProfiles();
    if (totalProfiles !== formData.maxProfiles) {
      setFormData(prev => ({
        ...prev,
        maxProfiles: totalProfiles
      }));
    }
  }, [formData.platformConfigs]);

  const validatePlatformConfigs = () => {
    if (formData.platformConfigs.length === 0) {
      return "Au moins une plateforme doit être sélectionnée";
    }

    for (const config of formData.platformConfigs) {
      const platform = platforms.find(p => p.id === config.platformId);
      if (!platform) continue;

      if (platform.hasProfiles && (!config.profileCount || config.profileCount < 1)) {
        return `Le nombre de profils pour ${platform.name} doit être d'au moins 1`;
      }

      if (platform.maxProfilesPerAccount && config.profileCount > platform.maxProfilesPerAccount) {
        return `Le nombre maximum de profils pour ${platform.name} est de ${platform.maxProfilesPerAccount}`;
      }
    }

    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plateformes</CardTitle>
          <CardDescription>
            Sélectionnez les plateformes disponibles dans cette offre et configurez le nombre de profils.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Plateformes disponibles</Label>
            <span className="text-sm text-muted-foreground">
              Total profils : {calculateTotalProfiles()}
            </span>
          </div>
          
          <Select
            onValueChange={addPlatform}
            value=""
          >
            <SelectTrigger>
              <SelectValue placeholder="Ajouter une plateforme" />
            </SelectTrigger>
            <SelectContent>
              {platforms
                .filter(p => !formData.platformConfigs.some(c => c.platformId === p.id))
                .map(platform => (
                  <SelectItem key={platform.id} value={platform.id}>
                    {platform.name}
                    {platform.hasProfiles && ` (max ${platform.maxProfilesPerAccount} profils)`}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <div className="space-y-2">
            {formData.platformConfigs.map(config => {
              const platform = platforms.find(p => p.id === config.platformId);
              if (!platform) return null;

              return (
                <div
                  key={config.platformId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    {platform.logo && (
                      <img
                        src={platform.logo}
                        alt={platform.name}
                        className="w-8 h-8 rounded"
                      />
                    )}
                    <div>
                      <h4 className="font-medium">{platform.name}</h4>
                      {platform.hasProfiles && (
                        <div className="flex items-center mt-2 space-x-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min="1"
                            max={platform.maxProfilesPerAccount || 1}
                            value={config.profileCount}
                            onChange={e => updatePlatformConfig(config.platformId, {
                              profileCount: parseInt(e.target.value)
                            })}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">
                            profils (max: {platform.maxProfilesPerAccount})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.isDefault}
                        onCheckedChange={checked => updatePlatformConfig(config.platformId, {
                          isDefault: checked
                        })}
                      />
                      <span className="text-sm">Par défaut</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePlatform(config.platformId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images de l'offre</CardTitle>
          <CardDescription>
            Ajoutez des images pour illustrer votre offre (maximum 5 images).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Images de l'offre</Label>
            <div className="min-h-[200px]">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-sm text-gray-500">Chargement de l'uploader d'images...</p>
                    </div>
                  </div>
                }
              >
                <DynamicMultiImageUpload
                  value={formData.images || []}
                  onChange={handleImagesChange}
                  onMultipleUpload={handleMultipleImageUpload}
                  maxFiles={4}
                  allowMultiple
                  disabled={isSubmitting}
                />
              </Suspense>
            </div>
            <p className="text-sm text-gray-500">
              Ajoutez jusqu'à 4 images pour illustrer votre offre. La première image sera utilisée comme image principale.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'offre</CardTitle>
          <CardDescription>
            Configurez les détails de l'offre d'abonnement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom de l'offre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* Prix et durée */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Prix (Ar)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="100"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />
              <p className="text-sm text-gray-500 mt-1">Le prix doit être en Ariary</p>
            </div>
            <div className="flex space-x-2">
              <div className="flex-grow">
                <Label htmlFor="duration">Durée</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div className="flex-grow">
                <Label htmlFor="durationUnit">Unité</Label>
                <Select
                  value={formData.durationUnit || "MONTH"}
                  onValueChange={value => setFormData({ ...formData, durationUnit: value as DurationUnit })}
                >
                  <SelectTrigger id="durationUnit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAY">Jour(s)</SelectItem>
                    <SelectItem value="WEEK">Semaine(s)</SelectItem>
                    <SelectItem value="MONTH">Mois</SelectItem>
                    <SelectItem value="YEAR">Année(s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-col md:flex-row md:space-x-8">
            <div className="flex items-center space-x-2 mb-2 md:mb-0">
              <Switch
                checked={formData.isPopular || false}
                onCheckedChange={checked => setFormData({ ...formData, isPopular: checked })}
                id="isPopular"
              />
              <Label htmlFor="isPopular">Offre populaire</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isActive !== false}
                onCheckedChange={checked => setFormData({ ...formData, isActive: checked })}
                id="isActive"
              />
              <Label htmlFor="isActive">Offre active</Label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "En cours..." : submitLabel}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 