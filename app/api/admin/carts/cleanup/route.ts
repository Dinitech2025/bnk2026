import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Récupérer les statistiques de nettoyage (sans supprimer)
export async function GET(request: NextRequest) {
  try {
    // Compter les paniers vides ou anciens (plus de 7 jours)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [emptyCartsCount, oldCartsCount] = await Promise.all([
      prisma.cart.count({
        where: {
          items: {
            none: {}
          }
        }
      }),
      prisma.cart.count({
        where: {
          updatedAt: {
            lt: sevenDaysAgo
          }
        }
      })
    ])

    return NextResponse.json({
      success: true,
      statistics: {
        expired: {
          totalCarts: emptyCartsCount + oldCartsCount,
          guestCarts: emptyCartsCount, // Approximation
          userCarts: oldCartsCount,    // Approximation
          totalItems: 0 // Non calculé dans cette version simple
        },
        active: {
          totalCarts: 0, // Non calculé dans cette version simple
          guestCarts: 0,
          userCarts: 0
        },
        expirySettings: {
          guestCartExpiryDays: 7,
          lastCheck: new Date().toISOString()
        }
      },
      message: `${emptyCartsCount + oldCartsCount} paniers peuvent être supprimés`
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Supprimer les paniers vides ou anciens (plus de 7 jours)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const deletedCarts = await prisma.cart.deleteMany({
      where: {
        OR: [
          {
            items: {
              none: {}
            }
          },
          {
            updatedAt: {
              lt: sevenDaysAgo
            }
          }
        ]
      }
    })

    return NextResponse.json({ 
      success: true, 
      deletedCount: deletedCarts.count,
      message: `${deletedCarts.count} paniers supprimés`
    })
  } catch (error) {
    console.error('Erreur lors du nettoyage des paniers:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du nettoyage des paniers' },
      { status: 500 }
    )
  }
}