import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Désactiver le cache pour cette API
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            offer: {
              select: {
                id: true,
                name: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        shippingAddress: true,
        subscriptions: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            platformOfferId: true,
            offer: {
              select: {
                name: true,
              },
            },
            platformOffer: {
              select: {
                id: true,
                platform: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                  },
                },
              },
            },
            subscriptionAccounts: {
              include: {
                account: {
                  include: {
                    platform: {
                      select: {
                        id: true,
                        name: true,
                        logo: true,
                      }
                    }
                  }
                },
              },
            },
            accountProfiles: {
              select: {
                id: true,
                name: true,
                profileSlot: true,
                pin: true,
                isAssigned: true,
                accountId: true,
                account: {
                  select: {
                    username: true,
                    email: true,
                    id: true,
                  }
                }
              }
            },
          },
        },
        returns: {
          include: {
            returnItems: {
              include: {
                orderItem: {
                  include: {
                    product: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                    service: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                    offer: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    // Formater les dates pour la serialisation JSON
    const formattedOrder = {
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      subscriptions: order.subscriptions.map((sub: any) => ({
        ...sub,
        startDate: sub.startDate.toISOString(),
        endDate: sub.endDate.toISOString(),
      })),
      returns: order.returns.map((returnItem: any) => ({
        ...returnItem,
        createdAt: returnItem.createdAt.toISOString(),
        processedAt: returnItem.processedAt ? returnItem.processedAt.toISOString() : null,
        refundedAt: returnItem.refundedAt ? returnItem.refundedAt.toISOString() : null,
        requestedAmount: Number(returnItem.requestedAmount),
        approvedAmount: returnItem.approvedAmount ? Number(returnItem.approvedAmount) : null,
        refundedAmount: returnItem.refundedAmount ? Number(returnItem.refundedAmount) : null,
        returnItems: (returnItem.returnItems || []).map((item: any) => ({
          ...item,
          refundAmount: Number(item.refundAmount),
          createdAt: item.createdAt.toISOString(),
          orderItem: item.orderItem ? {
            ...item.orderItem,
            unitPrice: Number(item.orderItem.unitPrice),
            totalPrice: Number(item.orderItem.totalPrice),
            discountAmount: item.orderItem.discountAmount ? Number(item.orderItem.discountAmount) : null,
          } : null
        }))
      })),
    }

    const response = NextResponse.json(formattedOrder)
    
    // Headers pour désactiver le cache
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la récupération de la commande.' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  
  try {
    const data = await request.json()
    
    // Vérifier si la commande existe
    const orderExists = await prisma.order.findUnique({
      where: { id },
    })
    
    if (!orderExists) {
      return NextResponse.json(
        { message: 'Commande non trouvée' },
        { status: 404 }
      )
    }
    
    // Valider les données
    if (!data.status && !data.userId) {
      return NextResponse.json(
        { message: 'Aucune donnée valide pour la mise à jour.' },
        { status: 400 }
      )
    }
    
    // Préparer les données à mettre à jour
    const updateData: any = {}
    
    if (data.status) updateData.status = data.status
    if (data.userId) updateData.userId = data.userId
    if (data.addressId) updateData.addressId = data.addressId
    
    // Mise à jour de la commande
    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        items: {
          include: {
            offer: true,
            product: true,
            service: true,
          },
        },
        subscriptions: true,
      },
    })
    
    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la mise à jour de la commande.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  
  try {
    const data = await request.json()
    
    // Vérifier si la commande existe
    const orderExists = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })
    
    if (!orderExists) {
      return NextResponse.json(
        { message: 'Commande non trouvée' },
        { status: 404 }
      )
    }
    
    // Valider les données
    if (!data.userId || !data.items || !Array.isArray(data.items)) {
      return NextResponse.json(
        { message: 'Données invalides pour la mise à jour de la commande.' },
        { status: 400 }
      )
    }
    
    // Supprimer les anciens articles
    await prisma.orderItem.deleteMany({
      where: { orderId: id },
    })
    
    // Calculer le nouveau total
    let total = 0
    const orderItems = data.items.map((item: any) => {
      const totalPrice = Number(item.unitPrice) * item.quantity
      total += totalPrice
      return {
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        itemType: item.itemType,
        ...(item.productId ? { productId: item.productId } : {}),
        ...(item.serviceId ? { serviceId: item.serviceId } : {}),
        ...(item.offerId ? { offerId: item.offerId } : {}),
      }
    })
    
    // Mettre à jour la commande avec les nouveaux articles
    const order = await prisma.order.update({
      where: { id },
      data: {
        userId: data.userId,
        status: data.status,
        total,
        addressId: data.addressId,
        items: {
          create: orderItems,
        },
      },
      include: {
        user: true,
        items: {
          include: {
            offer: true,
            product: true,
            service: true,
          },
        },
        subscriptions: true,
      },
    })
    
    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la mise à jour de la commande.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  
  try {
    // Vérifier si la commande existe
    const orderExists = await prisma.order.findUnique({
      where: { id },
      include: { items: true, subscriptions: true },
    })
    
    if (!orderExists) {
      return NextResponse.json(
        { message: 'Commande non trouvée' },
        { status: 404 }
      )
    }
    
    // Dissocier les abonnements de la commande
    if (orderExists.subscriptions.length > 0) {
      await prisma.subscription.updateMany({
        where: { orderId: id },
        data: { orderId: null },
      })
    }
    
    // Supprimer les articles de la commande
    await prisma.orderItem.deleteMany({
      where: { orderId: id },
    })
    
    // Supprimer la commande
    await prisma.order.delete({
      where: { id },
    })
    
    return NextResponse.json(
      { message: 'Commande supprimée avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la suppression de la commande.' },
      { status: 500 }
    )
  }
}