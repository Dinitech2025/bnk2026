import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { providerOfferId } = data

    // Vérifier si le compte existe
    const account = await db.account.findUnique({
      where: { id: params.id },
      include: {
        platform: true
      }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Compte non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si l'offre existe pour cette plateforme
    if (providerOfferId) {
      const offer = await db.platformProviderOffer.findFirst({
        where: {
          id: providerOfferId,
          platformId: account.platformId
        }
      })

      if (!offer) {
        return NextResponse.json(
          { error: 'Offre fournisseur invalide pour cette plateforme' },
          { status: 400 }
        )
      }
    }

    // Mettre à jour l'offre fournisseur du compte
    const updatedAccount = await db.account.update({
      where: { id: params.id },
      data: {
        providerOfferId: providerOfferId || null
      },
      include: {
        platform: true,
        accountProfiles: {
          include: {
            subscription: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedAccount)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'offre fournisseur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour de l\'offre fournisseur' },
      { status: 500 }
    )
  }
} 
 
 