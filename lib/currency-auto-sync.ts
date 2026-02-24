import { syncExchangeRates, shouldUpdateRates } from './currency-service'

let syncInterval: NodeJS.Timeout | null = null

/**
 * Démarre la synchronisation automatique des taux de change toutes les 5 heures
 */
export function startAutoSync() {
  // Éviter de créer plusieurs intervalles
  if (syncInterval) {
    clearInterval(syncInterval)
  }
  
  // Réduire les logs pendant le build pour éviter le spam
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'
  if (!isBuildTime) {
    console.log('🔄 Démarrage de la synchronisation automatique des taux de change (toutes les 5 heures)')
  }
  
  // Synchronisation immédiate si nécessaire
  syncIfNeeded()
  
  // Synchronisation toutes les 5 heures (5 * 60 * 60 * 1000 ms)
  syncInterval = setInterval(async () => {
    await syncIfNeeded()
  }, 5 * 60 * 60 * 1000)
}

/**
 * Arrête la synchronisation automatique
 */
export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
    console.log('⏹️ Synchronisation automatique des taux de change arrêtée')
  }
}

/**
 * Synchronise les taux de change si nécessaire
 */
async function syncIfNeeded() {
  try {
    const needsUpdate = await shouldUpdateRates()
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'
    
    if (needsUpdate) {
      if (!isBuildTime) console.log('🔄 Synchronisation des taux de change en cours...')
      const success = await syncExchangeRates(false)
      
      if (success) {
        if (!isBuildTime) console.log('✅ Taux de change synchronisés avec succès')
      } else {
        if (!isBuildTime) console.log('❌ Échec de la synchronisation des taux de change')
      }
    } else {
      // Ne log qu'une fois pendant le build pour éviter le spam
      if (!isBuildTime) {
        console.log('ℹ️ Taux de change à jour, synchronisation ignorée')
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation automatique:', error)
  }
}

/**
 * Force une synchronisation immédiate
 */
export async function forceSyncNow(): Promise<boolean> {
  console.log('🔄 Synchronisation forcée des taux de change...')
  try {
    const success = await syncExchangeRates(true)
    if (success) {
      console.log('✅ Synchronisation forcée réussie')
    } else {
      console.log('❌ Échec de la synchronisation forcée')
    }
    return success
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation forcée:', error)
    return false
  }
} 