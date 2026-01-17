import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API product-quote appelée');
    
    const session = await getServerSession(authOptions);
    console.log('🔍 Session:', session?.user?.id ? 'OK' : 'NON');
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    console.log('🔍 Body reçu:', body);
    
    const { productId, description, budget, clientMessage } = body;

    // Validation des données
    if (!productId || !description?.trim()) {
      console.error('❌ Données manquantes:', { productId, description });
      return NextResponse.json(
        { error: 'Le produit et la description sont requis' },
        { status: 400 }
      );
    }

    console.log('🔍 Recherche du produit:', productId);
    
    // Vérifier que le produit existe et nécessite un devis
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        pricingType: true,
        price: true,
        published: true,
        requiresQuote: true
      }
    });

    console.log('🔍 Produit trouvé:', product ? 'OUI' : 'NON');

    if (!product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    if (!product.published) {
      return NextResponse.json(
        { error: 'Ce produit n\'est pas disponible' },
        { status: 400 }
      );
    }

    if (product.pricingType !== 'QUOTE_REQUIRED') {
      console.error('❌ Produit ne nécessite pas de devis:', product.pricingType);
      return NextResponse.json(
        { error: 'Ce produit ne nécessite pas de devis' },
        { status: 400 }
      );
    }

    console.log('🔍 Vérification des devis existants...');
    
    // Vérifier s'il y a déjà un devis en cours pour ce produit
    const existingQuote = await prisma.quote.findFirst({
      where: {
        userId: session.user.id,
        productId: productId,
        status: { in: ['PENDING', 'NEGOTIATING'] },
        negotiationType: 'PRODUCT_QUOTE'
      }
    });

    if (existingQuote) {
      console.warn('⚠️ Devis déjà existant pour ce produit par cet utilisateur.');
      return NextResponse.json(
        { error: 'Vous avez déjà un devis en cours pour ce produit' },
        { status: 400 }
      );
    }

    console.log('🔍 Création du devis...');
    
    // Créer le devis pour le produit
    const quote = await prisma.quote.create({
      data: {
        userId: session.user.id,
        productId: productId,
        description: description.trim(),
        budget: budget ? Number(budget) : null,
        status: 'PENDING',
        negotiationType: 'PRODUCT_QUOTE'
      }
    });

    console.log('✅ Devis créé:', quote.id);

    // Créer un message initial si fourni
    if (clientMessage && clientMessage.trim()) {
      console.log('🔍 Création du message initial...');
      try {
        await prisma.quoteMessage.create({
          data: {
            quoteId: quote.id,
            message: clientMessage.trim(),
            senderId: session.user.id
          }
        });
        console.log('✅ Message initial créé.');
      } catch (messageError) {
        console.warn('⚠️ Erreur message (non bloquante):', messageError);
      }
    }

    // Réponse simplifiée
    const response = {
      message: 'Demande de devis envoyée avec succès',
      quote: {
        id: quote.id,
        status: quote.status,
        description: quote.description,
        budget: quote.budget ? Number(quote.budget) : null,
        negotiationType: quote.negotiationType,
        createdAt: quote.createdAt.toISOString(),
        product: {
          id: product.id,
          name: product.name,
          price: Number(product.price)
        }
      }
    };

    console.log('✅ Réponse envoyée.');
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du devis:', error);
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



