import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { forceSyncNow } from '@/lib/currency-auto-sync'
import { fetchExchangeRates } from '@/lib/currency-service'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    // Forcer la synchronisation
    const success = await forceSyncNow()
    
    if (success) {
      // Récupérer les nouveaux taux
      const rates = await fetchExchangeRates()
      
      return NextResponse.json({
        success: true,
        message: 'Taux de change synchronisés avec succès',
        rates,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Échec de la synchronisation des taux de change' 
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation des taux:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer les taux actuels
    const rates = await fetchExchangeRates()
    
    return NextResponse.json({
      success: true,
      rates,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des taux:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    )
  }
} 