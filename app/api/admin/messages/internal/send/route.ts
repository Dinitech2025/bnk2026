import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { toUserId, subject, content, type, priority } = await request.json()

    // Validation
    if (!toUserId || !content) {
      return NextResponse.json(
        { error: 'Destinataire et contenu requis' },
        { status: 400 }
      )
    }

    // Vérifier que le destinataire est un employé (ADMIN ou STAFF)
    const recipient = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true, email: true, role: true }
    })

    if (!recipient) {
      return NextResponse.json(
        { error: 'Destinataire introuvable' },
        { status: 404 }
      )
    }

    if (recipient.role !== 'ADMIN' && recipient.role !== 'STAFF') {
      return NextResponse.json(
        { error: 'Le destinataire doit être un employé (ADMIN ou STAFF)' },
        { status: 400 }
      )
    }

    // Empêcher l'envoi à soi-même
    if (toUserId === session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous envoyer un message' },
        { status: 400 }
      )
    }

    // Créer le message interne
    const message = await prisma.message.create({
      data: {
        subject: subject || 'Message interne',
        content: content.trim(),
        type: type || 'INTERNAL',
        priority: priority || 'NORMAL',
        status: 'UNREAD',
        fromUserId: session.user.id,
        toUserId: toUserId,
        metadata: {
          source: 'internal_message',
          timestamp: new Date().toISOString()
        }
      },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true, role: true }
        },
        toUser: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })

    console.log(`✅ Message interne créé: ${message.id} de ${session.user.email} à ${recipient.email}`)

    return NextResponse.json({
      success: true,
      message: 'Message envoyé avec succès',
      data: message
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du message interne:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}


