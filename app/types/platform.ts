export interface Platform {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  logoMediaId: string | null;
  websiteUrl: string | null;
  type: string;
  hasProfiles: boolean;
  maxProfilesPerAccount: number | null;
  isActive: boolean;
  tags: string | null;
  popularity: number | null;
  features: string | null;
  pricingModel: string | null;
  hasMultipleOffers: boolean;
  hasGiftCards: boolean;
}

// Enum pour les types de plateformes
export enum PlatformType {
  VIDEO = "VIDEO",
  MUSIC = "MUSIC",
  GAMING = "GAMING",
  OTHER = "OTHER"
}

// Enum pour les modèles de tarification
export enum PricingModel {
  SUBSCRIPTION = "SUBSCRIPTION",
  ONE_TIME = "ONE_TIME",
  FREE = "FREE",
  FREEMIUM = "FREEMIUM"
} 