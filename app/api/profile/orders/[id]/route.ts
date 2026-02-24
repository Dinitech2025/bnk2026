import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const orderId = params.id

    if (!orderId) {
      return NextResponse.json(
        { message: 'ID de commande requis' },
        { status: 400 }
      )
    }

    // Récupérer les détails de la commande
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              }
            },
            service: {
              select: {
                id: true,
                name: true,
              }
            },
            offer: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        shippingAddress: true,
        billingAddress: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier que la commande appartient à l'utilisateur connecté
    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Vous n\'êtes pas autorisé à voir cette commande' },
        { status: 403 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de la commande:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 