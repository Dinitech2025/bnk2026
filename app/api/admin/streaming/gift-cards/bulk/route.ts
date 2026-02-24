import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireStaff } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // En production: const user = await requireStaff()
    
    const data = await request.json()
    const { codes, amount } = data

    if (!Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json(
        { message: 'La liste des codes est requise' },
        { status: 400 }
      )
    }

    // Récupérer l'ID de la plateforme Netflix
    const netflix = await db.platform.findUnique({
      where: { slug: 'netflix' }
    })

    if (!netflix) {
      return NextResponse.json(
        { message: 'La plateforme Netflix n\'existe pas' },
        { status: 400 }
      )
    }

    // Vérifier si des codes existent déjà
    const existingCodes = await db.giftCard.findMany({
      where: {
        code: {
          in: codes
        }
      },
      select: {
        code: true
      }
    })

    if (existingCodes.length > 0) {
      return NextResponse.json(
        { 
          message: 'Certains codes existent déjà',
          existingCodes: existingCodes.map(ec => ec.code)
        },
        { status: 400 }
      )
    }

    // Créer toutes les cartes cadeaux en une seule transaction
    const giftCards = await db.giftCard.createMany({
      data: codes.map(code => ({
        code,
        amount,
        currency: 'TRY',
        platformId: netflix.id,
        status: 'ACTIVE'
      }))
    })

    return NextResponse.json({
      message: `${giftCards.count} cartes cadeaux créées avec succès`
    })
  } catch (error) {
    console.error('Erreur lors de la création des cartes cadeaux:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 