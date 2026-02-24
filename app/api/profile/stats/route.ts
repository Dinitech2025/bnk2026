import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;

    // Récupérer les statistiques en parallèle
    const [
      totalBids,
      activeBids,
      wonBids,
      totalQuotes,
      pendingQuotes,
      totalOrders,
      totalSpentResult
    ] = await Promise.all([
      // Total des enchères
      prisma.bid.count({
        where: { userId }
      }),
      // Enchères actives (ACCEPTED et pas expirées)
      prisma.bid.count({
        where: {
          userId,
          status: 'ACCEPTED',
          product: {
            auctionEndDate: {
              gt: new Date()
            }
          }
        }
      }),
      // Enchères gagnées
      prisma.bid.count({
        where: {
          userId,
          status: 'WON'
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
          status: 'PENDING'
        }
      }),
      // Total des commandes
      prisma.order.count({
        where: { userId }
      }),
      // Total dépensé
      prisma.order.aggregate({
        where: {
          userId,
          status: {
            in: ['COMPLETED', 'DELIVERED']
          }
        },
        _sum: {
          totalPrice: true
        }
      })
    ]);

    const stats = {
      totalBids,
      activeBids,
      wonBids,
      totalQuotes,
      pendingQuotes,
      totalOrders,
      totalSpent: Number(totalSpentResult._sum.totalPrice) || 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}



