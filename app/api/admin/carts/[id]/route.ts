import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const cart = await prisma.cart.findUnique({
      where: {
        id: params.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            createdAt: true
          }
        },
        items: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!cart) {
      return NextResponse.json({ error: 'Panier non trouvé' }, { status: 404 })
    }

    // Calculer le total
    const total = cart.items.reduce((sum, item) => {
      return sum + (parseFloat(item.price.toString()) * item.quantity)
    }, 0)

    const cartWithTotal = {
      ...cart,
      total,
      itemCount: cart.items.length
    }

    return NextResponse.json(cartWithTotal)
  } catch (error) {
    console.error('Erreur lors de la récupération du panier:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du panier' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    await prisma.cart.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ message: 'Panier supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du panier:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du panier' },
      { status: 500 }
    )
  }
} 