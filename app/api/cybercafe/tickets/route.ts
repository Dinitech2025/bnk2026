import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/cybercafe/tickets
export async function GET() {
  try {
    console.log('🔍 Vérification de la session...');
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('❌ Pas de session utilisateur');
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      console.log('❌ Utilisateur non admin:', session.user);
      return NextResponse.json(
        { error: 'Non autorisé - rôle requis: ADMIN' },
        { status: 401 }
      );
    }

    console.log('✅ Session valide, récupération des tickets...');
    const tickets = await prisma.ticket.findMany({
      orderBy: {
        duration: 'asc'
      }
    });

    console.log(`📊 ${tickets.length} tickets trouvés`);
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('❌ Erreur détaillée lors de la récupération des tickets:', {
      error,
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

// POST /api/cybercafe/tickets
export async function POST(request: Request) {
  try {
    const { duration, price } = await request.json();
    console.log('📝 Tentative de création de ticket:', { duration, price });

    // Vérifier si un ticket avec cette durée existe déjà
    const existingTicket = await prisma.ticket.findFirst({
      where: { duration }
    });

    if (existingTicket) {
      console.log('⚠️ Ticket existant trouvé:', existingTicket);
      return NextResponse.json(
        { error: 'Un ticket avec cette durée existe déjà' },
        { status: 400 }
      );
    }

    // Créer le nouveau ticket
    const ticket = await prisma.ticket.create({
      data: {
        duration,
        price,
        stock: 0
      }
    });

    console.log('✅ Nouveau ticket créé:', ticket);
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('❌ Erreur lors de la création du ticket:', {
      error,
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création du ticket',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 