import { prisma } from '@/lib/prisma';

interface PayPalConfig {
  environment: 'sandbox' | 'production';
  clientId: string;
  clientSecret: string;
  webhookId?: string;
  currency: string;
  conversionRate: number;
  autoConvert: boolean;
}

let cachedConfig: PayPalConfig | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getPayPalConfig(): Promise<PayPalConfig> {
  // Utiliser le cache si disponible et récent
  if (cachedConfig && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedConfig;
  }

  try {
    // Récupérer la configuration PayPal depuis la base
    const paypalProvider = await prisma.paymentProvider.findFirst({
      where: {
        code: 'paypal_api',
        isActive: true,
        paymentMethod: {
          code: 'paypal',
          isActive: true
        }
      },
      include: {
        paymentMethod: true
      }
    });

    if (!paypalProvider || !paypalProvider.settings) {
      // Configuration par défaut si pas trouvée
      console.warn('⚠️ Configuration PayPal non trouvée, utilisation des variables d\'environnement');
      
      const fallbackConfig: PayPalConfig = {
        environment: (process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
        clientId: process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
        currency: 'EUR',
        conversionRate: 5000,
        autoConvert: true
      };
      
      return fallbackConfig;
    }

    // Extraire la configuration depuis les settings
    const settings = paypalProvider.settings as any;
    
    const config: PayPalConfig = {
      environment: settings.environment || 'sandbox',
      clientId: settings.clientId || '',
      clientSecret: settings.clientSecret || '',
      webhookId: settings.webhookId,
      currency: settings.currency || 'EUR',
      conversionRate: settings.conversionRate || 5000,
      autoConvert: settings.autoConvert !== false
    };

    // Mettre en cache
    cachedConfig = config;
    cacheTime = Date.now();

    console.log('✅ Configuration PayPal chargée depuis la BDD:', {
      environment: config.environment,
      currency: config.currency,
      conversionRate: config.conversionRate,
      clientIdPresent: !!config.clientId,
      clientSecretPresent: !!config.clientSecret,
      source: 'DATABASE'
    });

    return config;

  } catch (error) {
    console.error('❌ Erreur chargement config PayPal:', error);
    
    // Fallback vers les variables d'environnement
    console.log('⚠️ Utilisation fallback variables d\'environnement PayPal');
    return {
      environment: (process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      clientId: process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      currency: 'EUR',
      conversionRate: 5000,
      autoConvert: true
    };
  }
}

export function clearPayPalConfigCache() {
  cachedConfig = null;
  cacheTime = 0;
}

export function getPayPalBaseUrl(environment: 'sandbox' | 'production'): string {
  return environment === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';
}
