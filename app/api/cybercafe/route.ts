import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/cybercafe/tickets
export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany();
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des tickets" }, { status: 500 });
  }
}

// POST /api/cybercafe/stock
export async function POST(req: Request) {
  try {
    const { ticketId, amount } = await req.json();
    
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket non trouvé" }, { status: 404 });
    }

    // Mise à jour du stock
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        stock: ticket.stock + amount,
        stockUpdates: {
          create: {
            amount,
            previousStock: ticket.stock,
            newStock: ticket.stock + amount
          }
        }
      }
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour du stock" }, { status: 500 });
  }
} 
 