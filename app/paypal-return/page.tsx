'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PayPalReturnPage() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const orderID = searchParams.get('orderID');
    const success = searchParams.get('success') === 'true';
    
    console.log('🔄 PayPal Return Page:', { orderID, success });
    
    // Envoyer un message à la fenêtre parent
    if (window.opener) {
      window.opener.postMessage({
        type: 'PAYPAL_PAYMENT_COMPLETE',
        orderID,
        success
      }, window.location.origin);
      
      // Fermer cette fenêtre
      window.close();
    } else {
      // Si pas de fenêtre parent, rediriger vers le checkout
      console.log('⚠️ Pas de fenêtre parent, redirection vers checkout');
      window.location.href = '/checkout';
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Traitement du paiement PayPal...
        </h2>
        <p className="text-gray-600">
          Veuillez patienter, cette fenêtre va se fermer automatiquement.
        </p>
      </div>
    </div>
  );
}

