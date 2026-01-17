import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('orderNumber')
    
    if (orderNumber) {
      // Rechercher une commande spécifique et ses retours
      const order = await prisma.order.findFirst({
        where: { orderNumber },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          items: {
            include: {
              product: { select: { name: true } },
              service: { select: { name: true } },
              offer: { select: { name: true } }
            }
          }
        }
      })

      if (!order) {
        return NextResponse.json({ 
          error: `Commande ${orderNumber} non trouvée`,
          found: false 
        })
      }

      // Récupérer les retours séparément
      const returns = await prisma.return.findMany({
        where: { orderId: order.id },
        include: {
          returnItems: {
            include: {
              orderItem: {
                include: {
                  product: { select: { name: true } },
                  service: { select: { name: true } },
                  offer: { select: { name: true } }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({
        message: `Commande ${orderNumber} trouvée`,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: Number(order.total),
          user: order.user,
          itemsCount: order.items.length,
          returnsCount: returns.length,
          returns: returns.map(ret => ({
            id: ret.id,
            returnNumber: ret.returnNumber,
            status: ret.status,
            reason: ret.reason,
            requestedAmount: Number(ret.requestedAmount),
            createdAt: ret.createdAt,
            itemsCount: ret.returnItems.length,
            items: ret.returnItems.map(item => ({
              quantity: item.quantity,
              reason: item.reason,
              refundAmount: Number(item.refundAmount),
              orderItem: {
                id: item.orderItem.id,
                name: item.orderItem.product?.name || 
                      item.orderItem.service?.name || 
                      item.orderItem.offer?.name || 'Article inconnu'
              }
            }))
          }))
        },
        found: true
      })
    }

    return NextResponse.json({
      message: 'Paramètre orderNumber requis'
    })

  } catch (error) {
    console.error('Erreur debug returns:', error)
    return NextResponse.json({ 
      error: 'Erreur lors du debug des retours',
      details: String(error)
    }, { status: 500 })
  }
}








