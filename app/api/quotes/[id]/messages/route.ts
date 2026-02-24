import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Ajouter un message à un devis
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`📝 API POST /api/quotes/${params.id}/messages appelée`)
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('❌ Pas de session utilisateur')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    console.log(`✅ Session utilisateur: ${session.user.email}`)

    const body = await request.json()
    console.log(`📦 Body reçu:`, body)
    
    const { message, proposedPrice, attachments } = body

    // Vérifier qu'au moins un contenu est fourni
    const hasMessage = message && message.trim().length > 0
    const hasPrice = proposedPrice && !isNaN(parseFloat(proposedPrice))
    const hasAttachments = attachments && Array.isArray(attachments) && attachments.length > 0

    console.log(`🔍 Vérifications:`, { hasMessage, hasPrice, hasAttachments })

    if (!hasMessage && !hasPrice && !hasAttachments) {
      console.log('❌ Aucun contenu fourni')
      return NextResponse.json({ 
        error: 'Veuillez fournir un message, un prix proposé ou joindre des fichiers' 
      }, { status: 400 })
    }

    // Vérifier que le devis existe
    console.log(`🔍 Recherche du devis: ${params.id}`)
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { id: true, role: true }
        }
      }
    })

    if (!quote) {
      console.log('❌ Devis non trouvé')
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    console.log(`✅ Devis trouvé: ${quote.id}`)

    // Vérifier les permissions
    const isOwner = quote.userId === session.user.id
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'STAFF'

    console.log(`🔍 Permissions:`, { isOwner, isAdmin, userId: session.user.id, quoteUserId: quote.userId })

    if (!isOwner && !isAdmin) {
      console.log('❌ Accès refusé')
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Créer le message
    console.log(`📝 Création du message...`)
    const quoteMessage = await prisma.quoteMessage.create({
      data: {
        quoteId: params.id,
        senderId: session.user.id,
        message: message?.trim() || '',
        proposedPrice: proposedPrice ? parseFloat(proposedPrice) : null,
        attachments: attachments || []
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    })

    console.log(`✅ Message créé: ${quoteMessage.id}`)

    // Mettre à jour le statut du devis si nécessaire
    // Toujours mettre à jour pour que updatedAt soit rafraîchi et remonter dans la liste
    let updatedStatus = quote.status
    const updateData: any = {}
    
    if (proposedPrice && isAdmin) {
      updatedStatus = 'PRICE_PROPOSED'
      updateData.status = updatedStatus
      updateData.proposedPrice = parseFloat(proposedPrice)
    } else if (quote.status === 'PENDING') {
      updatedStatus = 'NEGOTIATING'
      updateData.status = updatedStatus
    }
    
    // Toujours mettre à jour pour rafraîchir updatedAt
    await prisma.quote.update({
      where: { id: params.id },
      data: updateData
    })

    // Convertir les champs Decimal en nombres pour la sérialisation JSON
    const serializedMessage = {
      ...quoteMessage,
      proposedPrice: quoteMessage.proposedPrice ? parseFloat(quoteMessage.proposedPrice.toString()) : null
    }

    return NextResponse.json(serializedMessage, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du message:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
} 