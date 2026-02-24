import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Compter le nombre total de commandes
    const count = await prisma.order.count();
    
    // Récupérer quelques commandes avec des données minimales
    const orders = await prisma.order.findMany({
      take: 10,
      select: {
        id: true,
        userId: true,
        status: true,
        total: true,
        createdAt: true,
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Récupérer la structure de la table pour vérifier les champs
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Order'
    `;
    
    return NextResponse.json({
      success: true,
      count,
      orders: orders.map(order => ({
        ...order,
        createdAt: order.createdAt.toISOString()
      })),
      tableInfo
    });
  } catch (error) {
    console.error('Erreur debug db-orders:', error);
    return NextResponse.json({ 
      success: false,
      error: String(error)
    }, { status: 500 });
  }
} 