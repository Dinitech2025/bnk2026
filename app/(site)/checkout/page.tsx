import { Suspense } from 'react'
import CheckoutContent from './checkout-content'

function CheckoutLoading() {
    return (
      <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Chargement du checkout sécurisé...</p>
        </div>
      </div>
    )
  }

export default function CheckoutPage() {
  return (
    <div className="min-h-screen">
    <div className="container mx-auto px-4 py-8">
          {/* En-tête simplifié */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              🛒 Finaliser votre commande
            </h1>
              </div>
              
        <Suspense fallback={<CheckoutLoading />}>
          <CheckoutContent />
        </Suspense>
      </div>
    </div>
  )
} 
