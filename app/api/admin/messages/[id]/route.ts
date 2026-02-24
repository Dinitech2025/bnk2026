import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer un message spécifique avec ses réponses
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const message = await prisma.message.findUnique({
      where: { id: params.id },
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
      },
    })

    if (!message) {
      return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 })
    }

    // Ajouter des informations fictives pour la compatibilité
    const enrichedMessage = {
      ...message,
      fromUser: {
        id: message.fromUserId,
        name: null,
        email: message.clientEmail || 'Admin',
        role: message.fromUserId ? 'ADMIN' : 'CLIENT',
      },
      toUser: {
        id: message.toUserId,
        name: null,
        email: message.clientEmail || 'Client',
      },
      replies: [],
    }

    return NextResponse.json(enrichedMessage)
  } catch (error) {
    console.error('Erreur lors de la récupération du message:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour un message
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      status,
      relatedOrderId,
      relatedSubscriptionId,
      relatedQuoteId,
      metadata,
    } = body

    const updateData: any = {
      subject,
      content,
      type,
      priority,
      status,
      relatedOrderId,
      relatedSubscriptionId,
      relatedQuoteId,
      metadata,
    }

    // Supprimer les valeurs undefined
    Object.keys(updateData).forEach(key =>
      updateData[key] === undefined && delete updateData[key]
    )

    const message = await prisma.message.update({
      where: { id: params.id },
      data: updateData,
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
      },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du message:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await prisma.message.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Message supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du message:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

