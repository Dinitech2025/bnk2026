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

    // Récupérer les devis de l'utilisateur
    const quotes = await prisma.quote.findMany({
      where: { userId },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            slug: true
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
    const transformedQuotes = quotes.map(quote => ({
      id: quote.id,
      status: quote.status,
      description: quote.description,
      budget: quote.budget ? Number(quote.budget) : null,
      finalPrice: quote.finalPrice ? Number(quote.finalPrice) : null,
      createdAt: quote.createdAt.toISOString(),
      service: quote.service ? {
        id: quote.service.id,
        name: quote.service.name,
        slug: quote.service.slug
      } : null
    }));

    return NextResponse.json(transformedQuotes);
  } catch (error) {
    console.error('Erreur lors de la récupération des devis:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}



