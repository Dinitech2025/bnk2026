import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { conversationId } = await request.json()

    console.log(`📖 Marquage comme lu (admin): conversation ${conversationId}`)

    if (conversationId.startsWith('message-')) {
      // Marquer les messages généraux comme lus
      // Extraire l'identifiant du client depuis conversationId
      const clientKey = conversationId.replace('message-', '')
      
      // Trouver tous les messages non lus de ce client qui ne sont pas envoyés par un admin
      await prisma.message.updateMany({
        where: {
          AND: [
            {
              OR: [
                { clientEmail: clientKey },
                { fromUserId: clientKey }
              ]
            },
            { status: 'UNREAD' },
            {
              NOT: {
                fromUser: {
                  role: { in: ['ADMIN', 'STAFF'] }
                }
              }
            }
          ]
        },
        data: {
          status: 'READ'
        }
      })

      console.log('✅ Messages généraux marqués comme lus par admin')
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
