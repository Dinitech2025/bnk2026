import { startAutoSync } from './currency-auto-sync'

let isInitialized = false

/**
 * Initialise la synchronisation automatique des taux de change
 * Cette fonction ne doit être appelée qu'une seule fois au démarrage de l'application
 */
export function initializeCurrencySync() {
  if (isInitialized) {
    return
  }
  
  // Démarrer la synchronisation automatique uniquement en production ou si explicitement activé
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CURRENCY_SYNC === 'true') {
    // Réduire les logs pendant le build pour éviter le spam
    if (!process.env.NEXT_PHASE || process.env.NEXT_PHASE !== 'phase-production-build') {
      console.log('🚀 Initialisation de la synchronisation automatique des taux de change')
    }
    startAutoSync()
    isInitialized = true
  } else {
    console.log('ℹ️ Synchronisation automatique des taux de change désactivée en développement')
  }
}

// Auto-initialisation lors de l'import du module (côté serveur uniquement)
if (typeof window === 'undefined') {
  initializeCurrencySync()
} 