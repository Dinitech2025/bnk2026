'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Plus, ArrowLeft } from 'lucide-react'
import { PaymentModal } from '@/components/admin/orders/payment-modal'
import OrderStatusBadge from '@/components/admin/orders/order-status-badge'
import { toast } from 'sonner'

interface Payment {
  id: string
  amount: number
  currency: string
  method: string
  provider: string | null
  transactionId: string | null
  reference: string | null
  status: string
  notes: string | null
  createdAt: string
  processedByUser?: {
    id: string
    firstName: string | null
    lastName: string | null
  } | null
}

interface OrderEditClientProps {
  order: {
    id: string
    orderNumber?: string
    status: string
    paymentStatus: string
    currency: string
    total: number
    payments: Payment[]
    user: {
      firstName: string | null
      lastName: string | null
      email: string
    }
  }
}

// Fonction pour formater le mode de paiement
function formatPaymentMethod(method: string): string {
  const methods: { [key: string]: string } = {
    'mobile_money': 'Mobile Money',
    'bank_transfer': 'Virement bancaire',
    'cash': 'Espèce',
    'paypal': 'PayPal'
  };
  return methods[method] || method;
}

// Fonction pour obtenir tous les modes de paiement utilisés
function getAllPaymentMethods(payments: Payment[]): string {
  if (!payments || payments.length === 0) return 'Non spécifié';
  
  const uniqueMethods = [...new Set(payments.map(payment => payment.method))];
  const methodLabels = uniqueMethods.map(method => formatPaymentMethod(method));
  
  if (methodLabels.length === 1) {
    return methodLabels[0];
  }
  
  return methodLabels.join(' + ');
}

// Fonction pour calculer le statut de paiement
function getPaymentStatus(order: OrderEditClientProps['order']): { status: string; totalPaid: number; remaining: number } {
  const totalPaid = order.payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalOrder = order.total;
  const remaining = Math.max(0, totalOrder - totalPaid);
  
  let status = '';
  if (totalPaid === 0) {
    status = `💳 ${totalOrder.toLocaleString('fr-FR')} ${order.currency} à payer`;
  } else if (remaining > 0) {
    status = `⚠️ ${totalPaid.toLocaleString('fr-FR')} ${order.currency} payé, ${remaining.toLocaleString('fr-FR')} ${order.currency} restant`;
  } else {
    status = `✅ Entièrement payé`;
  }
  
  return { status, totalPaid, remaining };
}

export function OrderEditClient({ order }: OrderEditClientProps) {
  const router = useRouter()
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean
    orderId: string
    orderTotal: number
    currency: string
    orderNumber?: string
  }>({
    isOpen: false,
    orderId: '',
    orderTotal: 0,
    currency: 'Ar'
  })

  const paymentStatus = getPaymentStatus(order)

  const openPaymentModal = () => {
    setPaymentModal({
      isOpen: true,
      orderId: order.id,
      orderTotal: paymentStatus.remaining,
      currency: order.currency,
      orderNumber: order.orderNumber
    })
  }

  const closePaymentModal = () => {
    setPaymentModal({
      isOpen: false,
      orderId: '',
      orderTotal: 0,
      currency: 'Ar'
    })
  }

  const handlePaymentSuccess = () => {
    router.refresh()
    toast.success('Paiement enregistré avec succès')
  }

  return (
    <div className="space-y-6">
      {/* Section de gestion des paiements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Gestion des paiements
            </CardTitle>
            {paymentStatus.remaining > 0 && (
              <Button onClick={openPaymentModal} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un paiement
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Informations de paiement */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Modes de paiement</p>
                <p className="font-medium">{getAllPaymentMethods(order.payments)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Statut de paiement</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    order.paymentStatus === 'PAID' ? 'bg-green-500' : 
                    order.paymentStatus === 'PARTIALLY_PAID' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}></div>
                  <Badge variant={
                    order.paymentStatus === 'PAID' ? 'default' : 
                    order.paymentStatus === 'PARTIALLY_PAID' ? 'secondary' : 'outline'
                  }>
                    {order.paymentStatus === 'PAID' ? 'Payé' : 
                     order.paymentStatus === 'PARTIALLY_PAID' ? 'Partiellement payé' : 'Non payé'}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Montant</p>
                <p className="text-sm">{paymentStatus.status}</p>
              </div>
            </div>

            {/* Résumé financier */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total payé:</span>
                  <span className="font-medium">{paymentStatus.totalPaid.toLocaleString('fr-FR')} {order.currency}</span>
                </div>
                {paymentStatus.remaining > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Restant:</span>
                    <span className="font-medium text-orange-600">{paymentStatus.remaining.toLocaleString('fr-FR')} {order.currency}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total commande:</span>
                  <span className="font-semibold">{order.total.toLocaleString('fr-FR')} {order.currency}</span>
                </div>
              </div>
            </div>

            {/* Liste des paiements */}
            {order.payments.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Historique des paiements ({order.payments.length})</h4>
                <div className="space-y-2">
                  {order.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          payment.status === 'COMPLETED' ? 'bg-green-500' : 
                          payment.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="font-medium">
                            {payment.amount.toLocaleString('fr-FR')} {payment.currency}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatPaymentMethod(payment.method)}
                            {payment.provider && ` • ${payment.provider}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                        {payment.processedByUser && (
                          <p className="text-xs text-muted-foreground">
                            {payment.processedByUser.firstName} {payment.processedByUser.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de paiement */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={closePaymentModal}
        orderId={paymentModal.orderId}
        orderTotal={paymentModal.orderTotal}
        currency={paymentModal.currency}
        orderNumber={paymentModal.orderNumber}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  )
}
