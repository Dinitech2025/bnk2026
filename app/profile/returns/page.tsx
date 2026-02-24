import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, RefreshCw, Truck, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ReturnWithDetails {
  id: string
  returnNumber: string
  status: string
  reason: string
  description: string | null
  requestedAmount: number
  approvedAmount: number | null
  refundedAmount: number | null
  refundMethod: string | null
  customerNotes: string | null
  trackingNumber: string | null
  createdAt: Date
  processedAt: Date | null
  refundedAt: Date | null
  order: {
    id: string
    orderNumber: string | null
    createdAt: Date
  }
  returnItems: Array<{
    id: string
    quantity: number
    reason: string | null
    condition: string | null
    refundAmount: number
    orderItem: {
      id: string
      quantity: number
      unitPrice: number
      totalPrice: number
      metadata: any
      product?: {
        id: string
        name: string
      }
      service?: {
        id: string
        name: string
      }
      offer?: {
        id: string
        name: string
      }
    }
  }>
}

async function getUserReturns(userId: string): Promise<ReturnWithDetails[]> {
  const returns = await prisma.return.findMany({
    where: { userId },
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

  return returns.map(returnItem => ({
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
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'REQUESTED':
      return <Clock className="h-4 w-4" />
    case 'APPROVED':
      return <CheckCircle className="h-4 w-4" />
    case 'REJECTED':
      return <XCircle className="h-4 w-4" />
    case 'IN_TRANSIT':
      return <Truck className="h-4 w-4" />
    case 'RECEIVED':
      return <Package className="h-4 w-4" />
    case 'PROCESSED':
      return <RefreshCw className="h-4 w-4" />
    case 'REFUNDED':
      return <CheckCircle className="h-4 w-4" />
    default:
      return <AlertTriangle className="h-4 w-4" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'REQUESTED':
      return 'bg-yellow-100 text-yellow-800'
    case 'APPROVED':
      return 'bg-blue-100 text-blue-800'
    case 'REJECTED':
      return 'bg-red-100 text-red-800'
    case 'IN_TRANSIT':
      return 'bg-purple-100 text-purple-800'
    case 'RECEIVED':
      return 'bg-indigo-100 text-indigo-800'
    case 'PROCESSED':
      return 'bg-orange-100 text-orange-800'
    case 'REFUNDED':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'REQUESTED':
      return 'Demandé'
    case 'APPROVED':
      return 'Approuvé'
    case 'REJECTED':
      return 'Rejeté'
    case 'IN_TRANSIT':
      return 'En transit'
    case 'RECEIVED':
      return 'Reçu'
    case 'PROCESSED':
      return 'Traité'
    case 'REFUNDED':
      return 'Remboursé'
    default:
      return status
  }
}

function getReasonLabel(reason: string) {
  switch (reason) {
    case 'DEFECTIVE':
      return 'Défectueux'
    case 'WRONG_ITEM':
      return 'Article incorrect'
    case 'NOT_AS_DESCRIBED':
      return 'Non conforme à la description'
    case 'CHANGED_MIND':
      return 'Changement d\'avis'
    case 'DAMAGED_DELIVERY':
      return 'Endommagé lors de la livraison'
    case 'SIZE_ISSUE':
      return 'Problème de taille'
    case 'QUALITY_ISSUE':
      return 'Problème de qualité'
    default:
      return reason
  }
}

function getItemName(orderItem: any) {
  if (orderItem.product?.name) return orderItem.product.name
  if (orderItem.service?.name) return orderItem.service.name
  if (orderItem.offer?.name) return orderItem.offer.name
  
  // Fallback vers metadata
  try {
    const metadata = typeof orderItem.metadata === 'string' 
      ? JSON.parse(orderItem.metadata) 
      : orderItem.metadata
    return metadata?.name || 'Article inconnu'
  } catch {
    return 'Article inconnu'
  }
}

export default async function ReturnsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const returns = await getUserReturns(session.user.id)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/profile">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au profil
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes retours</h1>
        <p className="text-gray-600">
          Suivez l'état de vos demandes de retour et remboursement
        </p>
      </div>

      {/* Liste des retours */}
      {returns.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun retour</h3>
              <p className="text-gray-600 mb-6">
                Vous n'avez encore effectué aucune demande de retour.
              </p>
              <Link href="/profile/orders">
                <Button>
                  Voir mes commandes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {returns.map((returnItem) => (
            <Card key={returnItem.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Retour #{returnItem.returnNumber}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Commande #{returnItem.order.orderNumber} • {format(returnItem.createdAt, 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <Badge className={`flex items-center gap-2 ${getStatusColor(returnItem.status)}`}>
                    {getStatusIcon(returnItem.status)}
                    {getStatusLabel(returnItem.status)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Informations générales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Raison</p>
                    <p className="text-sm">{getReasonLabel(returnItem.reason)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Montant demandé</p>
                    <p className="text-sm font-semibold">{returnItem.requestedAmount.toLocaleString()} Ar</p>
                  </div>
                  {returnItem.approvedAmount && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Montant approuvé</p>
                      <p className="text-sm font-semibold text-blue-600">{returnItem.approvedAmount.toLocaleString()} Ar</p>
                    </div>
                  )}
                  {returnItem.refundedAmount && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Montant remboursé</p>
                      <p className="text-sm font-semibold text-green-600">{returnItem.refundedAmount.toLocaleString()} Ar</p>
                    </div>
                  )}
                  {returnItem.trackingNumber && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Numéro de suivi</p>
                      <p className="text-sm font-mono">{returnItem.trackingNumber}</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                {returnItem.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Description</p>
                    <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg">
                      {returnItem.description}
                    </p>
                  </div>
                )}

                {/* Articles retournés */}
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-3">Articles retournés</p>
                  <div className="space-y-3">
                    {returnItem.returnItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{getItemName(item.orderItem)}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span>Quantité: {item.quantity}/{item.orderItem.quantity}</span>
                            {item.condition && (
                              <span>État: {item.condition}</span>
                            )}
                            {item.reason && (
                              <span>Raison: {getReasonLabel(item.reason)}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.refundAmount.toLocaleString()} Ar</p>
                          <p className="text-sm text-gray-600">Prix unitaire</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes du client */}
                {returnItem.customerNotes && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Vos notes</p>
                    <p className="text-sm text-gray-700 p-3 bg-blue-50 rounded-lg">
                      {returnItem.customerNotes}
                    </p>
                  </div>
                )}

                {/* Dates importantes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-600">Demandé le</p>
                    <p>{format(returnItem.createdAt, 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                  </div>
                  {returnItem.processedAt && (
                    <div>
                      <p className="font-medium text-gray-600">Traité le</p>
                      <p>{format(returnItem.processedAt, 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                    </div>
                  )}
                  {returnItem.refundedAt && (
                    <div>
                      <p className="font-medium text-gray-600">Remboursé le</p>
                      <p>{format(returnItem.refundedAt, 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
