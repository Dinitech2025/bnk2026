import { NextRequest, NextResponse } from 'next/server'
 
export async function POST(req: NextRequest) {
  // Cette route est utilisée par next-auth pour les logs
  // On peut simplement retourner un succès car c'est juste pour le logging
  return NextResponse.json({ success: true })
} 