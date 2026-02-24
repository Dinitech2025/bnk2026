import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Définir authOptions localement pour éviter les problèmes d'import
const authOptions = {
  // Configuration minimale pour les API routes
  // La configuration complète est dans [...nextauth]/route.ts
}

// Schema de validation pour créer un devis
const createQuoteSchema = z.object({
  serviceId: z.string(),
  proposedPrice: z.number().min(0).optional(),
  clientMessage: z.string().optional(),
  quantity: z.number().int().min(1).default(1)
})

// Schema de validation pour mettre à jour un devis (admin)
const updateQuoteSchema = z.object({
  quoteId: z.string(),
  adminPrice: z.number().min(0),
  adminMessage: z.string().optional(),
  status: z.enum(['APPROVED', 'REJECTED']),
  validUntil: z.string().datetime().optional()
})

// POST /api/services/quotes - Créer une demande de devis
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createQuoteSchema.parse(body)

    // Vérifier que le service existe
    const service = await prisma.service.findUnique({
      where: { id: validatedData.serviceId }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier s'il y a déjà une demande en cours pour ce service
    const existingQuote = await prisma.quote.findFirst({
      where: {
        serviceId: validatedData.serviceId,
        userId: session.user.id,
        status: 'PENDING'
      }
    })

    if (existingQuote) {
      return NextResponse.json(
        { error: 'Une demande de devis est déjà en cours pour ce service' },
        { status: 400 }
      )
    }

    // Créer la demande de devis
    const quote = await prisma.quote.create({
      data: {
        serviceId: validatedData.serviceId,
        userId: session.user.id,
        description: validatedData.clientMessage,
        budget: validatedData.proposedPrice,
        status: 'PENDING'
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            pricingType: true
          }
        }
      }
    })

    // TODO: Envoyer notification à l'admin
    
    return NextResponse.json({
      success: true,
      quote,
      message: 'Demande de devis créée avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la création du devis:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// GET /api/services/quotes - Récupérer les devis de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const serviceId = searchParams.get('serviceId')

    const whereClause: any = {
      userId: session.user.id
    }

    if (status) {
      whereClause.status = status
    }

    if (serviceId) {
      whereClause.serviceId = serviceId
    }

    const quotes = await prisma.quote.findMany({
      where: whereClause,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            pricingType: true,
            images: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      quotes
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des devis:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT /api/services/quotes - Mettre à jour un devis (admin uniquement)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès admin requis' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateQuoteSchema.parse(body)

    // Vérifier que le devis existe et est en attente
    const existingQuote = await prisma.quote.findUnique({
      where: { id: validatedData.quoteId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        service: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!existingQuote) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    if (existingQuote.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Ce devis a déjà été traité' },
        { status: 400 }
      )
    }

    // Mettre à jour le devis
    const updatedQuote = await prisma.quote.update({
      where: { id: validatedData.quoteId },
      data: {
        proposedPrice: validatedData.adminPrice,
        status: validatedData.status === 'APPROVED' ? 'ACCEPTED' : validatedData.status,
        finalPrice: validatedData.status === 'APPROVED' ? validatedData.adminPrice : undefined
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    // TODO: Envoyer notification au client
    
    return NextResponse.json({
      success: true,
      quote: updatedQuote,
      message: `Devis ${validatedData.status.toLowerCase()} avec succès`
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour du devis:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 