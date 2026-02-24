import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, quantity } = body

    console.log(`📦 Décrémentation inventaire: Produit ${productId}, Quantité -${quantity}`)

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Données invalides - productId et quantity requis' },
        { status: 400 }
      )
    }

    // Vérifier que le produit existe et a assez de stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        inventory: true
      }
    })

    if (!product) {
      console.warn(`⚠️ Produit non trouvé: ${productId}`)
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier le stock disponible
    if (product.inventory < quantity) {
      console.warn(`⚠️ Stock insuffisant: ${product.name} (${product.inventory} disponible, ${quantity} demandé)`)
      return NextResponse.json(
        { 
          error: 'Stock insuffisant',
          available: product.inventory,
          requested: quantity
        },
        { status: 400 }
      )
    }

    // Décrémenter le stock
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        inventory: {
          decrement: quantity
        }
      },
      select: {
        id: true,
        name: true,
        inventory: true
      }
    })

    console.log(`✅ Inventaire décrémenté: ${product.name}`)
    console.log(`   Stock avant: ${product.inventory}`)
    console.log(`   Quantité vendue: ${quantity}`)
    console.log(`   Stock après: ${updatedProduct.inventory}`)

    // Log d'audit
    console.log(`📋 AUDIT INVENTAIRE: ${product.name} (${productId})`)
    console.log(`   Opération: VENTE (-${quantity})`)
    console.log(`   Stock: ${product.inventory} → ${updatedProduct.inventory}`)

    // Alerte si stock faible
    if (updatedProduct.inventory <= 5) {
      console.log(`🔔 ALERTE STOCK FAIBLE: ${product.name} (${updatedProduct.inventory} restant)`)
    }

    return NextResponse.json({
      success: true,
      message: 'Inventaire mis à jour avec succès',
      productId,
      productName: product.name,
      oldStock: product.inventory,
      newStock: updatedProduct.inventory,
      decremented: quantity,
      changed: true,
      lowStockAlert: updatedProduct.inventory <= 5
    })

  } catch (error) {
    console.error('❌ Erreur décrémentation inventaire:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la mise à jour de l\'inventaire',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
