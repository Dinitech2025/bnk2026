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

    // Récupérer les propositions de prix de l'utilisateur
    const proposals = await prisma.quote.findMany({
      where: { 
        userId,
        negotiationType: 'PRODUCT_PRICE'
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
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
    const transformedProposals = proposals.map(proposal => ({
      id: proposal.id,
      status: proposal.status,
      description: proposal.description,
      proposedPrice: proposal.proposedPrice ? Number(proposal.proposedPrice) : 0,
      finalPrice: proposal.finalPrice ? Number(proposal.finalPrice) : null,
      adminResponse: proposal.adminResponse,
      createdAt: proposal.createdAt.toISOString(),
      product: proposal.product ? {
        id: proposal.product.id,
        name: proposal.product.name,
        slug: proposal.product.slug,
        price: Number(proposal.product.price),
        images: proposal.product.images.map(img => ({ path: img.path }))
      } : null
    }));

    return NextResponse.json(transformedProposals);
  } catch (error) {
    console.error('Erreur lors de la récupération des propositions:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}



