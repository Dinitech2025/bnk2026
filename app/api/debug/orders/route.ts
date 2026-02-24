import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    const formattedOrders = orders.map(order => ({
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }));
    
    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Error in debug/orders GET:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Récupérer un utilisateur pour la création de la commande
    const users = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      take: 1,
    });
    
    if (users.length === 0) {
      return NextResponse.json({ error: "Aucun utilisateur trouvé" }, { status: 404 });
    }
    
    const userId = users[0].id;
    
    // Récupérer un produit pour la commande
    const products = await prisma.product.findMany({
      take: 1,
    });
    
    if (products.length === 0) {
      return NextResponse.json({ error: "Aucun produit trouvé" }, { status: 404 });
    }
    
    const productId = products[0].id;
    
    // Récupérer le dernier numéro de commande
    const lastOrder = await prisma.order.findFirst({
      where: {
        orderNumber: {
          not: null
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        orderNumber: true
      }
    });
    
    // Générer le nouveau numéro de commande
    const orderNumber = generateOrderNumber(lastOrder?.orderNumber);
    
    // Créer une commande de test
    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber,
        status: 'PENDING',
        total: 29.99,
        items: {
          create: {
            quantity: 1,
            unitPrice: 29.99,
            totalPrice: 29.99,
            itemType: 'PRODUCT',
            productId,
          },
        },
      },
      include: {
        user: true,
        items: true,
      },
    });
    
    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      message: "Commande de test créée avec succès",
    });
  } catch (error) {
    console.error('Error in debug/orders POST:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
} 