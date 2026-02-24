import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// Récupérer les paramètres de devise
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification et les autorisations
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403 }
      )
    }

    // Récupérer les paramètres de devise de base
    const currencySettings = await db.setting.findMany({
      where: {
        key: {
          in: ['currency', 'currencySymbol']
        }
      }
    })
    
    const currency = currencySettings.find(s => s.key === 'currency')?.value || 'MGA'
    const currencySymbol = currencySettings.find(s => s.key === 'currencySymbol')?.value || 'Ar'

    // Récupérer aussi les taux de change si nécessaire
    const exchangeRateSettings = await db.setting.findMany({
      where: {
        key: {
          startsWith: 'exchangeRate_'
        }
      }
    })

    // Transformer en objet clé-valeur
    const exchangeRates: Record<string, number> = {}
    exchangeRateSettings.forEach((setting) => {
      const currencyCode = setting.key.replace('exchangeRate_', '')
      exchangeRates[currencyCode] = parseFloat(setting.value || '1')
    })

    return NextResponse.json({
      currency,
      currencySymbol,
      exchangeRates
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres de devise:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
}

// Mettre à jour les taux de change
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et les autorisations
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403 }
      )
    }

    // Récupérer les données du corps de la requête
    const data = await request.json()

    // Mettre à jour ou créer chaque taux de change
    for (const [currency, rate] of Object.entries(data)) {
      await db.setting.upsert({
        where: { key: `exchangeRate_${currency}` },
        update: { value: String(rate) },
        create: {
          key: `exchangeRate_${currency}`,
          value: String(rate),
          type: 'NUMBER',
        },
      })
    }

    return new NextResponse(
      JSON.stringify({ success: true }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la mise à jour des taux de change:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
}