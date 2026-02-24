import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer les détails d'un devis avec ses messages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const quote = await prisma.quote.findUnique({
      where: {
        id: params.id,
        userId: session.user.id // S'assurer que l'utilisateur peut seulement voir ses propres devis
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            pricingType: true,
            duration: true
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Convertir les champs Decimal en nombres pour la sérialisation JSON
    const serializedQuote = {
      ...quote,
      budget: quote.budget ? parseFloat(quote.budget.toString()) : null,
      proposedPrice: quote.proposedPrice ? parseFloat(quote.proposedPrice.toString()) : null,
      finalPrice: quote.finalPrice ? parseFloat(quote.finalPrice.toString()) : null,
      messages: quote.messages.map(message => ({
        ...message,
        proposedPrice: message.proposedPrice ? parseFloat(message.proposedPrice.toString()) : null
      }))
    }

    return NextResponse.json(serializedQuote)
  } catch (error) {
    console.error('Erreur lors de la récupération du devis:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// Fonction pour ajouter le service au panier
async function addServiceToCart(userId: string, serviceId: string, serviceName: string, finalPrice: number, quoteId: string) {
  try {
    // Obtenir ou créer un panier pour l'utilisateur
    let cart = await prisma.cart.findFirst({
      where: { 
        userId,
        expiresAt: { gt: new Date() }
      }
    })

    if (!cart) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 jours pour les utilisateurs connectés

      cart = await prisma.cart.create({
        data: {
          userId,
          expiresAt
        }
      })
    }

    // Vérifier si le service existe déjà dans le panier
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        type: 'service',
        itemId: serviceId
      }
    })

    if (existingItem) {
      // Mettre à jour le prix si différent (prix négocié)
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { 
          price: finalPrice,
          updatedAt: new Date()
        }
      })
    } else {
      // Ajouter le service au panier
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          type: 'service',
          itemId: serviceId,
          name: serviceName,
          price: finalPrice,
          quantity: 1,
          data: {
            fromQuote: true,
            quoteId: quoteId
          }
        }
      })
    }

    return true
  } catch (error) {
    console.error('Erreur lors de l\'ajout au panier:', error)
    return false
  }
}

// PATCH - Mettre à jour le statut d'un devis (accepter/refuser)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { status, finalPrice } = await request.json()

    // Vérifier que le devis existe et appartient à l'utilisateur
    const existingQuote = await prisma.quote.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            pricingType: true
          }
        }
      }
    })

    if (!existingQuote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Vérifier que le statut est valide
    const validStatuses = ['ACCEPTED', 'REJECTED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    const finalPriceValue = finalPrice ? parseFloat(finalPrice) : (existingQuote.proposedPrice ? parseFloat(existingQuote.proposedPrice.toString()) : null)

    // Mettre à jour le devis
    const updatedQuote = await prisma.quote.update({
      where: {
        id: params.id
      },
      data: {
        status: status,
        finalPrice: finalPriceValue,
        updatedAt: new Date()
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            pricingType: true
          }
        }
      }
    })

    // Si le devis est accepté, ajouter le service au panier
    if (status === 'ACCEPTED' && finalPriceValue) {
      const addedToCart = await addServiceToCart(
        session.user.id,
        existingQuote.service.id,
        existingQuote.service.name,
        finalPriceValue,
        params.id
      )

      if (!addedToCart) {
        console.warn('Impossible d\'ajouter le service au panier pour le devis', params.id)
      }
    }

    // Convertir les champs Decimal en nombres pour la sérialisation JSON
    const serializedQuote = {
      ...updatedQuote,
      budget: updatedQuote.budget ? parseFloat(updatedQuote.budget.toString()) : null,
      proposedPrice: updatedQuote.proposedPrice ? parseFloat(updatedQuote.proposedPrice.toString()) : null,
      finalPrice: updatedQuote.finalPrice ? parseFloat(updatedQuote.finalPrice.toString()) : null,
      addedToCart: status === 'ACCEPTED' && finalPriceValue ? true : false
    }

    return NextResponse.json(serializedQuote)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du devis:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
} 