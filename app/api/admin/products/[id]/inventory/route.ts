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
    const { inventory, reason, reference, type } = body

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

    // Vérifier que le produit existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { 
        id: true, 
        name: true, 
        inventory: true 
      }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    const previousInventory = existingProduct.inventory
    const quantityChange = inventory - previousInventory

    // Mettre à jour le stock
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { 
        inventory,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        inventory: true,
        updatedAt: true
      }
    })

    // TODO: Enregistrer le mouvement de stock dans une table d'historique
    // Pour l'instant, on peut créer une entrée de log simple
    console.log(`Stock adjustment for product ${id}:`, {
      productName: existingProduct.name,
      previousInventory,
      newInventory: inventory,
      quantityChange,
      reason,
      reference,
      type,
      adjustedBy: session.user.email,
      adjustedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      adjustment: {
        previousInventory,
        newInventory: inventory,
        quantityChange,
        reason,
        reference,
        type
      }
    })

  } catch (error) {
    console.error('Erreur lors de l\'ajustement du stock:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        inventory: true,
        price: true,
        updatedAt: true,
        variations: {
          select: {
            id: true,
            inventory: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    const totalVariationInventory = product.variations.reduce(
      (sum, variation) => sum + variation.inventory, 
      0
    )

    return NextResponse.json({
      product: {
        ...product,
        totalInventory: product.inventory + totalVariationInventory,
        stockValue: (product.inventory + totalVariationInventory) * Number(product.price)
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération du stock:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}