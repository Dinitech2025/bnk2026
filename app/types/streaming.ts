import { Platform as PlatformType } from './platform';

export interface AccountProfile {
  id: string;
  accountId: string;
  name: string | null;
  profileSlot: number;
  pin: string | null;
  isAssigned: boolean;
  subscriptionId: string | null;
  account?: Account;
}

export interface AccountProfileUpdateInput {
  isAssigned?: boolean;
  pin?: string | null;
}

export interface Account {
  id: string;
  platformId: string;
  username: string | null;
  email: string | null;
  password: string | null;
  status: string;
  platform?: PlatformType;
  accountProfiles?: AccountProfile[];
}

// Enum pour les statuts des comptes
export enum AccountStatus {
  AVAILABLE = "AVAILABLE",
  IN_USE = "IN_USE",
  LOCKED = "LOCKED",
  MAINTENANCE = "MAINTENANCE"
}

// Types pour les profils
export interface ProfileBase {
  id: string
  name: string | null
  profileSlot: number
  pin: string | null
  isAssigned: boolean
}

// Types pour les plateformes
export interface StreamingPlatform {
  id: string
  name: string
  logo: string | null
  type: string
  maxProfilesPerAccount: number | null
  websiteUrl: string | null
  hasProfiles: boolean
}

// Types pour les comptes
export interface StreamingAccount {
  id: string
  username: string | null
  email: string | null
  password: string
  status: string
  platformId: string
  platform: StreamingPlatform
  accountProfiles: ProfileBase[]
} 