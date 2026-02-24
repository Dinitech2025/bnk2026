import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Configuration des entrepôts
const WAREHOUSES = {
  air: {
    usa: { name: 'États-Unis', currency: 'USD', origin: 'usa' },
    france: { name: 'France', currency: 'EUR', origin: 'france' },
    uk: { name: 'Royaume-Uni', currency: 'GBP', origin: 'uk' }
  },
  sea: {
    france: { name: 'France', currency: 'EUR', origin: 'france', transitTime: '1-3 mois' },
    china: { name: 'Chine', currency: 'USD', origin: 'china', transitTime: '1-3 mois' }
  }
}

interface CalculationRequest {
  mode: 'air' | 'sea'
  productName?: string
  productUrl?: string
  supplierPrice: number
  supplierCurrency: string
  weight: number
  warehouse: string
  volume?: number
}

export async function POST(request: NextRequest) {
  try {
    const data: CalculationRequest = await request.json()
    const { mode, productName, productUrl, supplierPrice, supplierCurrency, weight, warehouse, volume } = data

    console.log('🔍 Données reçues:', { mode, supplierPrice, supplierCurrency, weight, warehouse })

    // Validation des données
    if (!mode || supplierPrice === undefined || supplierPrice === null || !supplierCurrency || (weight === undefined && weight !== 0) || !warehouse) {
      return new NextResponse(
        JSON.stringify({ error: 'Données manquantes' }),
        { status: 400 }
      )
    }

    if (supplierPrice <= 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Le prix fournisseur doit être supérieur à 0' }),
        { status: 400 }
      )
    }

    if (mode === 'sea' && (!volume || volume <= 0)) {
      return new NextResponse(
        JSON.stringify({ error: 'Le volume est requis pour le transport maritime' }),
        { status: 400 }
      )
    }

    // Récupérer les taux de change
    const exchangeRateSettings = await prisma.setting.findMany({
      where: {
        key: { startsWith: 'exchangeRate_' }
      }
    })

    const exchangeRates: Record<string, number> = {}
    exchangeRateSettings.forEach((setting: any) => {
      const currencyCode = setting.key.replace('exchangeRate_', '')
      exchangeRates[currencyCode] = parseFloat(setting.value || '1')
    })

    // Valeurs par défaut si les taux sont manquants
    if (!exchangeRates['EUR']) exchangeRates['EUR'] = 0.000196
    if (!exchangeRates['USD']) exchangeRates['USD'] = 0.000214
    if (!exchangeRates['GBP']) exchangeRates['GBP'] = 0.000168
    if (!exchangeRates['MGA']) exchangeRates['MGA'] = 1

    console.log('💱 Taux de change:', exchangeRates)

    // Récupérer les paramètres de calcul depuis ImportCalculationSettings
    const importSettings = await prisma.importCalculationSettings.findMany()
    
    const settings: Record<string, number> = {}
    importSettings.forEach((setting: any) => {
      settings[setting.key] = parseFloat(setting.value || '0')
    })

    console.log('⚙️ Paramètres d\'importation:', settings)

    // Fonction pour convertir vers MGA
    const convertToMGA = (amount: number, fromCurrency: string): number => {
      if (fromCurrency === 'MGA') return amount
      
      const mgaRate = exchangeRates['MGA'] || 1
      const fromRate = exchangeRates[fromCurrency] || 1
      
      if (!fromRate || fromRate === 0) {
        console.error(`❌ Taux de change invalide pour ${fromCurrency} lors de la conversion en MGA`)
        return 0
      }
      
      // Si MGA est le taux de base (1), convertir directement
      // Les taux sont stockés comme "1 MGA = X devise", donc pour convertir de devise vers MGA: amount / rate
      if (mgaRate === 1) {
        const result = amount / fromRate
        if (isNaN(result) || !isFinite(result)) {
          console.error(`❌ Résultat de conversion invalide: ${amount} / ${fromRate} = ${result}`)
          return 0
        }
        return result
      }
      
      const result = amount * (mgaRate / fromRate)
      if (isNaN(result) || !isFinite(result)) {
        console.error(`❌ Résultat de conversion invalide: ${amount} * (${mgaRate} / ${fromRate}) = ${result}`)
        return 0
      }
      return result
    }

    // Obtenir la configuration de l'entrepôt
    const warehouseConfig = WAREHOUSES[mode][warehouse as keyof typeof WAREHOUSES[typeof mode]]
    if (!warehouseConfig) {
      return new NextResponse(
        JSON.stringify({ error: 'Entrepôt non valide' }),
        { status: 400 }
      )
    }

    // Convertir le prix fournisseur en devise de l'entrepôt pour les calculs
    const supplierCurrencyRate = exchangeRates[supplierCurrency] || 1
    const warehouseCurrencyRate = exchangeRates[warehouseConfig.currency] || 1
    
    if (!supplierCurrencyRate || supplierCurrencyRate === 0) {
      console.error(`❌ Taux de change invalide pour ${supplierCurrency}`)
      return new NextResponse(
        JSON.stringify({ error: `Taux de change manquant pour ${supplierCurrency}` }),
        { status: 400 }
      )
    }
    
    const supplierPriceInWarehouseCurrency = supplierPrice * (warehouseCurrencyRate / supplierCurrencyRate)
    
    console.log('💵 Conversion prix fournisseur:', {
      supplierPrice,
      supplierCurrency,
      supplierCurrencyRate,
      warehouseCurrency: warehouseConfig.currency,
      warehouseCurrencyRate,
      supplierPriceInWarehouseCurrency
    })

    // Calculer le transport selon l'origine
    let transportRateInEUR = 0
    switch (warehouseConfig.origin) {
      case 'france':
        transportRateInEUR = settings['transport_france_rate'] || 15
        break
      case 'usa':
        transportRateInEUR = settings['transport_usa_rate'] || 35
        break
      case 'uk':
        transportRateInEUR = settings['transport_uk_rate'] || 18
        break
      case 'china':
        transportRateInEUR = settings['transport_china_rate'] || 25
        break
      default:
        transportRateInEUR = 15
    }
    
    // Convertir le taux de transport de EUR vers la devise de l'entrepôt
    const eurRate = exchangeRates['EUR'] || 0.000196
    const warehouseRate = exchangeRates[warehouseConfig.currency] || 1
    
    if (!eurRate || eurRate === 0) {
      console.error('❌ Taux de change EUR invalide')
      return new NextResponse(
        JSON.stringify({ error: 'Taux de change EUR manquant' }),
        { status: 400 }
      )
    }
    
    const transportRate = transportRateInEUR * (warehouseRate / eurRate)
    const transportCost = weight * transportRate

    console.log('🚚 Transport:', {
      transportRateInEUR,
      warehouseCurrency: warehouseConfig.currency,
      exchangeRateWarehouse: exchangeRates[warehouseConfig.currency],
      exchangeRateEUR: exchangeRates['EUR'],
      transportRate,
      weight,
      transportCost
    })

    // Calculer la commission variable selon le prix
    let commissionRate = 0
    if (supplierPriceInWarehouseCurrency < 10) {
      commissionRate = settings['commission_0_10'] || 25
    } else if (supplierPriceInWarehouseCurrency < 25) {
      commissionRate = settings['commission_10_25'] || 35
    } else if (supplierPriceInWarehouseCurrency < 100) {
      commissionRate = settings['commission_25_100'] || 38
    } else if (supplierPriceInWarehouseCurrency < 200) {
      commissionRate = settings['commission_100_200'] || 30
    } else {
      commissionRate = settings['commission_200_plus'] || 25
    }

    const commission = (supplierPriceInWarehouseCurrency * commissionRate) / 100

    console.log('💰 Commission:', {
      supplierPriceInWarehouseCurrency,
      commissionRate,
      commission
    })

    // Frais fixes
    const processingFee = settings['processing_fee'] || 2
    const taxRate = settings['tax_rate'] || 3.5
    const tax = (supplierPriceInWarehouseCurrency * taxRate) / 100

    console.log('📋 Frais et taxes:', {
      processingFee,
      taxRate,
      tax
    })

    // Total en devise de l'entrepôt
    const totalInWarehouseCurrency = supplierPriceInWarehouseCurrency + transportCost + commission + processingFee + tax

    // Convertir en MGA
    const totalInMGA = convertToMGA(totalInWarehouseCurrency, warehouseConfig.currency)

    console.log('💵 Total:', {
      supplierPriceInWarehouseCurrency,
      transportCost,
      commission,
      processingFee,
      tax,
      totalInWarehouseCurrency,
      totalInMGA,
      warehouseCurrency: warehouseConfig.currency,
      exchangeRate: exchangeRates[warehouseConfig.currency]
    })
    
    // Vérifier que le total n'est pas invalide
    if (isNaN(totalInMGA) || !isFinite(totalInMGA)) {
      console.error('❌ Erreur: Le total calculé est invalide:', {
        supplierPriceInWarehouseCurrency,
        transportCost,
        commission,
        processingFee,
        tax,
        totalInWarehouseCurrency,
        totalInMGA,
        warehouseCurrency: warehouseConfig.currency,
        exchangeRates: {
          MGA: exchangeRates['MGA'],
          [warehouseConfig.currency]: exchangeRates[warehouseConfig.currency],
          EUR: exchangeRates['EUR'],
          USD: exchangeRates['USD']
        }
      })
      return new NextResponse(
        JSON.stringify({ error: 'Erreur lors du calcul du prix total. Vérifiez les taux de change.' }),
        { status: 500 }
      )
    }
    
    // Vérifier que le total est raisonnablement positif (au moins le prix fournisseur devrait être converti)
    if (totalInMGA <= 0 && supplierPrice > 0) {
      console.error('❌ Erreur: Le total calculé est négatif ou nul alors que le prix fournisseur est positif:', {
        supplierPrice,
        supplierCurrency,
        totalInMGA,
        totalInWarehouseCurrency
      })
      return new NextResponse(
        JSON.stringify({ error: 'Erreur lors du calcul du prix total. Le résultat est invalide.' }),
        { status: 500 }
      )
    }

    // Déterminer le délai de livraison
    let transitTime = '2-4 semaines'
    if (mode === 'sea') {
      // Transport maritime
      switch (warehouseConfig.origin) {
        case 'france':
          transitTime = '1-3 mois'
          break
        case 'china':
          transitTime = '1-3 mois'
          break
        default:
          transitTime = '1-3 mois'
      }
    } else {
      // Transport aérien
      switch (warehouseConfig.origin) {
        case 'usa':
          transitTime = '2-4 semaines'
          break
        case 'france':
          transitTime = '2-4 semaines'
          break
        case 'uk':
          transitTime = '2-4 semaines'
          break
        default:
          transitTime = '2-4 semaines'
      }
    }

    const calculation = {
      productInfo: {
        name: productName || 'Produit sans nom',
        url: productUrl,
        weight,
        volume: mode === 'sea' ? volume : undefined,
        mode,
        warehouse: warehouseConfig.name
      },
      costs: {
        supplierPrice: {
          amount: supplierPrice,
          currency: supplierCurrency,
          amountInMGA: convertToMGA(supplierPrice, supplierCurrency)
        },
        transport: {
          amount: transportCost,
          currency: warehouseConfig.currency,
          amountInMGA: convertToMGA(transportCost, warehouseConfig.currency),
          details: `${weight} kg × ${transportRateInEUR} EUR/kg → ${transportRate.toFixed(2)} ${warehouseConfig.currency}/kg`
        },
        commission: {
          amount: commission,
          currency: warehouseConfig.currency,
          amountInMGA: convertToMGA(commission, warehouseConfig.currency),
          rate: commissionRate,
          details: `${commissionRate}% du prix fournisseur`
        },
        fees: {
          processing: {
            amount: processingFee,
            currency: warehouseConfig.currency,
            amountInMGA: convertToMGA(processingFee, warehouseConfig.currency)
          },
          tax: {
            amount: tax,
            currency: warehouseConfig.currency,
            amountInMGA: convertToMGA(tax, warehouseConfig.currency),
            rate: taxRate
          }
        },
        total: totalInMGA
      },
      calculationMethod: `Calcul basé sur les paramètres d'importation de ${warehouseConfig.name}`,
      transitTime
    }

    return NextResponse.json(calculation)
  } catch (error) {
    console.error('Erreur lors du calcul d\'importation:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { status: 500 }
    )
  }
} 