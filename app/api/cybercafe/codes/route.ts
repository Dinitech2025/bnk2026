import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Force dynamic rendering for authentication routes
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    console.log('📋 Récupération des codes de tickets disponibles...');

    // Récupérer tous les tickets
    const tickets = await prisma.ticket.findMany({
      orderBy: {
        duration: 'asc'
      }
    });

    console.log(`📊 Tickets trouvés: ${tickets.length}`);

    // Pour chaque ticket, récupérer les codes disponibles et utilisés
    const ticketsWithCodes = await Promise.all(
      tickets.map(async (ticket) => {
        // Codes disponibles (non utilisés)
        const availableCodes = await prisma.ticketCode.findMany({
          where: {
            ticketId: ticket.id,
            isUsed: false
          },
          orderBy: {
            createdAt: 'asc'
          },
          select: {
            id: true,
            code: true,
            createdAt: true
          }
        });

        // Compter les codes utilisés
        const usedCount = await prisma.ticketCode.count({
          where: {
            ticketId: ticket.id,
            isUsed: true
          }
        });

        console.log(`🎫 Ticket ${ticket.duration}: ${availableCodes.length} disponibles, ${usedCount} utilisés`);

        return {
          id: ticket.id,
          duration: ticket.duration,
          price: ticket.price,
          totalStock: ticket.stock,
          availableCount: availableCodes.length,
          usedCount: usedCount,
          availableCodes: availableCodes.map(code => ({
            id: code.id,
            code: code.code,
            createdAt: code.createdAt.toISOString()
          }))
        };
      })
    );

    // Calculer les totaux
    const totalAvailable = ticketsWithCodes.reduce((sum, ticket) => sum + ticket.availableCount, 0);
    const totalUsed = ticketsWithCodes.reduce((sum, ticket) => sum + ticket.usedCount, 0);

    console.log(`📊 Résumé: ${totalAvailable} codes disponibles, ${totalUsed} codes utilisés`);

    return NextResponse.json({
      success: true,
      summary: {
        totalAvailable,
        totalUsed,
        totalTicketTypes: ticketsWithCodes.length
      },
      tickets: ticketsWithCodes
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des codes:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des codes' },
      { status: 500 }
    );
  }
} 
 