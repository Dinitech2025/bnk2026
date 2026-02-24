import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { convertDevToCmdOrderNumber, defaultExchangeRates } from '@/lib/utils'

// Désactiver le cache pour cette API
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PaymentData {
  amount: number
  methodId?: string
  providerId?: string
  method: string // Conservé pour compatibilité
  provider?: string // Conservé pour compatibilité
  transactionId?: string
  reference?: string
  notes?: string
  displayCurrency?: string // Devise d'affichage au moment du paiement
}

/**
 * Créer un nouveau paiement pour une commande
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const orderId = params.id
    const paymentData: PaymentData = await request.json()

    // Vérifier que la commande existe
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    // Calculer le montant total déjà payé
    const totalPaid = order.payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    // Vérifier que le nouveau paiement ne dépasse pas le total de la commande
    const newTotal = totalPaid + paymentData.amount
    if (newTotal > Number(order.total)) {
      return NextResponse.json(
        { error: `Le montant total des paiements (${newTotal} ${order.currency}) ne peut pas dépasser le total de la commande (${order.total} ${order.currency})` },
        { status: 400 }
      )
    }

    // Récupérer les informations de la méthode et du fournisseur si spécifiés
    let paymentMethod = null
    let paymentProvider = null
    let calculatedFees = { methodFee: 0, providerFee: 0, totalFee: 0 }

    if (paymentData.methodId) {
      paymentMethod = await prisma.paymentMethod.findUnique({
        where: { id: paymentData.methodId },
        include: {
          providers: true
        }
      })

      if (paymentData.providerId) {
        paymentProvider = await prisma.paymentProvider.findUnique({
          where: { id: paymentData.providerId }
        })
      }

      // Calculer les frais
      const calculateFee = (feeType: string | null, feeValue: any, amount: number) => {
        if (!feeType || !feeValue || feeType === 'NONE') return 0
        
        const numValue = Number(feeValue)
        if (feeType === 'PERCENTAGE') {
          return (amount * numValue) / 100
        } else if (feeType === 'FIXED') {
          return numValue
        }
        
        return 0
      }

      if (paymentMethod) {
        calculatedFees.methodFee = calculateFee(paymentMethod.feeType, paymentMethod.feeValue, paymentData.amount)
      }

      if (paymentProvider) {
        calculatedFees.providerFee = calculateFee(paymentProvider.feeType, paymentProvider.feeValue, paymentData.amount)
      }

      calculatedFees.totalFee = calculatedFees.methodFee + calculatedFees.providerFee
    }

    // Créer le paiement dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Déterminer le taux de change et le montant original
      const paymentCurrency = order.currency || 'MGA'
      const displayCurrency = paymentData.displayCurrency || paymentCurrency
      
      // Capturer les taux de change actuels pour la devise d'affichage
      let exchangeRate = 1
      let originalAmount = paymentData.amount
      
      if (displayCurrency !== paymentCurrency) {
        // Si on affiche dans une devise différente, capturer le taux actuel
        exchangeRate = defaultExchangeRates[displayCurrency] || 1
        // Le montant original est dans la devise d'affichage
        originalAmount = paymentData.amount
      } else {
        // Même devise, pas de conversion
        exchangeRate = 1
        originalAmount = paymentData.amount
      }

      // Créer le paiement
      const payment = await tx.payment.create({
        data: {
          orderId: orderId,
          amount: paymentData.amount,
          currency: order.currency,
          originalAmount: originalAmount,
          paymentExchangeRate: exchangeRate,
          paymentDisplayCurrency: displayCurrency,
          paymentBaseCurrency: paymentCurrency,
          methodId: paymentData.methodId || null,
          providerId: paymentData.providerId || null,
          method: paymentData.method, // Conservé pour compatibilité
          provider: paymentData.provider, // Conservé pour compatibilité
          transactionId: paymentData.transactionId,
          reference: paymentData.reference,
          status: 'COMPLETED',
          notes: paymentData.notes,
          processedBy: session.user?.id,
          feeAmount: calculatedFees.totalFee > 0 ? calculatedFees.totalFee : null,
          feeType: calculatedFees.totalFee > 0 ? 'CALCULATED' : null,
          netAmount: paymentData.amount - calculatedFees.totalFee
        },
        include: {
          paymentMethod: true,
          paymentProvider: true
        }
      })

      // Calculer le nouveau total payé
      const updatedTotalPaid = totalPaid + paymentData.amount
      const isFullyPaid = updatedTotalPaid >= Number(order.total)

      // Changer le numéro de commande de DEV à CMD s'il y a au moins un paiement
      const isFirstPayment = order.payments.length === 0
      const newOrderNumber = isFirstPayment ? convertDevToCmdOrderNumber(order.orderNumber) : order.orderNumber

      // Mettre à jour le statut de paiement de la commande
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          orderNumber: newOrderNumber,
          paymentStatus: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
          // Changer automatiquement le statut selon le paiement
          status: (() => {
            // Si entièrement payé, passer à PAID (depuis QUOTE, PENDING, ou PARTIALLY_PAID)
            if ((order.status === 'QUOTE' || order.status === 'PENDING' || order.status === 'PARTIALLY_PAID') && isFullyPaid) {
              return 'PAID'
            } 
            // Si paiement partiel, passer à PARTIALLY_PAID (depuis QUOTE, PENDING, ou rester PARTIALLY_PAID)
            else if ((order.status === 'QUOTE' || order.status === 'PENDING' || order.status === 'PARTIALLY_PAID') && updatedTotalPaid > 0 && !isFullyPaid) {
              return 'PARTIALLY_PAID'
            }
            return order.status
          })()
        },
        include: {
          payments: true,
          subscriptions: true
        }
      })

      // Ajouter une entrée d'historique si le statut a changé automatiquement
      const newStatus = (() => {
        // Si entièrement payé, passer à PAID (depuis QUOTE, PENDING, ou PARTIALLY_PAID)
        if ((order.status === 'QUOTE' || order.status === 'PENDING' || order.status === 'PARTIALLY_PAID') && isFullyPaid) {
          return 'PAID'
        } 
        // Si paiement partiel, passer à PARTIALLY_PAID (depuis QUOTE, PENDING, ou rester PARTIALLY_PAID)
        else if ((order.status === 'QUOTE' || order.status === 'PENDING' || order.status === 'PARTIALLY_PAID') && updatedTotalPaid > 0 && !isFullyPaid) {
          return 'PARTIALLY_PAID'
        }
        return order.status
      })()

      if (newStatus !== order.status) {
        const descriptions = {
          'PAID': `Statut changé automatiquement vers "Payée" après paiement complet (${paymentData.amount} ${order.currency})`,
          'PARTIALLY_PAID': `Statut changé automatiquement vers "Payée partiellement" après paiement partiel (${paymentData.amount} ${order.currency})`
        }
        
        await tx.orderHistory.create({
          data: {
            orderId: orderId,
            status: newStatus,
            previousStatus: order.status,
            action: newStatus === 'PAID' ? 'PAYMENT_COMPLETED' : 'PAYMENT_PARTIAL',
            description: descriptions[newStatus] || `Statut changé vers ${newStatus}`,
            userId: session.user?.id || null
          }
        })
      }

      // Si la commande est entièrement payée, gérer les abonnements
      if (isFullyPaid) {
        // 1. Activer les abonnements existants
        if (updatedOrder.subscriptions.length > 0) {
          for (const subscription of updatedOrder.subscriptions) {
            if (subscription.status === 'PENDING') {
              await tx.subscription.update({
                where: { id: subscription.id },
                data: { status: 'ACTIVE' }
              })
            }
          }
        }
        
        // 2. Créer automatiquement des abonnements pour les offres d'abonnement
        // Récupérer les items de la commande avec les détails des offres
        const orderWithItems = await tx.order.findUnique({
          where: { id: orderId },
          include: {
            items: {
              include: {
                offer: {
                  include: {
                    platformOffers: {
                      include: {
                        platform: true
                      }
                    }
                  }
                }
              }
            }
          }
        });

        if (orderWithItems) {
          // Identifier les items qui sont des offres d'abonnement
          const subscriptionOffers = orderWithItems.items.filter(item => 
            (item.itemType === 'OFFER' || item.itemType === 'SUBSCRIPTION') && 
            item.offer && 
            item.offer.platformOffers.length > 0
          );

          console.log(`🔍 Offres d'abonnement trouvées: ${subscriptionOffers.length}`);

          // Créer un abonnement pour chaque offre d'abonnement
          for (const item of subscriptionOffers) {
            if (!item.offer) continue;

            // Vérifier si un abonnement existe déjà pour cette offre et cet utilisateur
            const existingSubscription = await tx.subscription.findFirst({
              where: {
                userId: orderWithItems.userId,
                offerId: item.offer.id,
                orderId: orderId
              }
            });

            if (!existingSubscription) {
              // Calculer les dates de début et fin
              const startDate = new Date();
              const endDate = new Date();
              endDate.setMonth(endDate.getMonth() + item.offer.duration);

              // Créer l'abonnement
              const newSubscription = await tx.subscription.create({
                data: {
                  userId: orderWithItems.userId,
                  offerId: item.offer.id,
                  orderId: orderId,
                  status: 'ACTIVE',
                  startDate: startDate,
                  endDate: endDate,
                  autoRenew: false
                }
              });

              console.log(`✅ Abonnement créé automatiquement: ${newSubscription.id} pour l'offre ${item.offer.name}`);
            } else {
              console.log(`ℹ️ Abonnement déjà existant pour l'offre ${item.offer.name}`);
            }
          }
        }
      }

      return { payment, order: updatedOrder }
    })

    console.log(`✅ Paiement enregistré - Commande: ${order.orderNumber}, Montant: ${paymentData.amount} ${order.currency}, Méthode: ${paymentData.method}`)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement du paiement' },
      { status: 500 }
    )
  }
}

/**
 * Récupérer tous les paiements d'une commande
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const orderId = params.id

    const payments = await prisma.payment.findMany({
      where: { orderId },
      include: {
        processedByUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const response = NextResponse.json(payments)
    
    // Headers pour désactiver le cache
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paiements' },
      { status: 500 }
    )
  }
}
