import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { ticketId } = await request.json();
    
    if (!ticketId) {
      return NextResponse.json(
        { error: 'ID du ticket requis' },
        { status: 400 }
      );
    }

    // Vérifier que le ticket existe et a du stock
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket non trouvé' },
        { status: 404 }
      );
    }

    if (ticket.stock <= 0) {
      return NextResponse.json(
        { error: 'Stock épuisé pour ce type de ticket' },
        { status: 400 }
      );
    }

    // Récupérer un code non-utilisé de la base de données
    const availableTicketCode = await prisma.ticketCode.findFirst({
      where: {
        ticketId: ticketId,
        isUsed: false
      },
      orderBy: {
        createdAt: 'asc' // Premier arrivé, premier servi
      }
    });

    if (!availableTicketCode) {
      return NextResponse.json(
        { error: 'Aucun code disponible pour ce type de ticket' },
        { status: 400 }
      );
    }

    const ticketCode = availableTicketCode.code;

    // Marquer le code comme utilisé et décrémenter le stock en transaction
    const [updatedTicket, updatedCode] = await prisma.$transaction([
      prisma.ticket.update({
        where: { id: ticketId },
        data: { stock: ticket.stock - 1 }
      }),
      prisma.ticketCode.update({
        where: { id: availableTicketCode.id },
        data: { 
          isUsed: true,
          usedAt: new Date()
        }
      })
    ]);

    // Enregistrer l'utilisation dans l'historique journalier
    await prisma.dailyTicketHistory.create({
      data: {
        ticketId: ticketId,
        type: 'USED',
        quantity: 1,
        code: ticketCode,
        reason: `Ticket utilisé - Code: ${ticketCode}`
      }
    });

    console.log(`✅ Ticket utilisé: ${ticket.duration} - Code: ${ticketCode} - Stock restant: ${updatedTicket.stock}`);

    return NextResponse.json({
      success: true,
      ticket: {
        id: updatedTicket.id,
        duration: updatedTicket.duration,
        price: updatedTicket.price,
        remainingStock: updatedTicket.stock
      },
      code: ticketCode,
      message: `Ticket ${ticket.duration} utilisé avec succès`
    });

  } catch (error: any) {
    console.error('Erreur lors de l\'utilisation du ticket:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur serveur',
        details: error.message || 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 
 