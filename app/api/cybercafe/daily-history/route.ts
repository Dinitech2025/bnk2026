import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/cybercafe/daily-history - Récupérer l'historique du jour
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    // Début et fin de la journée
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dailyHistory = await prisma.dailyTicketHistory.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        ticket: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      history: dailyHistory
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique journalier:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    );
  }
}

// POST /api/cybercafe/daily-history - Ajouter une entrée à l'historique
export async function POST(request: Request) {
  try {
    const { ticketId, type, quantity, reason, code, date } = await request.json();

    console.log('📝 Création entrée historique:', { ticketId, type, quantity, reason, code, date });

    // Vérifier que les paramètres sont valides
    if (!ticketId || !type || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Paramètres invalides' },
        { status: 400 }
      );
    }

    // Vérifier que le type est valide
    if (!['USED', 'BROKEN'].includes(type)) {
      return NextResponse.json(
        { error: 'Type invalide. Doit être USED ou BROKEN' },
        { status: 400 }
      );
    }

    // Pour les tickets défaillants, la raison est obligatoire
    if (type === 'BROKEN' && !reason) {
      return NextResponse.json(
        { error: 'La raison est obligatoire pour les tickets défaillants' },
        { status: 400 }
      );
    }

    // Utiliser la date fournie ou la date du jour
    const entryDate = date ? new Date(date) : new Date();
    
    // Créer l'entrée d'historique
    const historyEntry = await prisma.dailyTicketHistory.create({
      data: {
        ticketId,
        type,
        quantity,
        reason: type === 'BROKEN' ? reason : null,
        code: code || null, // Sauvegarder le code si fourni
        date: entryDate
      },
      include: {
        ticket: true
      }
    });

    console.log('✅ Entrée historique créée:', historyEntry);

    return NextResponse.json({
      success: true,
      entry: historyEntry
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout à l\'historique:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout à l\'historique' },
      { status: 500 }
    );
  }
} 