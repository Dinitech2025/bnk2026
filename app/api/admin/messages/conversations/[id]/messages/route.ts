import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const conversationId = (await params).id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '25')
    const before = searchParams.get('before') // Date du message le plus ancien chargé

    console.log(`📥 Chargement de plus de messages pour conversation: ${conversationId}`)

    if (conversationId.startsWith('quote-')) {
      // Charger plus de messages de devis
      const quoteId = conversationId.replace('quote-', '')
      
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
          sender: msg.sender,
          proposedPrice: msg.proposedPrice ? Number(msg.proposedPrice) : null
        })),
        hasMore,
        totalMessages
      })

    } else if (conversationId.startsWith('message-')) {
      // Charger plus de messages généraux
      const clientKey = conversationId.replace('message-', '')
      
      const where: any = {
        OR: [
          { clientEmail: clientKey },
          { fromUserId: clientKey }
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
            { clientEmail: clientKey },
            { fromUserId: clientKey }
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
    } else if (conversationId.startsWith('internal-')) {
      // Charger plus de messages internes entre employés
      const parts = conversationId.replace('internal-', '').split('-')
      const participantIds = parts.length === 2 ? [parts[0], parts[1]] : []
      
      if (participantIds.length !== 2) {
        return NextResponse.json({ error: 'Format de conversation invalide' }, { status: 400 })
      }

      const where: any = {
        AND: [
          {
            fromUser: {
              role: { in: ['ADMIN', 'STAFF'] }
            }
          },
          {
            toUser: {
              role: { in: ['ADMIN', 'STAFF'] }
            }
          },
          {
            OR: [
              {
                AND: [
                  { fromUserId: participantIds[0] },
                  { toUserId: participantIds[1] }
                ]
              },
              {
                AND: [
                  { fromUserId: participantIds[1] },
                  { toUserId: participantIds[0] }
                ]
              }
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
          },
          toUser: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      })

      const totalMessages = await prisma.message.count({ where })
      const hasMore = additionalMessages.length === limit && additionalMessages.length < totalMessages

      console.log(`✅ ${additionalMessages.length} messages internes supplémentaires chargés`)

      return NextResponse.json({
        messages: additionalMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          sentAt: msg.sentAt,
          createdAt: msg.sentAt,
          isAdminReply: msg.fromUserId === session.user.id,
          isSystemMessage: false,
          sender: msg.fromUser
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
