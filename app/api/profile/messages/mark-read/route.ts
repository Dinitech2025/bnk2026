import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { conversationId, messageIds } = await request.json()

    console.log(`📖 Marquage comme lu: conversation ${conversationId}`)

    if (conversationId === 'messages-general') {
      // Marquer tous les messages généraux comme lus
      // Marquer les messages reçus par l'utilisateur (toUserId) ou où l'utilisateur est le client
      await prisma.message.updateMany({
        where: {
          AND: [
            {
              OR: [
                { toUserId: session.user.id }, // Messages reçus par l'utilisateur
                { 
                  AND: [
                    { clientEmail: session.user.email || '' }, // Messages où l'utilisateur est le client
                    { fromUserId: { not: session.user.id } } // Pas ses propres messages
                  ]
                }
              ]
            },
            { status: 'UNREAD' } // Seulement les messages non lus
          ]
        },
        data: {
          status: 'READ'
          // readAt supprimé - champ non synchronisé dans la base
        }
      })

      console.log('✅ Messages généraux marqués comme lus')
    } else if (conversationId.startsWith('quote-')) {
      // Marquage comme lu temporairement désactivé
      const quoteId = conversationId.replace('quote-', '')
      
      console.log(`⚠️ Marquage comme lu temporairement désactivé pour le devis ${quoteId}`)
      console.log(`🔧 Le champ readAt n'est pas synchronisé dans la base de données`)
    }

    return NextResponse.json({ 
      message: 'Messages marqués comme lus' 
    })

  } catch (error) {
    console.error('❌ Erreur lors du marquage comme lu:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
