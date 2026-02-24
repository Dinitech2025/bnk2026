import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    console.log('🧹 Vidage du panier pour utilisateur:', session.user.id)

    // Supprimer tous les articles du panier de l'utilisateur
    const deletedItems = await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: session.user.id
        }
      }
    })

    // Supprimer le panier lui-même
    const deletedCart = await prisma.cart.deleteMany({
      where: {
        userId: session.user.id
      }
    })

    console.log('✅ Panier vidé:', {
      itemsDeleted: deletedItems.count,
      cartsDeleted: deletedCart.count
    })

    return NextResponse.json({
      success: true,
      message: 'Panier vidé avec succès',
      itemsDeleted: deletedItems.count,
      cartsDeleted: deletedCart.count
    })

  } catch (error) {
    console.error('❌ Erreur lors du vidage du panier:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}