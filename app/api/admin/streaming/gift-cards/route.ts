import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireStaff } from '@/lib/auth'
import { generateRandomCode } from '@/lib/utils'

// GET - Récupérer toutes les cartes cadeaux
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const platformId = searchParams.get('platformId')
    const status = searchParams.get('status')

    // Construire les conditions de filtrage
    const whereConditions: any = {}

    // Si platformId est fourni, filtrer par plateforme
    if (platformId) {
      // Vérifier si la plateforme existe
      const platform = await prisma.platform.findUnique({
        where: { id: platformId }
      })

      if (!platform) {
        return NextResponse.json(
          { error: 'Plateforme non trouvée' },
          { status: 404 }
        )
      }

      whereConditions.platformId = platformId
      
      // Pour la récupération par plateforme spécifique (pour recharge), 
      // retourner seulement les cartes actives et disponibles
      whereConditions.status = 'ACTIVE'
      whereConditions.usedById = null
      whereConditions.usedAt = null
      whereConditions.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }

    // Si status est fourni, filtrer par statut
    if (status && !platformId) {
      whereConditions.status = status
    }

    // Récupérer les cartes cadeaux
    const giftCards = await prisma.giftCard.findMany({
      where: whereConditions,
      include: {
        platform: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        },
        usedBy: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(giftCards)

  } catch (error) {
    console.error('Erreur lors de la récupération des cartes cadeaux:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des cartes cadeaux' },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle carte cadeau
export async function POST(request: NextRequest) {
  try {
    // En production: const user = await requireStaff()
    
    const data = await request.json()
    const { amount, currency, platformId, expiresAt } = data

    // Générer un code unique
    let code: string
    let isCodeUnique = false
    do {
      code = generateRandomCode()
      const existingCard = await prisma.giftCard.findUnique({
        where: { code }
      })
      isCodeUnique = !existingCard
    } while (!isCodeUnique)

    const giftCard = await prisma.giftCard.create({
      data: {
        code,
        amount,
        currency,
        platformId,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        platform: {
          select: {
            name: true,
            logo: true
          }
        }
      }
    })

    return NextResponse.json(giftCard)
  } catch (error) {
    console.error('Erreur lors de la création de la carte cadeau:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 