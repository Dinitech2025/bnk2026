import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Platform } from "@/types/offer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Users, Clock, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Prisma } from "@prisma/client";
import { OfferImage } from "./components/offer-image";
import { OfferPrice } from "./components/offer-price";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";

interface OfferDetailProps {
  params: {
    id: string;
  };
}

interface TransformedOffer {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  durationUnit: "DAY" | "WEEK" | "MONTH" | "YEAR";
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  maxUsers: number;
  maxProfiles: number;
  createdAt: Date;
  updatedAt: Date;
  platformConfigs: PlatformConfig[];
  images: any[]; 
}

interface PlatformConfig {
  platformId: string;
  profileCount: number;
  isDefault: boolean;
  isActive?: boolean;
  platform?: Platform;
}

async function getOffer(id: string): Promise<TransformedOffer | null> {
  try {
    const offer = await prisma.offer.findUnique({
      where: {
        id
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
      return null;
    }

    // Traiter les images
    const processedImages = offer.images.map(image => ({
      id: image.id,
      path: image.path
    }));

    // Utilisation d'une approche sûre pour accéder aux propriétés
    const offerData: TransformedOffer = {
      id: offer.id,
      name: offer.name,
      description: offer.description,
      price: parseFloat(offer.price.toString()),
      duration: offer.duration,
      durationUnit: ((): "DAY" | "WEEK" | "MONTH" | "YEAR" => {
        if (offer.durationUnit === "DAY") return "DAY";
        if (offer.durationUnit === "WEEK") return "WEEK";
        if (offer.durationUnit === "YEAR") return "YEAR";
        return "MONTH"; // Valeur par défaut
      })(),
      features: (offer as any).features ? JSON.parse((offer as any).features as string) : [],
      isPopular: (offer as any).isPopular || false,
      isActive: (offer as any).isActive || true,
      maxUsers: (offer as any).maxUsers || 1,
      maxProfiles: (offer as any).maxProfiles || 0,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
      platformConfigs: offer.platformOffers.map((po) => ({
        platformId: po.platformId,
        profileCount: po.profileCount,
        isDefault: po.isDefault,
        isActive: true,
        platform: {
          id: po.platform.id,
          name: po.platform.name,
          logo: po.platform.logo || '',
          hasProfiles: po.platform.hasProfiles,
          maxProfilesPerAccount: po.platform.maxProfilesPerAccount || 0,
          isActive: po.platform.isActive,
        },
      })),
      images: processedImages,
    };

    console.log("Offer data:", {
      id: offer.id,
      name: offer.name,
      duration: offer.duration,
      originalDurationUnit: offer.durationUnit,
      processedDurationUnit: ((): string => {
        if (offer.durationUnit === "DAY") return "DAY";
        if (offer.durationUnit === "WEEK") return "WEEK";
        if (offer.durationUnit === "YEAR") return "YEAR";
        return "MONTH";
      })()
    });

    return offerData;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'offre:", error);
    return null;
  }
}

// Composant qui affiche la page de détail avec support pour les composants client
export default async function OfferDetailPage({ params }: OfferDetailProps) {
  const offer = await getOffer(params.id);

  if (!offer) {
    notFound();
  }

  const totalProfiles = offer.platformConfigs.reduce(
    (sum, config) => {
      const platform = config.platform;
      if (!platform?.hasProfiles) return sum;
      return sum + config.profileCount;
    },
    0
  );

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            asChild
            className="gap-1"
          >
            <Link href="/admin/streaming/offers">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{offer.name}</h2>
          </div>
          {offer.isPopular && (
            <Badge variant="secondary" className="ml-2">Populaire</Badge>
          )}
          {!offer.isActive && (
            <Badge variant="destructive" className="ml-2">Inactive</Badge>
          )}
        </div>
        <Button asChild>
          <Link href={`/admin/streaming/offers/${offer.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" /> Modifier
          </Link>
        </Button>
      </div>

      <Separator />

      {/* Images */}
      {offer.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {offer.images.map((image, index) => (
                <div key={index} className="relative aspect-video bg-muted rounded-md overflow-hidden">
                  <OfferImage
                    src={image.path}
                    alt={`Image ${index + 1} pour ${offer.name}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Détails de l'offre</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {offer.description && (
              <p className="text-gray-600">{offer.description}</p>
            )}
            <div className="flex space-x-4">
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-gray-500" />
                <span>{offer.duration} {
                  (() => {
                    // Forcer l'affichage selon le nom de l'offre si on détecte "jours" dans le nom
                    if (offer.name.toLowerCase().includes("jour")) {
                      return "jour" + (offer.duration > 1 ? "s" : "");
                    }
                    
                    // Sinon utiliser la fonction formatDuration
                    return formatDuration(offer.duration, offer.durationUnit).split(" ")[1];
                  })()
                }</span>
              </div>
            </div>
                          <div>
                <OfferPrice price={offer.price} />
              </div>

            {/* Caractéristiques */}
            {offer.features.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Caractéristiques</h3>
                <ul className="space-y-2">
                  {offer.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plateformes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Plateformes</span>
              <Badge className="ml-auto">
                {totalProfiles} profil{totalProfiles > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {offer.platformConfigs.map((config) => (
                <div
                  key={config.platformId}
                  className="p-4 border rounded-lg flex justify-between items-center"
                >
                  <div className="flex items-center space-x-3">
                    {config.platform?.logo && (
                      <img
                        src={config.platform.logo}
                        alt={config.platform.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium">{config.platform?.name}</div>
                      {config.platform?.hasProfiles && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {config.profileCount} profil{config.profileCount > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {config.isDefault && (
                      <Badge variant="outline">Par défaut</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations administratives */}
      <Card>
        <CardHeader>
          <CardTitle>Informations administratives</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground">Créée le</div>
              <div>{new Date(offer.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="p-4 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground">Mise à jour le</div>
              <div>{new Date(offer.updatedAt).toLocaleDateString()}</div>
            </div>
            <div className="p-4 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground">Utilisateurs max</div>
              <div>{offer.maxUsers}</div>
            </div>
            <div className="p-4 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground">Profils max</div>
              <div>{offer.maxProfiles}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 