import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { action, price, message: actionMessage } = await request.json()
    const quoteId = params.id

    // Récupérer le devis avec les messages pour compter les propositions
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        messages: {
          where: {
            proposedPrice: { not: null }
          },
          orderBy: { createdAt: 'asc' }
        },
        product: true,
        service: true
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Compter le nombre de propositions existantes
    const proposalCount = quote.messages.filter(msg => msg.proposedPrice !== null).length
    const maxProposals = 3
    const basePrice = quote.product?.price || quote.service?.price || 0

    let updatedQuote
    let systemMessage = ''

    switch (action) {
      case 'accept':
        // Accepter la proposition
        updatedQuote = await prisma.quote.update({
          where: { id: quoteId },
          data: {
            status: 'ACCEPTED',
            finalPrice: price || quote.proposedPrice,
            updatedAt: new Date()
          }
        })

        systemMessage = `✅ Proposition acceptée ! Prix final: ${(price || quote.proposedPrice || 0).toLocaleString()} Ar`
        break

      case 'reject':
        // Rejeter la proposition
        updatedQuote = await prisma.quote.update({
          where: { id: quoteId },
          data: {
            status: 'REJECTED',
            updatedAt: new Date()
          }
        })

        systemMessage = `❌ Proposition refusée. ${proposalCount >= maxProposals ? 'Retour au prix du produit.' : 'Vous pouvez faire une nouvelle proposition.'}`
        break

      case 'counter':
        // Faire une contre-proposition
        if (proposalCount >= maxProposals) {
          // Après 3 propositions, revenir au prix du produit
          updatedQuote = await prisma.quote.update({
            where: { id: quoteId },
            data: {
              status: 'REJECTED',
              proposedPrice: basePrice,
              updatedAt: new Date()
            }
          })

          systemMessage = `⚠️ Limite de ${maxProposals} propositions atteinte. Retour au prix du produit: ${basePrice.toLocaleString()} Ar`
        } else {
          // Contre-proposition normale
          updatedQuote = await prisma.quote.update({
            where: { id: quoteId },
            data: {
              status: 'NEGOTIATING',
              proposedPrice: price,
              updatedAt: new Date()
            }
          })

          systemMessage = `💰 Contre-proposition: ${price.toLocaleString()} Ar`
        }
        break

      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }

    // Créer un message système avec la contre-proposition si nécessaire
    if (action === 'counter' && proposalCount < maxProposals) {
      await prisma.quoteMessage.create({
        data: {
          quoteId: quoteId,
          message: actionMessage || systemMessage,
          senderId: session.user.id,
          proposedPrice: price,
          isSystemMessage: false
        }
      })
    } else {
      // Message système pour les autres actions
      await prisma.quoteMessage.create({
        data: {
          quoteId: quoteId,
          message: systemMessage,
          senderId: session.user.id,
          isSystemMessage: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
      proposalCount: proposalCount + (action === 'counter' && proposalCount < maxProposals ? 1 : 0)
    })

  } catch (error) {
    console.error('❌ Erreur lors de l\'action rapide:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}


