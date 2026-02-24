import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { conversationId } = await params
    const { searchParams } = new URL(request.url)

    console.log(`📥 Chargement de plus de messages (client) pour conversation: ${conversationId}`)

    if (conversationId === 'messages-general') {
      // Charger plus de messages généraux
      const where: any = {
        OR: [
          { toUserId: session.user.id },
          { 
            AND: [
              { clientEmail: session.user.email || '' },
              { fromUserId: { not: session.user.id } }
            ]
          }
        ]
      }
      
      if (before) {
        where.sentAt = { lt: new Date(before) }
      }

      const additionalMessages = await prisma.message.findMany({
        where,
        orderBy: { sentAt: 'asc' },
        take: limit,
        include: {
          fromUser: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      })

      const totalMessages = await prisma.message.count({
        where: {
          OR: [
            { toUserId: session.user.id },
            { 
              AND: [
                { clientEmail: session.user.email || '' },
                { fromUserId: { not: session.user.id } }
              ]
            }
          ]
        }
      })
      
      const hasMore = additionalMessages.length === limit && additionalMessages.length < totalMessages

      console.log(`✅ ${additionalMessages.length} messages supplémentaires chargés`)

      return NextResponse.json({
        messages: additionalMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          sentAt: msg.sentAt,
          createdAt: msg.sentAt,
          isAdminReply: msg.fromUser?.role === 'ADMIN' || msg.fromUser?.role === 'STAFF',
          isSystemMessage: false,
          sender: msg.fromUser
        })),
        hasMore,
        totalMessages
      })

    } else if (conversationId.startsWith('quote-')) {
      // Charger plus de messages de devis
      const quoteId = conversationId.replace('quote-', '')
      
      // Vérifier que l'utilisateur a accès à ce devis
      const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        select: { userId: true }
      })

      if (!quote || quote.userId !== session.user.id) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
      }
      
      const where: any = { quoteId }
      if (before) {
        where.createdAt = { lt: new Date(before) }
      }

      const additionalMessages = await prisma.quoteMessage.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: limit,
        include: {
          sender: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      })

      const totalMessages = await prisma.quoteMessage.count({ where: { quoteId } })
      const hasMore = additionalMessages.length === limit && additionalMessages.length < totalMessages

      console.log(`✅ ${additionalMessages.length} messages supplémentaires chargés`)

      return NextResponse.json({
        messages: additionalMessages.map(msg => ({
          id: `quote-msg-${msg.id}`,
          content: msg.message,
          sentAt: msg.createdAt,
          createdAt: msg.createdAt,
          isAdminReply: msg.sender?.role === 'ADMIN' || msg.sender?.role === 'STAFF',
          isSystemMessage: msg.isSystemMessage || false,
          sender: msg.sender
        })),
        hasMore,
        totalMessages
      })
    }

    return NextResponse.json({ error: 'Type de conversation non reconnu' }, { status: 400 })

  } catch (error) {
    console.error('❌ Erreur lors du chargement des messages:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
