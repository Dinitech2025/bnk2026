import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API product-proposal appelée');
    
    const session = await getServerSession(authOptions);
    console.log('🔍 Session:', session?.user?.id ? 'OK' : 'NON');
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    console.log('🔍 Body reçu:', body);
    
    const { productId, proposedPrice, clientMessage } = body;

    // Validation des données
    if (!productId || !proposedPrice) {
      console.log('❌ Données manquantes:', { productId, proposedPrice });
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    console.log('🔍 Recherche du produit:', productId);
    
    // Vérifier que le produit existe et est négociable
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        pricingType: true,
        price: true,
        minPrice: true,
        maxPrice: true
      }
    });

    console.log('🔍 Produit trouvé:', product ? 'OUI' : 'NON');

    if (!product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    if (product.pricingType !== 'NEGOTIABLE' && product.pricingType !== 'RANGE') {
      console.log('❌ Produit non négociable:', product.pricingType);
      return NextResponse.json(
        { error: 'Ce produit n\'est pas négociable' },
        { status: 400 }
      );
    }

    console.log('🔍 Vérification des propositions existantes...');
    
    // Vérifier s'il y a déjà une proposition en cours pour ce produit
    const existingQuote = await prisma.quote.findFirst({
      where: {
        userId: session.user.id,
        productId: productId,
        status: 'PENDING',
        negotiationType: 'PRODUCT_PRICE'
      }
    });

    if (existingQuote) {
      console.log('❌ Proposition déjà existante');
      return NextResponse.json(
        { error: 'Vous avez déjà une proposition en cours pour ce produit' },
        { status: 400 }
      );
    }

    console.log('🔍 Création du devis...');
    
    // Créer le devis pour la proposition de prix
    const quote = await prisma.quote.create({
      data: {
        userId: session.user.id,
        productId: productId,
        proposedPrice: proposedPrice,
        description: `Proposition de prix pour ${product.name}`,
        status: 'PENDING',
        negotiationType: 'PRODUCT_PRICE'
      }
    });

    console.log('✅ Devis créé:', quote.id);

    // Créer un message initial si fourni
    if (clientMessage && clientMessage.trim()) {
      console.log('🔍 Création du message...');
      try {
        await prisma.quoteMessage.create({
          data: {
            quoteId: quote.id,
            message: clientMessage.trim(),
            senderId: session.user.id
          }
        });
        console.log('✅ Message créé');
      } catch (messageError) {
        console.log('⚠️ Erreur message (non bloquante):', messageError);
      }
    }

    // Réponse simplifiée
    const response = {
      message: 'Proposition de prix envoyée avec succès',
      quote: {
        id: quote.id,
        status: quote.status,
        proposedPrice: Number(quote.proposedPrice),
        negotiationType: quote.negotiationType
      }
    };

    console.log('✅ Réponse envoyée:', response);
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la proposition:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : error);
    
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}