import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { syncExchangeRates } from '@/lib/currency-service'

// Forcer le mode dynamique pour cette route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification et les autorisations
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403 }
      )
    }

    // Extraire le paramètre force de l'URL
    const { searchParams } = new URL(request.url)
    const forceUpdate = searchParams.get('force') === 'true'

    // Synchroniser les taux de change
    const success = await syncExchangeRates(forceUpdate)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Taux de change synchronisés avec succès'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Aucune mise à jour n\'était nécessaire ou une erreur s\'est produite'
      }, { status: 200 })
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation des taux de change:', error)
    return new NextResponse(
      JSON.stringify({ 
        success: false,
        error: 'Erreur lors de la synchronisation des taux de change' 
      }),
      { status: 500 }
    )
  }
} 
 
 
 
 
 
 