import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Désactiver le cache pour cette API
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    console.log('🔍 Début récupération des statistiques...')

    // Statistiques de base avec gestion d'erreurs détaillée
    let totalUsers = 0
    let totalProducts = 0
    let totalServices = 0
    let totalOrders = 0
    let pendingOrders = 0
    let lowStockProducts = 0
    let totalRevenue = 0
    let recentOrders = []

    try {
      console.log('📊 Comptage des utilisateurs...')
      totalUsers = await prisma.user.count()
      console.log(`✅ Utilisateurs: ${totalUsers}`)
    } catch (error) {
      console.error('❌ Erreur utilisateurs:', error.message)
    }

    try {
      console.log('📦 Comptage des produits...')
      totalProducts = await prisma.product.count()
      console.log(`✅ Produits: ${totalProducts}`)
    } catch (error) {
      console.error('❌ Erreur produits:', error.message)
    }

    try {
      console.log('🛠️ Comptage des services...')
      totalServices = await prisma.service.count()
      console.log(`✅ Services: ${totalServices}`)
    } catch (error) {
      console.error('❌ Erreur services:', error.message)
    }

    try {
      console.log('📋 Comptage des commandes...')
      totalOrders = await prisma.order.count()
      console.log(`✅ Commandes: ${totalOrders}`)
    } catch (error) {
      console.error('❌ Erreur commandes:', error.message)
    }

    try {
      console.log('⏳ Comptage des commandes en attente...')
      pendingOrders = await prisma.order.count({
        where: {
          status: {
            in: ['PENDING', 'PAID', 'PROCESSING', 'CONFIRMED'] // CONFIRMED maintenu pour compatibilité
          }
        }
      })
      console.log(`✅ Commandes en attente: ${pendingOrders}`)
    } catch (error) {
      console.error('❌ Erreur commandes en attente:', error.message)
    }

    try {
      console.log('💰 Calcul des revenus...')
      const revenueResult = await prisma.order.aggregate({
        where: {
          paymentStatus: 'PAID'
        },
        _sum: {
          total: true
        }
      })
      totalRevenue = Number(revenueResult._sum.total) || 0
      console.log(`✅ Revenus: ${totalRevenue}`)
    } catch (error) {
      console.error('❌ Erreur revenus:', error.message)
    }

    try {
      console.log('📈 Récupération des dernières commandes...')
      recentOrders = await prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })
      console.log(`✅ Dernières commandes: ${recentOrders.length}`)
    } catch (error) {
      console.error('❌ Erreur dernières commandes:', error.message)
    }

    // Statistiques mensuelles basées sur les vraies données
    let monthlyStats = []
    try {
      console.log('📊 Calcul des statistiques mensuelles...')
      
      // Générer les 6 derniers mois
      const months = []
      for (let i = 0; i < 6; i++) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
        
        months.push({
          name: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
          start: startOfMonth,
          end: endOfMonth
        })
      }

      // Calculer les stats pour chaque mois
      for (const month of months) {
        try {
          const [orderCount, revenueSum] = await Promise.all([
            prisma.order.count({
              where: {
                createdAt: {
                  gte: month.start,
                  lte: month.end
                }
              }
            }),
            prisma.order.aggregate({
              where: {
                createdAt: {
                  gte: month.start,
                  lte: month.end
                },
                paymentStatus: 'PAID'
              },
              _sum: {
                total: true
              }
            })
          ])

          monthlyStats.push({
            month: month.name,
            orders: orderCount,
            revenue: Number(revenueSum._sum.total) || 0
          })
        } catch (error) {
          console.error(`❌ Erreur stats mois ${month.name}:`, error.message)
          monthlyStats.push({
            month: month.name,
            orders: 0,
            revenue: 0
          })
        }
      }

      console.log(`✅ Statistiques mensuelles: ${monthlyStats.length} mois`)
    } catch (error) {
      console.error('❌ Erreur statistiques mensuelles:', error.message)
      // Fallback avec données vides
      monthlyStats = [
        { month: 'Oct 24', orders: 0, revenue: 0 },
        { month: 'Sep 24', orders: 0, revenue: 0 },
        { month: 'Aoû 24', orders: 0, revenue: 0 },
        { month: 'Jul 24', orders: 0, revenue: 0 },
        { month: 'Jun 24', orders: 0, revenue: 0 },
        { month: 'Mai 24', orders: 0, revenue: 0 }
      ]
    }

    // Calculer les pourcentages de croissance
    let userGrowth = '+0%'
    let orderGrowth = '+0%'
    let revenueGrowth = '+0%'

    try {
      console.log('📈 Calcul des pourcentages de croissance...')
      
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      
      const [lastMonthUsers, lastMonthOrders, lastMonthRevenue] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: lastMonth
            }
          }
        }),
        prisma.order.count({
          where: {
            createdAt: {
              gte: lastMonth
            }
          }
        }),
        prisma.order.aggregate({
          where: {
            createdAt: {
              gte: lastMonth
            },
            paymentStatus: 'PAID'
          },
          _sum: {
            total: true
          }
        })
      ])

      // Calculer les pourcentages
      if (totalUsers > lastMonthUsers) {
        const growth = ((lastMonthUsers / (totalUsers - lastMonthUsers)) * 100)
        userGrowth = `+${Math.round(growth)}%`
      }

      if (totalOrders > lastMonthOrders) {
        const growth = ((lastMonthOrders / (totalOrders - lastMonthOrders)) * 100)
        orderGrowth = `+${Math.round(growth)}%`
      }

      const lastMonthRevenueValue = Number(lastMonthRevenue._sum.total) || 0
      if (totalRevenue > lastMonthRevenueValue) {
        const growth = ((lastMonthRevenueValue / (totalRevenue - lastMonthRevenueValue)) * 100)
        revenueGrowth = `+${Math.round(growth)}%`
      }

      console.log(`✅ Croissance calculée: Users ${userGrowth}, Orders ${orderGrowth}, Revenue ${revenueGrowth}`)
    } catch (error) {
      console.error('❌ Erreur calcul croissance:', error.message)
    }

    console.log('🎯 Construction de la réponse finale...')

    const stats = {
      overview: {
        totalUsers: {
          value: totalUsers,
          change: userGrowth,
          trend: userGrowth.includes('+') ? 'up' : 'neutral'
        },
        totalProducts: {
          value: totalProducts,
          change: '+0%',
          trend: 'neutral'
        },
        totalServices: {
          value: totalServices,
          change: '+0%',
          trend: 'neutral'
        },
        totalOrders: {
          value: totalOrders,
          change: orderGrowth,
          trend: orderGrowth.includes('+') ? 'up' : 'neutral'
        },
        totalRevenue: {
          value: totalRevenue,
          change: revenueGrowth,
          trend: revenueGrowth.includes('+') ? 'up' : 'neutral'
        },
        pendingOrders: {
          value: pendingOrders,
          change: pendingOrders > 5 ? 'Attention' : 'Normal',
          trend: pendingOrders > 5 ? 'warning' : 'neutral'
        }
      },
      alerts: {
        lowStockProducts,
        pendingOrders
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber || `ORD-${order.id.slice(-6)}`,
        customer: `${order.user?.firstName || 'Client'} ${order.user?.lastName || 'Inconnu'}`,
        email: order.user?.email || 'email@inconnu.com',
        total: Number(order.total),
        status: order.status,
        paymentStatus: order.paymentStatus || 'PENDING',
        createdAt: order.createdAt
      })),
      monthlyStats: monthlyStats
    }

    console.log('✅ Statistiques générées avec succès!')
    console.log(`📊 Résumé: ${totalUsers} users, ${totalProducts} products, ${totalOrders} orders, ${totalRevenue} revenue`)

    const response = NextResponse.json(stats)
    
    // Headers pour désactiver le cache
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques', details: error.message },
      { status: 500 }
    )
  }
}
