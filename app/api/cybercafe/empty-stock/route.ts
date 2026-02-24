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

    // Démarrer une transaction pour s'assurer que tout est cohérent
    const result = await prisma.$transaction(async (tx) => {
      // 1. Supprimer tous les codes de tickets
      const deletedCodes = await tx.ticketCode.deleteMany({});

      // 2. Remettre à zéro le stock de tous les tickets
      const updatedTickets = await tx.ticket.updateMany({
        data: {
          stock: 0
        }
      });

      // 3. Créer des entrées dans l'historique pour tracer cette action
      const tickets = await tx.ticket.findMany();
      
      for (const ticket of tickets) {
        if (ticket.stock > 0) {
          await tx.stockUpdate.create({
            data: {
              ticketId: ticket.id,
              amount: -ticket.stock, // Quantité négative pour indiquer une suppression
              previousStock: ticket.stock,
              newStock: 0
            }
          });
        }
      }

      return {
        deletedCodes: deletedCodes.count,
        updatedTickets: updatedTickets.count,
        affectedTickets: tickets.filter(t => t.stock > 0).length
      };
    });

    console.log('Stocks vidés:', result);

    return NextResponse.json({
      success: true,
      message: 'Tous les stocks ont été vidés avec succès',
      deletedCodes: result.deletedCodes,
      updatedTickets: result.updatedTickets,
      affectedTickets: result.affectedTickets
    });

  } catch (error: any) {
    console.error('Erreur lors du vidage des stocks:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors du vidage des stocks',
        details: error.message || 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 
 