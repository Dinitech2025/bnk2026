import { NextRequest, NextResponse } from 'next/server'
import { getPayPalConfig, getPayPalBaseUrl } from '@/lib/paypal-config'

// Fonction pour obtenir un token d'accès PayPal
async function getPayPalAccessToken() {
  const config = await getPayPalConfig()
  const baseUrl = getPayPalBaseUrl(config.environment)
  
  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')
  
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  })

  const data = await response.json()
  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    // Récupérer la configuration PayPal
    const config = await getPayPalConfig()
    const baseUrl = getPayPalBaseUrl(config.environment)
    
    // Vérifier que PayPal est configuré
    if (!config.clientId || !config.clientSecret) {
      return NextResponse.json(
        { error: 'PayPal non configuré. Veuillez configurer les clés API dans les paramètres.' },
        { status: 500 }
      )
    }

    const { orderID, orderData } = await request.json()

    // Validation des données
    if (!orderID) {
      return NextResponse.json(
        { error: 'ID de commande PayPal manquant' },
        { status: 400 }
      )
    }

    // Obtenir le token d'accès
    const accessToken = await getPayPalAccessToken()

    // Capturer le paiement
    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    })

    const capture = await response.json()

    if (response.ok && capture.status === 'COMPLETED') {
      // Le paiement a été capturé avec succès
      const paymentDetails = {
        id: capture.id,
        status: capture.status,
        paypalOrderId: orderID,
        amount: capture.purchase_units[0]?.payments?.captures[0]?.amount,
        payerInfo: capture.payer,
        captureId: capture.purchase_units[0]?.payments?.captures[0]?.id,
        timestamp: new Date().toISOString()
      }

      // Ici vous pouvez :
      // 1. Sauvegarder la commande en base de données
      // 2. Envoyer un email de confirmation
      // 3. Mettre à jour le stock
      // 4. Créer l'entrée dans la table des paiements

      console.log('Paiement PayPal capturé:', paymentDetails)

      // TODO: Intégrer avec votre système de commandes
      // await saveOrderToDatabase(orderData, paymentDetails)
      // await sendConfirmationEmail(orderData, paymentDetails)

      return NextResponse.json(paymentDetails)

    } else {
      console.error('Erreur capture PayPal:', capture)
      return NextResponse.json(
        { error: capture.message || 'Erreur lors de la capture du paiement' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Erreur capture paiement PayPal:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 