import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Forcer le mode dynamique pour cette route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API messages unifiés appelée')
    
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20') // Limiter à 20 conversations initiales
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || 'all'

    // 1. Récupérer les messages classiques (récupérer plus pour grouper par conversation)
    console.log('📧 Récupération des messages classiques...')
    const messages = await prisma.message.findMany({
      take: limit * 10, // Récupérer assez de messages pour avoir plusieurs conversations
      orderBy: { sentAt: 'desc' },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true, role: true }
        },
        toUser: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })
    console.log(`✅ ${messages.length} messages classiques récupérés`)

    // 2. Récupérer les devis avec leurs messages (limiter le nombre de devis)
    // IMPORTANT: Trier par updatedAt pour que les devis avec messages récents remontent en haut
    console.log('💬 Récupération des devis avec messages...')
    const quotesWithMessages = await prisma.quote.findMany({
      take: limit * 2, // Récupérer assez de devis pour avoir plusieurs conversations
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
          orderBy: { createdAt: 'desc' }, // Ordre décroissant pour récupérer les plus récents en premier
          take: 50, // Augmenter à 50 pour avoir plus de contexte
          include: {
            sender: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        },
        _count: {
          select: {
            messages: true // Compter le total de messages pour savoir s'il y en a plus
          }
        }
      },
      orderBy: { updatedAt: 'desc' } // Trier par updatedAt pour que les devis mis à jour récemment remontent
    })
    console.log(`✅ ${quotesWithMessages.length} devis avec messages récupérés`)

    // 3. Récupérer les messages internes (entre employés ADMIN/STAFF)
    console.log('👥 Récupération des messages internes entre employés...')
    const internalMessages = await prisma.message.findMany({
      where: {
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
              { fromUserId: session.user.id },
              { toUserId: session.user.id }
            ]
          }
        ]
      },
      take: limit * 10,
      orderBy: { sentAt: 'desc' },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true, role: true }
        },
        toUser: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })
    console.log(`✅ ${internalMessages.length} messages internes récupérés`)

    // 4. Transformer et unifier les conversations
    const unifiedConversations: any[] = []

    // Traiter les messages classiques (groupés par client)
    // EXCLURE les messages entre employés (ADMIN/STAFF) - ils seront traités séparément comme INTERNAL
    const messageConversationsMap = new Map()
    messages.forEach((message) => {
      // Exclure les messages entre employés (ADMIN/STAFF) - ils sont traités comme INTERNAL
      const isFromEmployee = message.fromUser?.role === 'ADMIN' || message.fromUser?.role === 'STAFF'
      const isToEmployee = message.toUser?.role === 'ADMIN' || message.toUser?.role === 'STAFF'
      
      if (isFromEmployee && isToEmployee) {
        // Ignorer ce message ici - il sera traité dans la section des messages internes
        return
      }

      const clientKey = message.clientEmail || message.fromUser?.email || message.fromUserId
      const clientName = message.clientName || message.fromUser?.name || message.fromUser?.email || 'Client'
      const clientEmail = message.clientEmail || message.fromUser?.email || ''
      // Identifier l'ID de l'utilisateur client (celui qui n'est pas admin/staff)
      const clientUserId = !message.fromUser || (message.fromUser.role !== 'ADMIN' && message.fromUser.role !== 'STAFF')
        ? message.fromUserId
        : message.toUserId

      if (!messageConversationsMap.has(clientKey)) {
        messageConversationsMap.set(clientKey, {
          id: `message-${clientKey}`,
          clientName,
          clientEmail,
          clientUserId, // Ajouter l'ID de l'utilisateur client
          messages: [],
          lastMessage: null,
          lastMessageAt: message.sentAt,
          unreadCount: 0,
          type: 'MESSAGE'
        })
      }

      const conv = messageConversationsMap.get(clientKey)
      conv.messages.push({
        id: message.id,
        subject: message.subject,
        content: message.content,
        type: message.type,
        priority: message.priority,
        status: message.status,
        sentAt: message.sentAt,
        createdAt: message.sentAt,
        fromUserId: message.fromUserId,
        toUserId: message.toUserId,
        clientEmail: message.clientEmail,
        clientName: message.clientName,
        relatedOrderId: message.relatedOrderId || null, // Ajouter pour le filtrage des commandes
        relatedQuoteId: message.relatedQuoteId || null,
        source: 'MESSAGE',
        isAdminReply: message.fromUser?.role === 'ADMIN' || message.fromUser?.role === 'STAFF',
        sender: message.fromUser
      })

      if (new Date(message.sentAt) > new Date(conv.lastMessageAt)) {
        conv.lastMessage = {
          content: message.content,
          sentAt: message.sentAt,
          type: message.type
        }
        conv.lastMessageAt = message.sentAt
      }

      // Compter les messages non lus envoyés par les clients (pas par l'admin ou staff)
      // Un message est non lu si:
      // 1. Le statut est UNREAD
      // 2. ET l'expéditeur n'est pas un admin ou staff (peut être null, CLIENT, ou sans rôle)
      const isFromClient = !message.fromUser || 
                          !message.fromUser.role || 
                          (message.fromUser.role !== 'ADMIN' && message.fromUser.role !== 'STAFF')
      
      if (message.status === 'UNREAD' && isFromClient) {
        conv.unreadCount++
        console.log(`📨 Message non lu compté: ${message.id} de ${message.fromUser?.email || message.clientEmail} (statut: ${message.status}, rôle: ${message.fromUser?.role || 'null'})`)
      }
    })

    // Trier les messages de chaque conversation par date (du plus ancien au plus récent)
    // Et limiter à 25 messages initiaux par conversation
    messageConversationsMap.forEach((conv) => {
      conv.messages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
      
      // Compter le total de messages avant limitation
      const totalMessages = conv.messages.length
      
      // Garder seulement les 25 derniers messages (les plus récents)
      const limitedMessages = conv.messages.slice(-25)
      
      conv.messages = limitedMessages
      conv.hasMoreMessages = totalMessages > 25
      conv.totalMessages = totalMessages
    })

    unifiedConversations.push(...Array.from(messageConversationsMap.values()))

    // Traiter les conversations de devis
    quotesWithMessages.forEach((quote) => {
      const itemName = quote.service?.name || quote.product?.name || 'Article'
      const allMessages: any[] = []

      // 1. Ajouter le message initial du devis (description)
      if (quote.description) {
        allMessages.push({
          id: `quote-initial-${quote.id}`,
          subject: `Demande de devis: ${itemName}`,
          content: quote.description,
          type: 'QUOTE',
          priority: 'NORMAL',
          status: 'read',
          sentAt: quote.createdAt,
          createdAt: quote.createdAt,
          fromUserId: quote.userId,
          toUserId: null, // Message initial du client
          clientEmail: quote.user?.email,
          clientName: quote.user?.name,
          source: 'QUOTE_INITIAL',
          isAdminReply: false,
          sender: quote.user
        })
      }

      // 2. Ajouter tous les messages de conversation (les messages sont déjà triés par createdAt desc depuis la requête)
      // On les inverse pour avoir l'ordre chronologique croissant pour l'affichage
      const sortedMessages = [...quote.messages].reverse()
      sortedMessages.forEach((msg) => {
        const isAdminMessage = msg.sender?.role === 'ADMIN' || msg.sender?.role === 'STAFF'
        
        allMessages.push({
          id: `quote-msg-${msg.id}`,
          subject: `Devis: ${itemName}`,
          content: msg.message,
          type: 'QUOTE',
          priority: 'NORMAL',
          status: 'read',
          sentAt: msg.createdAt,
          createdAt: msg.createdAt,
          fromUserId: msg.senderId,
          toUserId: isAdminMessage ? quote.userId : null,
          clientEmail: quote.user?.email,
          clientName: quote.user?.name,
          source: 'QUOTE_MESSAGE',
          isAdminReply: isAdminMessage,
          isSystemMessage: msg.isSystemMessage || false,
          sender: msg.sender || quote.user,
          proposedPrice: msg.proposedPrice ? Number(msg.proposedPrice) : null
        })
      })

      // Trier les messages par date (du plus ancien au plus récent pour l'affichage)
      allMessages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())

      if (allMessages.length > 0) {
        const lastMessage = allMessages[allMessages.length - 1]
        
        // Utiliser le maximum entre updatedAt du devis et le dernier message pour garantir que les devis récemment mis à jour remontent
        const lastActivity = lastMessage 
          ? Math.max(
              new Date(lastMessage.sentAt).getTime(),
              new Date(quote.updatedAt).getTime()
            )
          : new Date(quote.updatedAt).getTime()
        
        unifiedConversations.push({
          id: `quote-${quote.id}`,
          clientName: quote.user?.name || quote.user?.email || 'Client',
          clientEmail: quote.user?.email || '',
          messages: allMessages,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            sentAt: lastMessage.sentAt,
            type: 'QUOTE'
          } : null,
          lastMessageAt: new Date(lastActivity).toISOString(), // Utiliser la date la plus récente entre updatedAt et dernier message
          unreadCount: 0, // Les devis sont considérés comme lus
          type: 'QUOTE',
          relatedQuoteId: quote.id,
          quoteStatus: quote.status,
          hasMoreMessages: quote._count?.messages > allMessages.length, // Indiquer s'il y a plus de messages
          totalMessages: quote._count?.messages || 0, // Total de messages
          quoteData: {
            id: quote.id,
            status: quote.status,
            negotiationType: quote.negotiationType,
            proposedPrice: quote.proposedPrice ? Number(quote.proposedPrice) : null,
            finalPrice: quote.finalPrice ? Number(quote.finalPrice) : null,
            budget: quote.budget ? Number(quote.budget) : null,
            description: quote.description,
            createdAt: quote.createdAt.toISOString(),
            updatedAt: quote.updatedAt.toISOString(),
            user: {
              id: quote.user.id,
              name: quote.user.name,
              email: quote.user.email
            },
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
      }
    })

    // Traiter les conversations internes (entre employés)
    const internalConversationsMap = new Map()
    internalMessages.forEach((message) => {
      // Créer une clé unique pour la conversation entre deux employés
      // Utiliser les IDs triés pour que la conversation soit la même dans les deux sens
      const participants = [message.fromUserId, message.toUserId].sort()
      const conversationKey = `internal-${participants[0]}-${participants[1]}`
      
      // Identifier l'autre participant (celui qui n'est pas l'utilisateur actuel)
      const otherParticipant = message.fromUserId === session.user.id 
        ? message.toUser 
        : message.fromUser
      
      const otherParticipantName = otherParticipant?.name || otherParticipant?.email || 'Employé'
      const otherParticipantEmail = otherParticipant?.email || ''

      if (!internalConversationsMap.has(conversationKey)) {
        internalConversationsMap.set(conversationKey, {
          id: conversationKey,
          clientName: otherParticipantName,
          clientEmail: otherParticipantEmail,
          otherParticipantId: otherParticipant?.id,
          otherParticipantRole: otherParticipant?.role,
          clientUserId: otherParticipant?.id, // Ajouter pour cohérence
          messages: [],
          lastMessage: null,
          lastMessageAt: message.sentAt,
          unreadCount: 0,
          type: 'INTERNAL'
        })
      }

      const conv = internalConversationsMap.get(conversationKey)
      conv.messages.push({
        id: message.id,
        subject: message.subject,
        content: message.content,
        type: message.type || 'INTERNAL',
        priority: message.priority,
        status: message.status,
        sentAt: message.sentAt,
        createdAt: message.sentAt,
        fromUserId: message.fromUserId,
        toUserId: message.toUserId,
        source: 'INTERNAL',
        isAdminReply: message.fromUserId === session.user.id,
        sender: message.fromUser
      })

      if (new Date(message.sentAt) > new Date(conv.lastMessageAt)) {
        conv.lastMessage = {
          content: message.content,
          sentAt: message.sentAt,
          type: 'INTERNAL'
        }
        conv.lastMessageAt = message.sentAt
      }

      // Compter les messages non lus reçus par l'utilisateur actuel
      if (message.status === 'UNREAD' && message.toUserId === session.user.id) {
        conv.unreadCount++
        console.log(`📨 Message interne non lu compté: ${message.id} de ${message.fromUser?.email}`)
      }
    })

    // Trier les messages de chaque conversation interne par date
    internalConversationsMap.forEach((conv) => {
      conv.messages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
      
      const totalMessages = conv.messages.length
      const limitedMessages = conv.messages.slice(-25)
      
      conv.messages = limitedMessages
      conv.hasMoreMessages = totalMessages > 25
      conv.totalMessages = totalMessages
    })

    unifiedConversations.push(...Array.from(internalConversationsMap.values()))

    // Trier toutes les conversations par dernier message
    unifiedConversations.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    )

    // Filtrer selon les paramètres
    let filteredConversations = unifiedConversations
    if (type !== 'all') {
      filteredConversations = unifiedConversations.filter(
        conv => conv.type.toLowerCase() === type.toLowerCase()
      )
    }
    if (search) {
      filteredConversations = filteredConversations.filter(
        conv => 
          conv.clientName.toLowerCase().includes(search.toLowerCase()) ||
          conv.clientEmail.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Calculer les statistiques
    const stats = {
      totalConversations: unifiedConversations.length,
      messageConversations: unifiedConversations.filter(c => c.type === 'MESSAGE').length,
      quoteConversations: unifiedConversations.filter(c => c.type === 'QUOTE').length,
      internalConversations: unifiedConversations.filter(c => c.type === 'INTERNAL').length,
      mixedConversations: unifiedConversations.filter(c => c.type === 'MIXED').length,
      unreadCount: unifiedConversations.reduce((sum, c) => sum + c.unreadCount, 0)
    }

    console.log('📊 Statistiques:', stats)
    
    // Paginer les conversations
    const totalConversations = filteredConversations.length
    const skip = (page - 1) * limit
    const paginatedConversations = filteredConversations.slice(skip, skip + limit)
    const hasMoreConversations = skip + limit < totalConversations

    console.log(`✅ ${paginatedConversations.length} conversations retournées (page ${page}/${Math.ceil(totalConversations / limit)})`)

    return NextResponse.json({
      conversations: paginatedConversations,
      stats,
      pagination: {
        page,
        limit,
        total: totalConversations,
        totalPages: Math.ceil(totalConversations / limit),
        hasMore: hasMoreConversations
      }
    })

  } catch (error) {
    console.error('❌ Erreur API messages unifiés:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}