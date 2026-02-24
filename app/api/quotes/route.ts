import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Lister les devis de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const quotes = await prisma.quote.findMany({
      where: {
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
            createdAt: 'desc'
          },
          take: 5 // Récupérer les 5 derniers messages pour avoir plus de contexte
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Convertir les champs Decimal en nombres pour la sérialisation JSON
    const serializedQuotes = quotes.map(quote => ({
      ...quote,
      budget: quote.budget ? parseFloat(quote.budget.toString()) : null,
      proposedPrice: quote.proposedPrice ? parseFloat(quote.proposedPrice.toString()) : null,
      finalPrice: quote.finalPrice ? parseFloat(quote.finalPrice.toString()) : null,
      messages: quote.messages.map(message => ({
        ...message,
        proposedPrice: message.proposedPrice ? parseFloat(message.proposedPrice.toString()) : null
      }))
    }))

    return NextResponse.json(serializedQuotes)
  } catch (error) {
    console.error('Erreur lors de la récupération des devis:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// POST - Créer un nouveau devis
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { serviceId, description, budget, attachments } = await request.json()

    // Vérifier que le service existe et nécessite un devis
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        name: true,
        pricingType: true,
        requiresQuote: true
      }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service non trouvé' }, { status: 404 })
    }

    if (service.pricingType !== 'QUOTE_REQUIRED' && !service.requiresQuote) {
      return NextResponse.json({ error: 'Ce service ne nécessite pas de devis' }, { status: 400 })
    }

    // Vérifier s'il n'y a pas déjà un devis en cours pour ce service
    const existingQuote = await prisma.quote.findFirst({
      where: {
        userId: session.user.id,
        serviceId: serviceId,
        status: {
          in: ['PENDING', 'NEGOTIATING', 'PRICE_PROPOSED']
        }
      }
    })

    if (existingQuote) {
      return NextResponse.json({ error: 'Vous avez déjà un devis en cours pour ce service' }, { status: 400 })
    }

    // Créer le devis
    const quote = await prisma.quote.create({
      data: {
        userId: session.user.id,
        serviceId: serviceId,
        description: description,
        budget: budget ? parseFloat(budget) : null,
        status: 'PENDING',
        attachments: attachments || []
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

    // Convertir les champs Decimal en nombres pour la sérialisation JSON
    const serializedQuote = {
      ...quote,
      budget: quote.budget ? parseFloat(quote.budget.toString()) : null,
      proposedPrice: quote.proposedPrice ? parseFloat(quote.proposedPrice.toString()) : null,
      finalPrice: quote.finalPrice ? parseFloat(quote.finalPrice.toString()) : null
    }

    return NextResponse.json(serializedQuote, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du devis:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
} 