import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Taux de change par défaut (base MGA - Ariary)
export const defaultExchangeRates: Record<string, number> = {
  'MGA': 1.0,       // MGA (Ariary) est la devise de base
  'EUR': 0.000196,  // 1 MGA = 0.000196 EUR (1 EUR ≈ 5100 MGA)
  'USD': 0.000214,  // 1 MGA = 0.000214 USD (1 USD ≈ 4680 MGA)
  'GBP': 0.000168   // 1 MGA = 0.000168 GBP (1 GBP ≈ 5950 MGA)
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convertit une chaîne en format slug (minuscules, sans accents, avec des tirets)
 */
export function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '') // Supprime les caractères spéciaux
    .replace(/\s+/g, '-') // Remplace les espaces par des tirets
}

/**
 * Génère un numéro de commande au format CMD-ANNÉE-NNNN ou DEV-ANNÉE-NNNN
 * @param lastOrderNumber Le dernier numéro de commande (optionnel)
 * @param status Le statut de la commande (optionnel)
 * @returns Un nouveau numéro de commande
 */
export function generateOrderNumber(lastOrderNumber?: string | null, status?: string): string {
  const currentYear = new Date().getFullYear();
  const prefix = status === 'QUOTE' ? `DEV-${currentYear}-` : `CMD-${currentYear}-`;
  
  // Si aucun numéro précédent n'existe, commencer à 0001
  if (!lastOrderNumber) {
    return `${prefix}0001`;
  }
  
  // Extraire le numéro séquentiel du dernier numéro de commande
  const match = lastOrderNumber.match(/(?:CMD|DEV)-\d{4}-(\d{4})/);
  if (!match) {
    return `${prefix}0001`;
  }
  
  // Incrémenter le numéro et ajouter des zéros au début si nécessaire
  const nextNumber = parseInt(match[1], 10) + 1;
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Convertit un numéro de commande DEV en CMD (quand il y a un paiement)
 * @param orderNumber Le numéro de commande actuel
 * @returns Le numéro de commande converti ou le même si déjà CMD
 */
export function convertDevToCmdOrderNumber(orderNumber: string | null): string {
  if (!orderNumber) {
    return orderNumber || '';
  }
  
  // Si c'est déjà un numéro CMD, ne rien changer
  if (orderNumber.startsWith('CMD-')) {
    return orderNumber;
  }
  
  // Convertir DEV en CMD
  if (orderNumber.startsWith('DEV-')) {
    return orderNumber.replace('DEV-', 'CMD-');
  }
  
  return orderNumber;
}

/**
 * Formate une date en utilisant la localisation française
 */
export function formatDate(date: string | Date | null | undefined, formatStr: string = "d MMMM yyyy 'à' HH:mm") {
  if (!date) return 'Non spécifié'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, formatStr, { locale: fr })
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error)
    return 'Date invalide'
  }
}

export function formatPrice(price: number, currency?: string, currencySymbol?: string) {
  const formatOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency || 'MGA'
  }

  // Cas spécial pour la Lire turque (TL)
  if (currency === 'TRY') {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      currencyDisplay: 'symbol'
    }).format(price)
  }

  // Si la devise et le symbole sont fournis, utiliser le format personnalisé
  if (currency && currencySymbol) {
    return `${price.toLocaleString('fr-FR')} ${currencySymbol}`
  }
  
  // Sinon, utiliser MGA par défaut
  return new Intl.NumberFormat('fr-FR', formatOptions).format(price)
}

/**
 * Formate une durée selon son unité (jour, semaine, mois, année)
 */
export function formatDuration(duration: number, unit: string): string {
  const unitMap: Record<string, string> = {
    DAY: "jour",
    WEEK: "semaine",
    MONTH: "mois", 
    YEAR: "année"
  };
  
  const unitLabel = unitMap[unit] || unit.toLowerCase();
  
  // Le mot "mois" reste invariable au pluriel en français
  if (unit === "MONTH") {
    return `${duration} ${unitLabel}`;
  }
  
  return `${duration} ${unitLabel}${duration > 1 ? "s" : ""}`;
}

/**
 * Convertit un montant d'une devise à une autre en utilisant les taux de change fournis
 * Base: MGA = 1.0 (Ariary Malgache)
 * Les taux sont stockés comme: 1 MGA = X autre devise
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: Record<string, number>
): number {
  // Si les devises sont identiques, retourner le montant tel quel
  if (fromCurrency === toCurrency) return amount;
  
  // Vérifier que les taux de change sont disponibles
  if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
    throw new Error(`Taux de change non disponible pour ${fromCurrency} ou ${toCurrency}`);
  }
  
  let convertedAmount: number;
  
  if (fromCurrency === 'MGA') {
    // Convertir de MGA vers une autre devise: multiplier par le taux
    convertedAmount = amount * exchangeRates[toCurrency];
  } else if (toCurrency === 'MGA') {
    // Convertir d'une autre devise vers MGA: diviser par le taux
    convertedAmount = amount / exchangeRates[fromCurrency];
  } else {
    // Convertir entre deux devises non-MGA: passer par MGA
    const amountInMGA = amount / exchangeRates[fromCurrency];
    convertedAmount = amountInMGA * exchangeRates[toCurrency];
  }
  
  // Arrondir à 2 décimales
  return Math.round(convertedAmount * 100) / 100;
}

export function convertDecimalToNumber(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'object') {
    if (obj.constructor?.name === 'Decimal') {
      return Number(obj.toString());
    }

    if (Array.isArray(obj)) {
      return obj.map(item => convertDecimalToNumber(item));
    }

    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = convertDecimalToNumber(obj[key]);
      }
    }
    return result;
  }

  return obj;
}

/**
 * Génère un code aléatoire pour les cartes cadeaux
 * Format: XXXX-XXXX-XXXX (X = caractère alphanumérique)
 */
export function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segments = 3
  const segmentLength = 4
  
  const generateSegment = () => {
    return Array.from(
      { length: segmentLength }, 
      () => chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('')
  }

  return Array.from(
    { length: segments },
    generateSegment
  ).join('-')
}