import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Store typing indicators in memory (in production, use Redis or similar)
const typingIndicators = new Map<string, { userId: string, userName: string, timestamp: number }>()

// Cleanup old typing indicators (older than 10 seconds)
const cleanupOldIndicators = () => {
  const now = Date.now()
  Array.from(typingIndicators.entries()).forEach(([key, value]) => {
    if (now - value.timestamp > 10000) {
      typingIndicators.delete(key)
    }
  })
}

// POST - Start/Stop typing indicator
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier les permissions admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { isTyping } = body
    const quoteId = params.id
    const userId = session.user.id
    const userName = 'Administrateur'
    const key = `${quoteId}_${userId}`

    cleanupOldIndicators()

    if (isTyping) {
      // User started typing
      typingIndicators.set(key, {
        userId,
        userName,
        timestamp: Date.now()
      })
    } else {
      // User stopped typing
      typingIndicators.delete(key)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur lors de la gestion de l\'indicateur de frappe:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// GET - Get current typing indicators for a quote
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier les permissions admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const quoteId = params.id
    const currentUserId = session.user.id

    cleanupOldIndicators()

    // Get all typing indicators for this quote (excluding current user)
    const typingUsers = []
    Array.from(typingIndicators.entries()).forEach(([key, value]) => {
      if (key.startsWith(`${quoteId}_`) && value.userId !== currentUserId) {
        typingUsers.push({
          userId: value.userId,
          userName: value.userName
        })
      }
    })

    return NextResponse.json({ typingUsers })

  } catch (error) {
    console.error('Erreur lors de la récupération des indicateurs de frappe:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
} 