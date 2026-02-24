import { Prisma } from "@prisma/client";

export type DurationUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export interface PlatformConfig {
  platformId: string;
  profileCount: number;
  isDefault: boolean;
  isActive?: boolean;
  platform?: Platform;
}

export interface Platform {
  id: string;
  name: string;
  logo: string | null;
  hasProfiles: boolean;
  maxProfilesPerAccount: number;
  isActive: boolean;
}

export interface FormPlatform extends Platform {
  selected?: boolean;
  profileCount?: number;
  isDefault?: boolean;
}

export interface OfferImage {
  id: string;
  path: string;
}

export interface OfferFormData {
  id?: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  durationUnit: DurationUnit;
  isPopular: boolean;
  isActive: boolean;
  features: string[];
  maxUsers: number;
  maxProfiles: number;
  platformConfigs: PlatformConfig[];
  images?: string[];
}

export interface CreateOfferData extends OfferFormData {
  profileCount?: number;
}

export interface Offer extends Omit<CreateOfferData, 'platformConfigs'> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  platformConfigs: (PlatformConfig & { platform: Platform })[];
  images: string[];
}

export interface APIOfferResponse extends Omit<Offer, 'features'> {
  features: string[];
  totalProfiles: number;
} 