import { NextRequest, NextResponse } from 'next/server'
import { getPayPalReturnUrls, getSecureBaseUrl } from '@/lib/utils/get-base-url'
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

    const { amount, currency, orderData } = await request.json()

    // Validation des données
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      )
    }

    // Obtenir le token d'accès
    const accessToken = await getPayPalAccessToken()

    // Créer la commande PayPal d'abord pour obtenir l'ID
    const paypalOrder = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount
        },
        description: `Commande BNK - ${orderData?.items?.length || 1} article(s)`,
        custom_id: orderData?.orderId || '',
        invoice_id: `BNK-${Date.now()}`,
      }],
      application_context: {
        brand_name: 'BNK E-commerce',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        // URLs temporaires, seront mises à jour après création
        return_url: `${getPayPalReturnUrls().returnUrl}`,
        cancel_url: `${getPayPalReturnUrls().cancelUrl}`
      }
    }

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paypalOrder)
    })

    const order = await response.json()

    if (response.ok) {
    // Obtenir les URLs de retour avec l'orderID réel
    const { returnUrl, cancelUrl } = getPayPalReturnUrls(order.id)
    
    // Debug: Log des URLs utilisées
    console.log('🔗 PayPal URLs générées:', {
      environment: process.env.NODE_ENV,
      netlifyUrl: process.env.URL,
      deployUrl: process.env.DEPLOY_URL,
      baseUrl: getSecureBaseUrl(),
      returnUrl,
      cancelUrl
    })
      
      return NextResponse.json({
        id: order.id,
        status: order.status,
        links: order.links,
        returnUrl,
        cancelUrl
      })
    } else {
      console.error('Erreur PayPal:', order)
      return NextResponse.json(
        { error: order.message || 'Erreur lors de la création de la commande PayPal' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Erreur création commande PayPal:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 