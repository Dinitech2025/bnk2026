import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = params.id

    // Récupérer les statistiques en parallèle
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalQuotes,
      pendingQuotes,
      acceptedQuotes,
      totalSubscriptions,
      activeSubscriptions,
      totalSpentResult
    ] = await Promise.all([
      // Total des commandes
      prisma.order.count({
        where: { userId }
      }),
      // Commandes en attente
      prisma.order.count({
        where: {
          userId,
          status: { in: ['PENDING', 'PROCESSING', 'CONFIRMED'] }
        }
      }),
      // Commandes complétées
      prisma.order.count({
        where: {
          userId,
          status: { in: ['COMPLETED', 'DELIVERED'] }
        }
      }),
      // Total des devis
      prisma.quote.count({
        where: { userId }
      }),
      // Devis en attente
      prisma.quote.count({
        where: {
          userId,
          status: { in: ['PENDING', 'NEGOTIATING', 'PRICE_PROPOSED'] }
        }
      }),
      // Devis acceptés
      prisma.quote.count({
        where: {
          userId,
          status: 'ACCEPTED'
        }
      }),
      // Total des abonnements
      prisma.subscription.count({
        where: { userId }
      }),
      // Abonnements actifs
      prisma.subscription.count({
        where: {
          userId,
          status: 'ACTIVE'
        }
      }),
      // Total dépensé
      prisma.order.aggregate({
        where: {
          userId,
          status: { in: ['COMPLETED', 'DELIVERED'] }
        },
        _sum: {
          totalPrice: true
        }
      })
    ])

    const stats = {
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders
      },
      quotes: {
        total: totalQuotes,
        pending: pendingQuotes,
        accepted: acceptedQuotes
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions
      },
      totalSpent: Number(totalSpentResult._sum.totalPrice) || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}


