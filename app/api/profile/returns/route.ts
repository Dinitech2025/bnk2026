import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const returns = await prisma.return.findMany({
      where: { userId: session.user.id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            createdAt: true
          }
        },
        returnItems: {
          include: {
            orderItem: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                service: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                offer: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Convertir les Decimal en nombres
    const returnsWithNumbers = returns.map(returnItem => ({
      ...returnItem,
      requestedAmount: Number(returnItem.requestedAmount),
      approvedAmount: returnItem.approvedAmount ? Number(returnItem.approvedAmount) : null,
      refundedAmount: returnItem.refundedAmount ? Number(returnItem.refundedAmount) : null,
      returnItems: returnItem.returnItems.map(item => ({
        ...item,
        refundAmount: Number(item.refundAmount),
        orderItem: {
          ...item.orderItem,
          unitPrice: Number(item.orderItem.unitPrice),
          totalPrice: Number(item.orderItem.totalPrice)
        }
      }))
    }))

    return NextResponse.json({ returns: returnsWithNumbers })
  } catch (error) {
    console.error('Erreur lors de la récupération des retours:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des retours' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, items, reason, description, customerNotes } = body

    // Validation des données
    if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Données de retour invalides' },
        { status: 400 }
      )
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'La raison du retour est obligatoire' },
        { status: 400 }
      )
    }

    // Vérifier que la commande appartient à l'utilisateur
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id
      },
      include: {
        items: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier que la commande est éligible aux retours
    const orderAge = Date.now() - order.createdAt.getTime()
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
    
    if (orderAge > thirtyDaysInMs) {
      return NextResponse.json(
        { error: 'Cette commande est trop ancienne pour faire un retour (plus de 30 jours)' },
        { status: 400 }
      )
    }

    // Calculer le montant total du retour
    let totalRefundAmount = 0
    const returnItemsData = []

    for (const item of items) {
      const orderItem = order.items.find(oi => oi.id === item.orderItemId)
      if (!orderItem) {
        return NextResponse.json(
          { error: `Article de commande ${item.orderItemId} non trouvé` },
          { status: 400 }
        )
      }

      if (item.quantity > orderItem.quantity) {
        return NextResponse.json(
          { error: `Quantité de retour invalide pour l'article ${orderItem.id}` },
          { status: 400 }
        )
      }

      // Vérifier s'il n'y a pas déjà eu de retours pour cet article
      const existingReturns = await prisma.returnItem.aggregate({
        where: {
          orderItemId: item.orderItemId,
          return: {
            status: {
              not: 'REJECTED'
            }
          }
        },
        _sum: {
          quantity: true
        }
      })

      const alreadyReturned = existingReturns._sum.quantity || 0
      if (alreadyReturned + item.quantity > orderItem.quantity) {
        return NextResponse.json(
          { error: `Quantité de retour excessive pour l'article ${orderItem.id}` },
          { status: 400 }
        )
      }

      const itemRefundAmount = (Number(orderItem.unitPrice) * item.quantity)
      totalRefundAmount += itemRefundAmount

      returnItemsData.push({
        orderItemId: item.orderItemId,
        quantity: item.quantity,
        reason: item.reason || reason,
        condition: item.condition || 'UNKNOWN',
        refundAmount: itemRefundAmount
      })
    }

    // Générer un numéro de retour unique
    const returnCount = await prisma.return.count()
    const returnNumber = `RET-${Date.now()}-${(returnCount + 1).toString().padStart(3, '0')}`

    // Créer le retour
    const newReturn = await prisma.return.create({
      data: {
        returnNumber,
        orderId,
        userId: session.user.id,
        reason,
        description,
        customerNotes,
        requestedAmount: totalRefundAmount,
        status: 'REQUESTED',
        returnItems: {
          create: returnItemsData
        }
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            createdAt: true
          }
        },
        returnItems: {
          include: {
            orderItem: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                service: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                offer: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Convertir les Decimal en nombres pour la réponse
    const returnWithNumbers = {
      ...newReturn,
      requestedAmount: Number(newReturn.requestedAmount),
      returnItems: newReturn.returnItems.map(item => ({
        ...item,
        refundAmount: Number(item.refundAmount),
        orderItem: {
          ...item.orderItem,
          unitPrice: Number(item.orderItem.unitPrice),
          totalPrice: Number(item.orderItem.totalPrice)
        }
      }))
    }

    return NextResponse.json({
      message: 'Demande de retour créée avec succès',
      return: returnWithNumbers
    })

  } catch (error) {
    console.error('Erreur lors de la création du retour:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la demande de retour' },
      { status: 500 }
    )
  }
}








