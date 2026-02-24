import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering for authentication routes
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      success: true,
      hasSession: !!session,
      sessionData: session ? {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          role: session.user?.role
        }
      } : null,
      message: 'Test d\'authentification réussi'
    })
  } catch (error) {
    console.error('Erreur d\'authentification:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      message: 'Erreur lors du test d\'authentification'
    }, { status: 500 })
  }
}
