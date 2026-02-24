import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// API publique pour récupérer les taux de change
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API exchange-rates: Récupération des taux depuis la base de données...')
    
    // Récupérer les taux de change depuis la base de données
    const exchangeRateSettings = await db.setting.findMany({
      where: {
        key: {
          startsWith: 'exchangeRate_'
        }
      }
    })

    console.log(`📊 Trouvé ${exchangeRateSettings.length} taux de change dans la base de données`)
    
    // Log des premiers taux pour déboguer
    const sampleRates = exchangeRateSettings.slice(0, 5)
    console.log('🧮 Échantillon de taux:', sampleRates.map(s => `${s.key}: ${s.value}`))

    // Transformer en objet clé-valeur
    const exchangeRates: Record<string, number> = {}
    exchangeRateSettings.forEach((setting) => {
      const currencyCode = setting.key.replace('exchangeRate_', '')
      const rate = parseFloat(setting.value || '1')
      exchangeRates[currencyCode] = rate
      
      // Log des principales devises
      if (['USD', 'EUR', 'GBP', 'MGA'].includes(currencyCode)) {
        console.log(`💰 ${currencyCode}: ${rate}`)
      }
    })

    // Solution temporaire : forcer EUR et GBP s'ils sont manquants
    if (!exchangeRates['EUR']) {
      exchangeRates['EUR'] = 0.000196
      console.log('🔧 EUR forcé: 0.000196')
    }
    if (!exchangeRates['GBP']) {
      exchangeRates['GBP'] = 0.000168
      console.log('🔧 GBP forcé: 0.000168')
    }

    console.log(`🔢 Après transformation: ${Object.keys(exchangeRates).length} taux dans l'objet exchangeRates`)
    console.log('🔍 Clés des taux:', Object.keys(exchangeRates).slice(0, 10).join(', '))

    // Récupérer aussi les paramètres de devise principale
    const currencySettings = await db.setting.findMany({
      where: {
        key: {
          in: ['currency', 'currencySymbol']
        }
      }
    })
    
    const currency = currencySettings.find(s => s.key === 'currency')?.value || 'MGA'
    const currencySymbol = currencySettings.find(s => s.key === 'currencySymbol')?.value || 'Ar'

    console.log(`🏛️ Devise principale: ${currency} (${currencySymbol})`)
    
    const responseData = {
      currency,
      currencySymbol,
      exchangeRates
    }
    
    console.log(`📈 Retour de ${Object.keys(responseData.exchangeRates).length} taux de change`)
    console.log(`🎯 Exemple de réponse: USD=${responseData.exchangeRates.USD}, EUR=${responseData.exchangeRates.EUR}`)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des taux de change publics:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
} 