import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer tous les messages avec filtres
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'STAFF')) {
      console.error('Session invalide ou rôle incorrect:', session)
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}

    if (status) where.status = status
    if (type) where.type = type
    if (priority) where.priority = priority
    if (userId) where.toUserId = userId

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
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
          updatedAt: true,
          clientEmail: true,
          clientName: true,
        },
        orderBy: [
          { status: 'asc' },
          { priority: 'desc' },
          { sentAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.message.count({ where }),
    ])

    console.log(`✅ ${messages.length} messages récupérés sur ${total} total`)

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des messages:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const {
      subject,
      content,
      type,
      priority,
      toUserId,
      relatedOrderId,
      relatedSubscriptionId,
      relatedQuoteId,
      metadata,
    } = body

    // Validation
    if (!subject || !content || !toUserId) {
      return NextResponse.json(
        { error: 'Le sujet, contenu et destinataire sont requis' },
        { status: 400 }
      )
    }

    // Vérifier que le destinataire existe
    const recipient = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true, email: true, role: true },
    })

    if (!recipient) {
      return NextResponse.json(
        { error: 'Destinataire non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que c'est bien un client (pas un admin/staff)
    if (recipient.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Le destinataire doit être un client' },
        { status: 400 }
      )
    }

    const message = await prisma.message.create({
      data: {
        subject,
        content,
        type: type || 'GENERAL',
        priority: priority || 'NORMAL',
        fromUserId: session.user.id,
        toUserId,
        relatedOrderId,
        relatedSubscriptionId,
        relatedQuoteId,
        metadata,
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

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du message:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

