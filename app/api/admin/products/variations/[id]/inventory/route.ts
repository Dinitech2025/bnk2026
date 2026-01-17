import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { inventory, reason } = body

    // Validation
    if (typeof inventory !== 'number' || inventory < 0) {
      return NextResponse.json(
        { error: 'Quantité invalide' },
        { status: 400 }
      )
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Raison requise' },
        { status: 400 }
      )
    }

    // Vérifier que la variation existe
    const existingVariation = await prisma.productVariation.findUnique({
      where: { id },
      select: { 
        id: true, 
        inventory: true,
        product: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!existingVariation) {
      return NextResponse.json(
        { error: 'Variation non trouvée' },
        { status: 404 }
      )
    }

    const previousInventory = existingVariation.inventory
    const quantityChange = inventory - previousInventory

    // Mettre à jour le stock de la variation
    const updatedVariation = await prisma.productVariation.update({
      where: { id },
      data: { 
        inventory,
        updatedAt: new Date()
      },
      select: {
        id: true,
        inventory: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Log de l'ajustement
    console.log(`Variation stock adjustment for variation ${id}:`, {
      productId: existingVariation.product.id,
      productName: existingVariation.product.name,
      variationId: id,
      previousInventory,
      newInventory: inventory,
      quantityChange,
      reason,
      adjustedBy: session.user.email,
      adjustedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      variation: updatedVariation,
      adjustment: {
        previousInventory,
        newInventory: inventory,
        quantityChange,
        reason
      }
    })

  } catch (error) {
    console.error('Erreur lors de l\'ajustement du stock de la variation:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}



