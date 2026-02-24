'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  Clock, 
  Package, 
  Truck, 
  XCircle, 
  Loader2,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface ProgressStatusBarProps {
  orderId: string
  currentStatus: string
  orderNumber?: string
  onStatusChange?: (newStatus: string) => void
  onOpenPaymentModal?: () => void
}

// Définition des étapes avec leurs couleurs
const STATUS_STEPS = [
  {
    key: 'PENDING',
    label: 'En attente',
    shortLabel: 'En attente',
    color: 'bg-yellow-500',
    completedColor: 'bg-green-500',
    icon: Clock
  },
  {
    key: 'PARTIALLY_PAID',
    label: 'Payée partiellement',
    shortLabel: 'Partielle',
    color: 'bg-orange-500',
    completedColor: 'bg-green-500',
    icon: CheckCircle
  },
  {
    key: 'PAID',
    label: 'Payée',
    shortLabel: 'Payée',
    color: 'bg-green-500',
    completedColor: 'bg-green-500',
    icon: CheckCircle
  },
  {
    key: 'PROCESSING',
    label: 'En cours',
    shortLabel: 'En cours',
    color: 'bg-blue-500',
    completedColor: 'bg-green-500',
    icon: Package
  },
  {
    key: 'SHIPPED',
    label: 'Expédiée',
    shortLabel: 'Expédiée',
    color: 'bg-blue-500',
    completedColor: 'bg-green-500',
    icon: Truck
  },
  {
    key: 'DELIVERED',
    label: 'Livrée',
    shortLabel: 'Livrée',
    color: 'bg-green-500',
    completedColor: 'bg-green-500',
    icon: CheckCircle
  }
] as const

export function ProgressStatusBar({ 
  orderId, 
  currentStatus, 
  orderNumber,
  onStatusChange,
  onOpenPaymentModal 
}: ProgressStatusBarProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Trouver l'index du statut actuel
  const currentIndex = STATUS_STEPS.findIndex(step => step.key === currentStatus)
  
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du statut')
      }

      onStatusChange?.(newStatus)
      
      const statusInfo = STATUS_STEPS.find(s => s.key === newStatus)
      toast.success(`Statut mis à jour vers "${statusInfo?.label}"`, {
        description: orderNumber ? `Commande ${orderNumber}` : `Commande ${orderId.substring(0, 8)}`
      })
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour du statut')
    } finally {
      setIsLoading(false)
    }
  }

  // Déterminer la prochaine étape
  const getNextStep = () => {
    if (currentStatus === 'CANCELLED' || currentIndex < 0) return null
    if (currentIndex >= STATUS_STEPS.length - 1) return null
    return STATUS_STEPS[currentIndex + 1]
  }

  const nextStep = getNextStep()

  // Fonction pour valider les transitions (même logique que l'API)
  const isValidTransition = (currentStatus: string, newStatus: string): boolean => {
    const statusFlow = ['PENDING', 'PARTIALLY_PAID', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']
    
    // L'annulation est toujours possible (sauf depuis DELIVERED et REFUNDED)
    if (newStatus === 'CANCELLED' && !['DELIVERED', 'REFUNDED'].includes(currentStatus)) {
      return true
    }
    
    // Le remboursement est possible depuis PAID, PROCESSING, SHIPPED, DELIVERED
    if (newStatus === 'REFUNDED' && ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(currentStatus)) {
      return true
    }
    
    // Réactivation depuis CANCELLED vers PENDING
    if (currentStatus === 'CANCELLED' && newStatus === 'PENDING') {
      return true
    }
    
    // Pas de transition depuis REFUNDED (statut final)
    if (currentStatus === 'REFUNDED') {
      return false
    }
    
    // Compatibilité CONFIRMED → PAID
    if (currentStatus === 'CONFIRMED' && newStatus === 'PAID') {
      return true
    }
    
    // Transitions dans le flux normal
    const currentIndex = statusFlow.indexOf(currentStatus)
    const newIndex = statusFlow.indexOf(newStatus)
    
    if (currentIndex === -1 || newIndex === -1) {
      return false // Statut non reconnu
    }
    
    // Permettre d'avancer d'une étape ou de revenir en arrière
    return Math.abs(newIndex - currentIndex) <= 1
  }

  // Fonction pour gérer le clic sur une étape
  const handleStepClick = (stepKey: string, stepIndex: number) => {
    // Si c'est PARTIALLY_PAID ou PAID, ouvrir le modal de paiement
    if ((stepKey === 'PARTIALLY_PAID' || stepKey === 'PAID') && onOpenPaymentModal) {
      onOpenPaymentModal()
      return
    }
    
    // Vérifier si la transition est valide
    if (isValidTransition(currentStatus, stepKey)) {
      handleStatusChange(stepKey)
    } else {
      toast.error(`Transition non autorisée`, {
        description: `Impossible de passer de "${currentStatus}" à "${stepKey}"`
      })
    }
  }

  return (
    <div className="bg-white border rounded-lg p-4 mb-4 w-full shadow-sm">
      {/* Actions spéciales pour statuts CANCELLED et REFUNDED */}
      {(currentStatus === 'CANCELLED' || currentStatus === 'REFUNDED') && (
        <div className="mb-3 p-3 rounded-md bg-red-50 border border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStatus === 'CANCELLED' ? (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-sm text-red-800">Commande annulée</p>
                    <p className="text-xs text-red-600">Cette commande a été annulée</p>
                  </div>
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-sm text-red-800">Commande remboursée</p>
                    <p className="text-xs text-red-600">Cette commande a été remboursée</p>
                  </div>
                </>
              )}
            </div>
            {currentStatus === 'CANCELLED' && (
              <Button
                onClick={() => handleStatusChange('PENDING')}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Réactivation...
                  </>
                ) : (
                  'Réactiver la commande'
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Barre de progression horizontale - Largeur complète */}
      <div className="flex items-center justify-between mb-3">
         {STATUS_STEPS.map((step, index) => {
           const isCompleted = currentIndex > index
           const isCurrent = currentIndex === index
           const isClickable = isValidTransition(currentStatus, step.key)
           const isActive = isCompleted || isCurrent
           
           // Couleurs spéciales pour les statuts annulé/remboursé
           const isCancelledOrRefunded = ['CANCELLED', 'REFUNDED'].includes(currentStatus)
           const completedColor = isCancelledOrRefunded ? 'bg-red-500' : 'bg-green-500'
           const currentColor = isCancelledOrRefunded ? 'bg-red-600' : step.color
          
          return (
            <React.Fragment key={step.key}>
              {/* Étape cliquable */}
              <div 
                className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => isClickable && handleStepClick(step.key, index)}
              >
                 {/* Cercle avec icône */}
                 <div className={`
                   w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm
                   ${isCompleted ? completedColor : 
                     isCurrent ? currentColor : 
                     'bg-gray-300'}
                   transition-all duration-200
                   ${isClickable ? 'hover:scale-105 hover:shadow-md' : ''}
                 `}>
                   {isCompleted ? (
                     <CheckCircle className="h-5 w-5" />
                   ) : (
                     <step.icon className="h-5 w-5" />
                   )}
                 </div>
                 
                 {/* Label */}
                 <span className={`
                   mt-2 text-xs font-medium text-center
                   ${isActive ? 'text-gray-900' : 'text-gray-500'}
                   ${isClickable ? 'hover:text-blue-600' : ''}
                 `}>
                   {step.shortLabel}
                 </span>
              </div>
              
              {/* Ligne de connexion */}
              {index < STATUS_STEPS.length - 1 && (
                <div className={`
                  flex-1 h-1 mx-4 rounded-full
                  ${isCompleted ? completedColor : 'bg-gray-200'}
                  transition-colors duration-200
                `} />
              )}
            </React.Fragment>
          )
        })}
        
         {/* Bouton "Terminé" à la fin */}
         {currentStatus === 'DELIVERED' ? (
           <div className="ml-4 flex flex-col items-center">
             <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
               <CheckCircle className="h-5 w-5" />
             </div>
             <span className="mt-2 text-xs font-medium text-green-600">
               Terminé
             </span>
           </div>
         ) : isValidTransition(currentStatus, 'DELIVERED') ? (
           <div className="ml-4">
             <Button
               onClick={() => handleStatusChange('DELIVERED')}
               disabled={isLoading}
               size="sm"
               className="bg-green-600 hover:bg-green-700 text-white"
             >
               {isLoading ? (
                 <>
                   <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                   Mise à jour...
                 </>
               ) : (
                 <>
                   <CheckCircle className="h-3 w-3 mr-1" />
                   Terminé
                 </>
               )}
             </Button>
           </div>
         ) : null}
         
         {/* Icônes d'actions après la barre de progression */}
         {!['CANCELLED', 'REFUNDED'].includes(currentStatus) && (
           <div className="flex gap-4 ml-6">
             {/* Icône Annuler */}
             {currentStatus !== 'DELIVERED' && (
               <div className="flex flex-col items-center">
                 <div
                   onClick={() => handleStatusChange('CANCELLED')}
                   className="w-10 h-10 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center cursor-pointer transition-colors"
                   title="Annuler la commande"
                 >
                   <XCircle className="h-5 w-5 text-red-600" />
                 </div>
                 <span className="mt-2 text-xs font-medium text-red-600">
                   Annuler
                 </span>
               </div>
             )}
             
             {/* Icône Rembourser - Seulement pour commandes payées */}
             {['PAID'].includes(currentStatus) && (
               <div className="flex flex-col items-center">
                 <div
                   onClick={() => handleStatusChange('REFUNDED')}
                   className="w-10 h-10 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center cursor-pointer transition-colors"
                   title="Rembourser la commande"
                 >
                   <RefreshCw className="h-5 w-5 text-orange-600" />
                 </div>
                 <span className="mt-2 text-xs font-medium text-orange-600">
                   Rembourser
                 </span>
               </div>
             )}
           </div>
         )}
      </div>

    </div>
  )
}