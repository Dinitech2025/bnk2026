import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering for authentication routes
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const carts = await prisma.cart.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        items: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Calculer le total pour chaque panier
    const cartsWithTotals = carts.map(cart => {
      const total = cart.items.reduce((sum, item) => {
        return sum + (parseFloat(item.price.toString()) * item.quantity)
      }, 0)

      return {
        ...cart,
        total,
        itemCount: cart._count.items
      }
    })

    return NextResponse.json(cartsWithTotals)
  } catch (error) {
    console.error('Erreur lors de la récupération des paniers:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paniers' },
      { status: 500 }
    )
  }
} 