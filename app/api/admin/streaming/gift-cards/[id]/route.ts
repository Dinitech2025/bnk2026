import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireStaff } from '@/lib/auth'

// GET - Récupérer une carte cadeau spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // En production: const user = await requireStaff()
    
    const giftCard = await db.giftCard.findUnique({
      where: { id: params.id },
      include: {
        platform: {
          select: {
            name: true,
            logo: true
          }
        },
        usedBy: {
          select: {
            email: true
          }
        }
      }
    })

    if (!giftCard) {
      return NextResponse.json(
        { message: 'Carte cadeau non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json(giftCard)
  } catch (error) {
    console.error('Erreur lors de la récupération de la carte cadeau:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une carte cadeau
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // En production: const user = await requireStaff()
    
    // Vérifier si la carte existe et n'est pas utilisée
    const giftCard = await db.giftCard.findUnique({
      where: { id: params.id }
    })

    if (!giftCard) {
      return NextResponse.json(
        { message: 'Carte cadeau non trouvée' },
        { status: 404 }
      )
    }

    if (giftCard.status === 'USED') {
      return NextResponse.json(
        { message: 'Impossible de supprimer une carte cadeau déjà utilisée' },
        { status: 400 }
      )
    }

    // Supprimer la carte
    await db.giftCard.delete({
      where: { id: params.id }
    })

    return NextResponse.json(
      { message: 'Carte cadeau supprimée avec succès' }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression de la carte cadeau:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 