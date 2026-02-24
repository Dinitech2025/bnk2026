import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Ajouter un message à un devis (ancien système QuoteMessage)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier les permissions admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { message, attachments, proposedPrice } = body

    if (!message?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Le message ou des fichiers joints sont requis' }, { status: 400 })
    }

    // Vérifier que le devis existe
    const quote = await prisma.quote.findUnique({
      where: { id: params.id }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Créer le message avec QuoteMessage
    const newMessage = await prisma.quoteMessage.create({
      data: {
        quoteId: params.id,
        senderId: session.user.id,
        message: message?.trim() || '',
        proposedPrice: proposedPrice ? Number(proposedPrice) : null,
        attachments: attachments || []
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    // Mettre à jour le devis pour que updatedAt soit mis à jour (et donc remonter dans la liste)
    const updateData: any = {}
    if (quote.status === 'PENDING') {
      updateData.status = 'NEGOTIATING'
    }
    // Toujours mettre à jour pour que updatedAt soit rafraîchi
    await prisma.quote.update({
      where: { id: params.id },
      data: updateData
    })

    // Si un prix est proposé, mettre à jour le devis
    if (proposedPrice && Number(proposedPrice) > 0) {
      await prisma.quote.update({
        where: { id: params.id },
        data: {
          proposedPrice: Number(proposedPrice),
          status: 'PRICE_PROPOSED'
        }
      })
    }

    // Formater la réponse
    const formattedMessage = {
      id: newMessage.id,
      message: newMessage.message,
      attachments: newMessage.attachments,
      proposedPrice: newMessage.proposedPrice ? parseFloat(newMessage.proposedPrice.toString()) : null,
      createdAt: newMessage.createdAt,
      isAdminReply: newMessage.sender.role === 'ADMIN' || newMessage.sender.role === 'STAFF',
      sender: newMessage.sender
    }

    return NextResponse.json(formattedMessage)

  } catch (error) {
    console.error('Erreur lors de l\'ajout du message:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
