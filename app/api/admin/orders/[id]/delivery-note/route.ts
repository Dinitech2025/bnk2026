import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Récupérer les données de la commande avec les relations nécessaires
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
            service: {
              select: {
                name: true,
              },
            },
            offer: {
              select: {
                name: true,
              },
            },
          },
        },
        shippingAddress: {
          select: {
            street: true,
            city: true,
            zipCode: true,
            country: true,
          },
        },
        billingAddress: {
          select: {
            street: true,
            city: true,
            zipCode: true,
            country: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que la commande est dans un état permettant la génération du bon de livraison
    const allowedStatuses = ['DELIVERED', 'FINISHED', 'SHIPPING', 'PAID', 'CONFIRMED'];
    if (!allowedStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: 'La commande doit être payée, confirmée, en livraison, livrée ou terminée pour générer un bon de livraison' },
        { status: 400 }
      );
    }

    // Formater les données pour le bon de livraison
    const deliveryNoteData = {
      orderNumber: order.orderNumber || '',
      createdAt: order.createdAt.toISOString(),
      user: {
        firstName: order.user.firstName,
        lastName: order.user.lastName,
        email: order.user.email,
        phone: order.user.phone,
      },
      items: order.items.map(item => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : undefined,
        totalPrice: item.totalPrice ? Number(item.totalPrice) : undefined,
        product: item.product,
        service: item.service,
        offer: item.offer,
      })),
      address: order.shippingAddress ? {
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        zipCode: order.shippingAddress.zipCode,
        country: order.shippingAddress.country,
      } : undefined,
      billingAddress: order.billingAddress ? {
        street: order.billingAddress.street,
        city: order.billingAddress.city,
        zipCode: order.billingAddress.zipCode,
        country: order.billingAddress.country,
      } : undefined,
      total: order.total ? Number(order.total) : undefined,
      currency: order.currency || 'Ar',
    };

    return NextResponse.json(deliveryNoteData);
  } catch (error) {
    console.error('Erreur lors de la génération du bon de livraison:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la génération du bon de livraison' },
      { status: 500 }
    );
  }
}

 
 
 
 
 