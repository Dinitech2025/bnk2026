import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    
    const { environment, clientId, clientSecret } = config;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Client ID et Client Secret requis' },
        { status: 400 }
      );
    }

    // Déterminer l'URL de base selon l'environnement
    const baseUrl = environment === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    // Tester l'authentification PayPal
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();

    if (response.ok && data.access_token) {
      return NextResponse.json({
        success: true,
        message: `Connexion PayPal ${environment} réussie`,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        environment
      });
    } else {
      return NextResponse.json(
        { 
          error: data.error_description || data.error || 'Erreur d\'authentification PayPal',
          details: data
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Erreur test PayPal:', error);
    return NextResponse.json(
      { error: 'Erreur lors du test de connexion PayPal' },
      { status: 500 }
    );
  }
}

