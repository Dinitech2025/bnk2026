import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// DELETE /api/cybercafe/daily-history/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Supprimer l'entrée d'historique
    await prisma.dailyTicketHistory.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Entrée d\'historique supprimée'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'historique:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
} 
 