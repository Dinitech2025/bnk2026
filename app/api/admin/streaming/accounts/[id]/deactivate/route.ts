import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier si le compte existe
    const account = await prisma.account.findUnique({
      where: { id: params.id },
      include: {
        platform: true,
        accountProfiles: true
      }
    })

    if (!account) {
      return NextResponse.json(
        { message: 'Compte non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour le compte avec une transaction
    const updatedAccount = await prisma.$transaction(async (tx) => {
      // Mettre à jour le statut
      await tx.account.update({
        where: { id: params.id },
        data: {
          status: 'INACTIVE'
        }
      })

      // Un compte inactif est toujours indisponible
      await tx.$executeRaw`UPDATE "Account" SET "availability" = false WHERE id = ${params.id}`

      // Récupérer le compte mis à jour avec tous les détails
      return tx.account.findUnique({
        where: { id: params.id },
        include: {
          platform: true,
          accountProfiles: true
        }
      })
    })

    return NextResponse.json(updatedAccount)
  } catch (error) {
    console.error('Erreur lors de la désactivation du compte:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 
 
 