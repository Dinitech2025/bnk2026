import { NextResponse } from 'next/server'

export async function GET() {
  // Récupérer et retourner les variables d'environnement publiques
  // Ne jamais exposer les variables sensibles!
  return NextResponse.json({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'non défini',
    NODE_ENV: process.env.NODE_ENV || 'non défini',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'non défini',
  });
} 