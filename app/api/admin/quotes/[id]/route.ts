import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer un devis spécifique (admin seulement)
export async function GET(
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

    const quote = await prisma.quote.findUnique({
      where: {
        id: params.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
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
              select: {
                path: true,
                alt: true
              },
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
              select: {
                path: true,
                alt: true
              },
              take: 1
            }
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Convertir les champs Decimal en nombres - VERSION SÉCURISÉE
    const formattedQuote = {
      ...quote,
      budget: quote.budget ? parseFloat(quote.budget.toString()) : null,
      finalPrice: quote.finalPrice ? parseFloat(quote.finalPrice.toString()) : null,
      proposedPrice: quote.proposedPrice ? parseFloat(quote.proposedPrice.toString()) : null,
      service: quote.service ? {
        ...quote.service,
        price: quote.service.price ? parseFloat(quote.service.price.toString()) : null
      } : null,
      product: quote.product ? {
        ...quote.product,
        price: quote.product.price ? parseFloat(quote.product.price.toString()) : null
      } : null,
      messages: quote.messages.map(message => ({
        id: message.id,
        message: message.message,
        attachments: message.attachments,
        createdAt: message.createdAt,
        isAdminReply: message.sender.role === 'ADMIN' || message.sender.role === 'STAFF',
        sender: message.sender
      }))
    }

    return NextResponse.json(formattedQuote)

  } catch (error) {
    console.error('Erreur lors de la récupération du devis:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// PATCH - Mettre à jour un devis (admin seulement)
export async function PATCH(
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
    const { status, proposedPrice, finalPrice } = body

    // Vérifier que le devis existe
    const existingQuote = await prisma.quote.findUnique({
      where: { id: params.id }
    })

    if (!existingQuote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Préparer les données à mettre à jour
    const updateData: any = {}

    if (status) {
      updateData.status = status
    }

    if (proposedPrice !== undefined) {
      updateData.proposedPrice = proposedPrice
    }

    if (finalPrice !== undefined) {
      updateData.finalPrice = finalPrice
    }

    // Si on accepte le devis, copier le prix proposé vers le prix final
    if (status === 'ACCEPTED' && existingQuote.proposedPrice && !finalPrice) {
      updateData.finalPrice = existingQuote.proposedPrice
    }

    const updatedQuote = await prisma.quote.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
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
              select: {
                path: true,
                alt: true
              },
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
              select: {
                path: true,
                alt: true
              },
              take: 1
            }
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    // Convertir les champs Decimal en nombres - VERSION SÉCURISÉE
    const formattedQuote = {
      ...updatedQuote,
      budget: updatedQuote.budget ? parseFloat(updatedQuote.budget.toString()) : null,
      finalPrice: updatedQuote.finalPrice ? parseFloat(updatedQuote.finalPrice.toString()) : null,
      proposedPrice: updatedQuote.proposedPrice ? parseFloat(updatedQuote.proposedPrice.toString()) : null,
      service: updatedQuote.service ? {
        ...updatedQuote.service,
        price: updatedQuote.service.price ? parseFloat(updatedQuote.service.price.toString()) : null
      } : null,
      product: updatedQuote.product ? {
        ...updatedQuote.product,
        price: updatedQuote.product.price ? parseFloat(updatedQuote.product.price.toString()) : null
      } : null,
      messages: updatedQuote.messages.map(message => ({
        id: message.id,
        message: message.message,
        attachments: message.attachments,
        createdAt: message.createdAt,
        isAdminReply: message.sender.role === 'ADMIN' || message.sender.role === 'STAFF',
        sender: message.sender
      }))
    }

    return NextResponse.json(formattedQuote)

  } catch (error) {
    console.error('Erreur lors de la mise à jour du devis:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
} 