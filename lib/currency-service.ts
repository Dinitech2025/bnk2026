import { db } from '@/lib/db'

const API_URL = 'https://api.fxratesapi.com/latest?api_key=fxr_live_870cf7ae2bcc27582b3379495e4e31fda2f1'
const CACHE_DURATION = 5 * 60 * 60 * 1000 // 5 heures

interface FxRatesResponse {
  success: boolean
  timestamp: number
  date: string
  base: string
  rates: Record<string, number>
}

export async function getLastUpdateTime(): Promise<Date | null> {
  try {
    const lastUpdate = await db.setting.findUnique({
      where: { key: 'exchange_rates_last_update' }
    })
    
    return lastUpdate?.value ? new Date(lastUpdate.value) : null
  } catch (error) {
    console.error('Erreur lors de la récupération de la dernière mise à jour:', error)
    return null
  }
}

export async function shouldUpdateRates(): Promise<boolean> {
  const lastUpdate = await getLastUpdateTime()
  
  if (!lastUpdate) return true
  
  const now = new Date()
  const timeSinceLastUpdate = now.getTime() - lastUpdate.getTime()
  
  return timeSinceLastUpdate > CACHE_DURATION
}

export async function fetchExchangeRates(): Promise<Record<string, number> | null> {
  try {
    const response = await fetch(API_URL)
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`)
    }
    
    const data: FxRatesResponse = await response.json()
    
    if (!data.success) {
      throw new Error('Réponse API non valide')
    }
    
    return data.rates
  } catch (error) {
    console.error('Erreur lors de la récupération des taux de change:', error)
    return null
  }
}

export async function syncExchangeRates(forceUpdate = false): Promise<boolean> {
  try {
    // Vérifier si une mise à jour est nécessaire
    if (!forceUpdate && !(await shouldUpdateRates())) {
      console.log('Mise à jour des taux ignorée - dernière mise à jour trop récente')
      return false
    }
    
    // Récupérer les taux de change
    const rates = await fetchExchangeRates()
    
    if (!rates) {
      return false
    }
    
    // L'API FXRatesAPI donne les taux avec USD comme base par défaut
    // Nous devons convertir vers MGA comme devise de base
    
    // Taux de change réels approximatifs (à ajuster selon les taux actuels)
    // 1 USD ≈ 4680 MGA (taux approximatif actuel)
    const USD_TO_MGA_RATE = 4680 // Taux approximatif actuel
    
    // Normaliser les taux pour MGA comme devise de base
    const normalizedRates: Record<string, number> = {
      'MGA': 1.0 // MGA est notre devise de base
    }
    
    // L'API donne les taux en USD comme base (1 USD = X autres devises)
    // Nous voulons MGA comme base (1 MGA = X autres devises)
    
    // Pour USD : 1 MGA = 1/USD_TO_MGA_RATE USD
    normalizedRates['USD'] = 1 / USD_TO_MGA_RATE
    
    // Pour les autres devises
    Object.entries(rates).forEach(([currency, usdRate]) => {
      // Ignorer MGA et USD (déjà traités)
      if (currency === 'MGA' || currency === 'USD') {
        return
      }
      
      // L'API donne : 1 USD = usdRate de cette devise
      // Nous voulons : 1 MGA = ? de cette devise
      // 
      // Si 1 USD = usdRate de cette devise
      // Et 1 USD = USD_TO_MGA_RATE MGA
      // Alors 1 MGA = usdRate / USD_TO_MGA_RATE de cette devise
      normalizedRates[currency] = usdRate / USD_TO_MGA_RATE
    })
    
    // Mettre à jour la base de données avec les nouveaux taux
    const now = new Date().toISOString()
    
    // Mise à jour des taux de change
    for (const [currency, rate] of Object.entries(normalizedRates)) {
      await db.setting.upsert({
        where: { key: `exchangeRate_${currency}` },
        update: { value: String(rate) },
        create: {
          key: `exchangeRate_${currency}`,
          value: String(rate),
          type: 'NUMBER'
        }
      })
    }
    
    // Mettre à jour la date de dernière mise à jour
    await db.setting.upsert({
      where: { key: 'exchange_rates_last_update' },
      update: { value: now },
      create: {
        key: 'exchange_rates_last_update',
        value: now,
        type: 'DATE'
      }
    })
    
    console.log(`✅ Taux de change mis à jour avec ${Object.keys(normalizedRates).length} devises`)
    console.log(`📊 Exemples: 1 MGA = ${normalizedRates.USD?.toFixed(6)} USD, ${normalizedRates.EUR?.toFixed(6)} EUR`)
    
    return true
  } catch (error) {
    console.error('Erreur lors de la synchronisation des taux de change:', error)
    return false
  }
} 
 
 
 
 
 
 