import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    console.log(`🔍 Récupération des messages pour l'utilisateur: ${session.user.email}`)

    // 1. Récupérer les messages classiques (tous types)
    // Récupérer TOUS les messages où l'utilisateur est impliqué (expéditeur OU destinataire)
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: session.user.id }, // Messages envoyés par l'utilisateur
          { toUserId: session.user.id }, // Messages reçus par l'utilisateur
          { clientEmail: session.user.email }, // Messages où l'utilisateur est le client (invité)
          { 
            // Messages généraux où l'utilisateur est mentionné
            AND: [
              { type: { in: ['GENERAL', 'SUPPORT', 'NOTIFICATION'] } },
              { 
                OR: [
                  { clientEmail: session.user.email },
                  { fromUserId: session.user.id },
                  { toUserId: session.user.id }
                ]
              }
            ]
          }
        ]
      },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true, role: true }
        },
        toUser: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { sentAt: 'desc' },
      take: 100 // Augmenter pour récupérer plus de messages
    })

    // 2. Récupérer les devis avec messages
    const quotesWithMessages = await prisma.quote.findMany({
      where: { userId: session.user.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        service: {
          select: { 
            id: true, 
            name: true, 
            slug: true, 
            price: true,
            pricingType: true,
            description: true,
            images: {
              select: { path: true, alt: true },
              take: 1
            }
          }
        },
        product: {
          select: { 
            id: true, 
            name: true, 
            slug: true, 
            price: true,
            pricingType: true,
            description: true,
            images: {
              select: { path: true, alt: true },
              take: 1
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 25, // Limiter à 25 messages initiaux pour optimisation
          include: {
            sender: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        },
        _count: {
          select: {
            messages: true // Compter le total de messages
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`✅ ${messages.length} messages classiques et ${quotesWithMessages.length} devis récupérés`)

    // 3. Transformer et unifier les conversations
    const unifiedConversations: any[] = []

    // Traiter les messages classiques (groupés en une seule conversation)
    if (messages.length > 0) {
      // Compter le total réel de messages généraux (même logique que pour récupérer les messages)
      const totalGeneralMessages = await prisma.message.count({
        where: {
          OR: [
            { fromUserId: session.user.id },
            { toUserId: session.user.id },
            { clientEmail: session.user.email },
            { 
              AND: [
                { type: { in: ['GENERAL', 'SUPPORT', 'NOTIFICATION'] } },
                { 
                  OR: [
                    { clientEmail: session.user.email },
                    { fromUserId: session.user.id },
                    { toUserId: session.user.id }
                  ]
                }
              ]
            }
          ]
        }
      })
      
      const allMessages = messages.map((message) => {
        const isAdminMessage = message.fromUser?.role === 'ADMIN' || message.fromUser?.role === 'STAFF'
        const isFromCurrentUser = message.fromUserId === session.user.id
        
        return {
          id: message.id,
          content: message.content,
          sentAt: message.sentAt,
          isAdminReply: isAdminMessage,
          isSystemMessage: false,
          sender: message.fromUser,
          receiver: message.toUser,
          isFromCurrentUser: isFromCurrentUser,
          relatedQuoteId: message.relatedQuoteId || null
        }
      })

      // Trier par date et limiter à 25 messages initiaux
      allMessages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
      
      // Garder seulement les 25 derniers messages (les plus récents)
      const limitedMessages = allMessages.slice(-25)
      
      // Créer une seule conversation pour tous les messages
      const lastMessage = limitedMessages[limitedMessages.length - 1]
      
      // Compter seulement les messages non lus reçus par l'utilisateur (pas ses propres messages)
      const unreadCount = messages.filter(m => {
        // Ne pas compter les messages envoyés par l'utilisateur lui-même
        if (m.fromUserId === session.user.id) return false
        
        // Compter les messages non lus où l'utilisateur est le destinataire
        return m.status === 'UNREAD' && (
          m.toUserId === session.user.id || 
          (m.clientEmail === session.user.email && m.fromUserId !== session.user.id)
        )
      }).length
      
      unifiedConversations.push({
        id: 'messages-general',
        subject: 'Messages avec l\'équipe',
        messages: limitedMessages,
        lastMessage: lastMessage.content,
        lastMessageAt: lastMessage.sentAt,
        unreadCount: unreadCount,
        type: 'MESSAGE',
        hasMoreMessages: totalGeneralMessages > 25,
        totalMessages: totalGeneralMessages
      })
    }

    // Les messages classiques sont déjà ajoutés ci-dessus

    // Traiter les devis avec leurs messages
    quotesWithMessages.forEach((quote) => {
      const itemName = quote.service?.name || quote.product?.name || 'Article'
      const allMessages: any[] = []

      // 1. Ajouter le message initial du devis
      if (quote.description) {
        allMessages.push({
          id: `quote-initial-${quote.id}`,
          content: quote.description,
          sentAt: quote.createdAt,
          isAdminReply: false,
          isSystemMessage: false,
          sender: quote.user
        })
      }

      // 2. Ajouter tous les messages de conversation
      quote.messages.forEach((msg) => {
        const isAdminMessage = msg.sender?.role === 'ADMIN' || msg.sender?.role === 'STAFF'
        
        allMessages.push({
          id: `quote-msg-${msg.id}`,
          content: msg.message,
          sentAt: msg.createdAt,
          isAdminReply: isAdminMessage,
          isSystemMessage: msg.isSystemMessage || false,
          sender: msg.sender || quote.user
        })
      })

      // Trier tous les messages par date
      allMessages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())

      // Créer la conversation unifiée
      const lastMessage = allMessages[allMessages.length - 1]
      
      unifiedConversations.push({
        id: `quote-${quote.id}`,
        subject: `Devis: ${itemName}`,
        messages: allMessages,
        lastMessage: lastMessage?.content || quote.description,
        lastMessageAt: lastMessage?.sentAt || quote.createdAt,
        unreadCount: 0, // Temporairement désactivé - champ readAt non synchronisé
        type: 'QUOTE',
        relatedQuoteId: quote.id,
        hasMoreMessages: quote._count?.messages > allMessages.length,
        totalMessages: quote._count?.messages || 0,
        quoteData: {
          id: quote.id,
          status: quote.status,
          negotiationType: quote.negotiationType,
          proposedPrice: quote.proposedPrice ? Number(quote.proposedPrice) : null,
          finalPrice: quote.finalPrice ? Number(quote.finalPrice) : null,
          service: quote.service ? {
            ...quote.service,
            price: quote.service.price ? Number(quote.service.price) : null
          } : null,
          product: quote.product ? {
            ...quote.product,
            price: quote.product.price ? Number(quote.product.price) : null
          } : null
        }
      })
    })

    // Trier toutes les conversations par date du dernier message
    unifiedConversations.sort((a, b) => 
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    )

    console.log(`✅ ${unifiedConversations.length} conversations unifiées créées`)

    return NextResponse.json({
      conversations: unifiedConversations,
      total: unifiedConversations.length
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des messages:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    let message: string
    let conversationId: string
    let attachments: string[] = []

    // Gérer FormData (avec fichiers) ou JSON
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      message = formData.get('message') as string || ''
      conversationId = formData.get('conversationId') as string || 'messages-general'
      
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
      message = body.message || ''
      conversationId = body.conversationId || 'messages-general'
      attachments = body.attachments || []
    }

    if (!message?.trim() && attachments.length === 0) {
      return NextResponse.json(
        { error: 'Le message ne peut pas être vide' },
        { status: 400 }
      )
    }

    console.log(`📝 Envoi de message pour la conversation: ${conversationId} par ${session.user.email}`)

    // Déterminer le type de conversation et créer le message approprié
    if (conversationId.startsWith('quote-')) {
      // Message dans une conversation de devis
      const quoteId = conversationId.replace('quote-', '')
      
      const newMessage = await prisma.quoteMessage.create({
        data: {
          quoteId: quoteId,
          message: message.trim() || 'Fichier(s) joint(s)',
          senderId: session.user.id, // Toujours l'utilisateur connecté
          isSystemMessage: false,
          attachments: attachments.length > 0 ? attachments : []
        }
      })

      // Mettre à jour le devis pour que updatedAt soit rafraîchi et remonter dans la liste
      await prisma.quote.update({
        where: { id: quoteId },
        data: {} // Mise à jour vide pour juste rafraîchir updatedAt
      })

      console.log(`✅ Message de devis créé: ${newMessage.id}`)
    } else {
      // Message classique
      // Trouver un admin pour recevoir le message
      const admin = await prisma.user.findFirst({
        where: {
          role: { in: ['ADMIN', 'STAFF'] }
        },
        select: {
          id: true
        }
      })

      if (!admin) {
        console.error('❌ Aucun admin trouvé pour recevoir le message')
        return NextResponse.json(
          { error: 'Aucun administrateur disponible' },
          { status: 500 }
        )
      }

      console.log(`📝 Création du message classique par ${session.user.email} (ID: ${session.user.id}) pour admin: ${admin.id}`)
      
      const newMessage = await prisma.message.create({
        data: {
          subject: 'Message client',
          content: message.trim() || 'Fichier(s) joint(s)',
          fromUserId: session.user.id, // TOUJOURS l'utilisateur connecté
          toUserId: admin.id, // Admin qui recevra le message
          clientEmail: session.user.email || '',
          clientName: session.user.name || session.user.email || '',
          type: 'GENERAL',
          priority: 'NORMAL',
          status: 'UNREAD',
          metadata: attachments.length > 0 ? {
            attachments: attachments
          } : undefined
        }
      })

      console.log(`✅ Message classique créé: ${newMessage.id} par ${session.user.email} (fromUserId: ${newMessage.fromUserId})`)
    }

    return NextResponse.json({ 
      message: 'Message envoyé avec succès' 
    })

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du message:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
