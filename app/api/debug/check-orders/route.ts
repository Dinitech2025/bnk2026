import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Tenter d'appeler l'API des commandes directement comme le fait la page admin
    // Utiliser l'URL absolue du serveur local
    const res = await fetch(`https://localhost:3000/api/admin/orders?t=${Date.now()}`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      return NextResponse.json({
        status: res.status,
        statusText: res.statusText,
        error: 'Erreur lors du chargement des commandes depuis l\'API'
      }, { status: 500 });
    }
    
    // Renvoyer les données brutes
    const data = await res.json();
    
    return NextResponse.json({
      success: true,
      ordersCount: data.length,
      orders: data,
      apiUrl: 'https://localhost:3000'
    });
  } catch (error) {
    console.error('Erreur debug check-orders:', error);
    return NextResponse.json({ 
      success: false,
      error: String(error) 
    }, { status: 500 });
  }
} 