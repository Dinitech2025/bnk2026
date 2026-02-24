import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 API actions devis appelée pour:', params.id)
    
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { action, data } = await request.json()
    console.log('🎯 Action demandée:', action, data)

    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true, price: true } },
        product: { select: { id: true, name: true, price: true } }
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    const itemName = quote.service?.name || quote.product?.name || 'Article'

    switch (action) {
      case 'accept':
        // Accepter la proposition
        const updatedQuoteAccept = await prisma.quote.update({
          where: { id: params.id },
          data: {
            status: 'ACCEPTED',
            finalPrice: data.finalPrice || quote.proposedPrice,
            updatedAt: new Date()
          }
        })

        // Ajouter un message automatique
        await prisma.quoteMessage.create({
          data: {
            quoteId: params.id,
            message: `✅ Proposition acceptée ! Prix final: ${(data.finalPrice || quote.proposedPrice || 0).toLocaleString()} Ar`,
            senderId: session.user.id,
            isSystemMessage: true
          }
        })

        console.log('✅ Proposition acceptée')
        return NextResponse.json({ 
          message: 'Proposition acceptée',
          quote: updatedQuoteAccept
        })

      case 'reject':
        // Rejeter la proposition
        const updatedQuoteReject = await prisma.quote.update({
          where: { id: params.id },
          data: {
            status: 'REJECTED',
            updatedAt: new Date()
          }
        })

        // Ajouter un message automatique
        await prisma.quoteMessage.create({
          data: {
            quoteId: params.id,
            message: `❌ Proposition refusée. Vous pouvez faire une nouvelle proposition.`,
            senderId: session.user.id,
            isSystemMessage: true
          }
        })

        console.log('❌ Proposition rejetée')
        return NextResponse.json({ 
          message: 'Proposition rejetée',
          quote: updatedQuoteReject
        })

      case 'counter':
        // Faire une contre-proposition
        const updatedQuoteCounter = await prisma.quote.update({
          where: { id: params.id },
          data: {
            status: 'NEGOTIATING',
            updatedAt: new Date()
          }
        })

        // Ajouter le message de contre-proposition (message système)
        await prisma.quoteMessage.create({
          data: {
            quoteId: params.id,
            message: `💰 Nouvelle proposition de prix: ${data.counterPrice.toLocaleString()} Ar pour ${itemName}`,
            senderId: session.user.id,
            isSystemMessage: true,
            metadata: JSON.stringify({
              type: 'counter_proposal',
              counterPrice: data.counterPrice,
              originalPrice: quote.proposedPrice,
              itemName: itemName
            })
          }
        })

        // Ajouter aussi un message personnel de l'admin si fourni
        if (data.message && data.message.trim() && data.message !== `Contre-proposition: ${data.counterPrice.toLocaleString()} Ar pour ${itemName}`) {
          await prisma.quoteMessage.create({
            data: {
              quoteId: params.id,
              message: data.message.trim(),
              senderId: session.user.id,
              isSystemMessage: false
            }
          })
        }

        console.log('💰 Contre-proposition envoyée')
        return NextResponse.json({ 
          message: 'Contre-proposition envoyée',
          quote: updatedQuoteCounter
        })

      case 'mark_read':
        // Marquer les messages comme lus
        await prisma.quoteMessage.updateMany({
          where: {
            quoteId: params.id,
            senderId: { not: session.user.id }, // Pas les messages de l'admin
            readAt: null
          },
          data: {
            readAt: new Date()
          }
        })

        console.log('👁️ Messages marqués comme lus')
        return NextResponse.json({ message: 'Messages marqués comme lus' })

      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Erreur API actions devis:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
