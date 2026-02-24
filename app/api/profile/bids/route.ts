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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const userId = session.user.id;

    // Récupérer les enchères de l'utilisateur
    const bids = await prisma.bid.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            currentHighestBid: true,
            auctionEndDate: true,
            images: {
              take: 1,
              select: {
                path: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Transformer les données pour éviter les problèmes de sérialisation
    const transformedBids = bids.map(bid => ({
      id: bid.id,
      amount: Number(bid.amount),
      status: bid.status,
      createdAt: bid.createdAt.toISOString(),
      product: {
        id: bid.product.id,
        name: bid.product.name,
        slug: bid.product.slug,
        currentHighestBid: bid.product.currentHighestBid ? Number(bid.product.currentHighestBid) : null,
        auctionEndDate: bid.product.auctionEndDate ? bid.product.auctionEndDate.toISOString() : null,
        images: bid.product.images.map(img => ({ path: img.path }))
      }
    }));

    return NextResponse.json(transformedBids);
  } catch (error) {
    console.error('Erreur lors de la récupération des enchères:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}



