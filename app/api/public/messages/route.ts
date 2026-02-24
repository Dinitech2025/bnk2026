import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Récupérer les messages d'une conversation (côté client)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const clientEmail = searchParams.get('clientEmail')
    const userId = searchParams.get('userId')

    let where: any = {}

    if (conversationId) {
      where.conversationId = conversationId
    } else if (userId) {
      // Messages pour un utilisateur connecté
      where.OR = [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    } else if (clientEmail) {
      // Messages pour un client non connecté (par email)
      where.OR = [
        { clientEmail: clientEmail },
        { isPublic: true }
      ]
    } else {
      return NextResponse.json(
        { error: 'conversationId, userId ou clientEmail requis' },
        { status: 400 }
      )
    }

    const messages = await prisma.message.findMany({
      where,
      select: {
        id: true,
        subject: true,
        content: true,
        type: true,
        priority: true,
        status: true,
        fromUserId: true,
        toUserId: true,
        sentAt: true,
        createdAt: true,
        clientEmail: true,
        clientName: true,
        metadata: true,
        fromUser: {
          select: {
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        sentAt: 'asc',
      },
    })

    // Transformer les messages pour inclure les attachments
    const transformedMessages = messages.map(msg => {
      const metadata = msg.metadata as any
      const attachments = metadata?.attachments || []
      
      return {
        ...msg,
        attachments,
        isFromClient: msg.fromUserId !== msg.toUserId && msg.fromUser?.role !== 'ADMIN' && msg.fromUser?.role !== 'STAFF',
        fromUser: msg.fromUser
      }
    })

    // Marquer les messages comme lus pour l'utilisateur connecté
    if (userId) {
      const unreadMessages = transformedMessages.filter(m => m.toUserId === userId && m.status === 'UNREAD')
      if (unreadMessages.length > 0) {
        await prisma.message.updateMany({
          where: {
            id: {
              in: unreadMessages.map(m => m.id)
            }
          },
          data: {
            status: 'READ',
            readAt: new Date()
          }
        })
      }
    }

    return NextResponse.json({ messages: transformedMessages })
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Envoyer un message depuis le site public
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    let subject: string
    let content: string
    let clientEmail: string
    let clientName: string | undefined
    let type: string | undefined
    let relatedOrderId: string | undefined
    let relatedProductId: string | undefined
    let relatedServiceId: string | undefined
    let attachments: string[] = []

    // Gérer FormData (avec fichiers) ou JSON
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      
      subject = formData.get('subject') as string || ''
      content = formData.get('content') as string || ''
      clientEmail = formData.get('clientEmail') as string || ''
      clientName = formData.get('clientName') as string || undefined
      type = formData.get('type') as string || undefined
      
      // Traiter les fichiers
      const fileEntries = Array.from(formData.entries()).filter(([key]) => key.startsWith('file_'))
      attachments = fileEntries.map(([, file]) => {
        if (file instanceof File) {
          return file.name
        }
        return ''
      }).filter(Boolean)
    } else {
      const body = await request.json()
      subject = body.subject
      content = body.content
      clientEmail = body.clientEmail
      clientName = body.clientName
      type = body.type
      relatedOrderId = body.relatedOrderId
      relatedProductId = body.relatedProductId
      relatedServiceId = body.relatedServiceId
    }

    // Validation
    if (!subject || (!content && attachments.length === 0) || !clientEmail) {
      return NextResponse.json(
        { error: 'Sujet, contenu/pièces jointes et email client requis' },
        { status: 400 }
      )
    }

    // Vérifier si le client existe
    let client = await prisma.user.findFirst({
      where: { email: clientEmail },
    })

    // Si le client n'existe pas, on crée un message anonyme
    let fromUserId = null
    if (client) {
      fromUserId = client.id
    }

    // Trouver un admin pour recevoir le message
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Aucun administrateur disponible' },
        { status: 503 }
      )
    }

    // Créer la conversation si elle n'existe pas (optionnel pour l'instant)
    let conversationId = null
    // TODO: Implémenter les conversations quand la table sera créée

    // Créer le message
    const message = await prisma.message.create({
      data: {
        subject,
        content: content || (attachments.length > 0 ? 'Fichier(s) joint(s)' : ''),
        type: type || 'GENERAL',
        priority: 'NORMAL',
        fromUserId: fromUserId || admin.id, // Si pas de client, admin envoie
        toUserId: admin.id,
        clientEmail: clientEmail || undefined,
        clientName: clientName || undefined,
        isPublic: !client, // Public si pas de client connecté
        relatedOrderId,
        relatedSubscriptionId,
        relatedQuoteId,
        metadata: {
          source: 'public_form',
          timestamp: new Date().toISOString(),
          attachments: attachments.length > 0 ? attachments : undefined,
        },
      },
      select: {
        id: true,
        subject: true,
        content: true,
        type: true,
        priority: true,
        status: true,
        sentAt: true,
        createdAt: true,
        fromUserId: true,
        toUserId: true,
        clientEmail: true,
        clientName: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Message envoyé avec succès',
      conversationId,
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur lors de la création du message:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}