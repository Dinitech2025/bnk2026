import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { giftCardIds, expiresAt } = data

    // Vérifier si le compte existe
    const account = await prisma.account.findUnique({
      where: { id: params.id },
      include: {
        platform: true,
        accountProfiles: true
      }
    })

    if (!account) {
      return NextResponse.json(
        { message: 'Compte non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si toutes les cartes cadeaux existent et sont disponibles
    const giftCards = await prisma.giftCard.findMany({
      where: { 
        id: { in: giftCardIds },
        status: 'ACTIVE',
        platformId: account.platformId
      }
    })

    if (giftCards.length !== giftCardIds.length) {
      return NextResponse.json(
        { message: 'Une ou plusieurs cartes cadeaux sont invalides ou déjà utilisées' },
        { status: 400 }
      )
    }

    // Mettre à jour le compte et les cartes cadeaux dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Vérifier si la plateforme utilise des cartes cadeaux
      const platformResult = await tx.$queryRaw<{ hasGiftCards: boolean }[]>`
        SELECT "hasGiftCards" FROM "Platform" WHERE id = ${account.platformId}
      `
      const hasGiftCards = platformResult[0]?.hasGiftCards || false

      // Déterminer la date d'expiration
      let expirationDate = data.expiresAt ? new Date(data.expiresAt) : null
      
      if (hasGiftCards && !expirationDate) {
        // Pour les plateformes avec cartes cadeaux, définir une durée par défaut
        const defaultDuration = 30 // jours
        expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + defaultDuration)
      }

      // Déterminer le statut en fonction de la date d'expiration
      const now = new Date()
      const isActive = expirationDate ? expirationDate > now : false
      const status = isActive ? 'ACTIVE' : 'INACTIVE'

      // Déterminer la disponibilité
      let isAvailable = false
      if (hasGiftCards) {
        // Pour les plateformes avec cartes cadeaux, disponible si actif
        isAvailable = isActive
      } else {
        // Pour les autres plateformes, vérifier aussi les profils
        const hasUnassignedProfiles = !account.accountProfiles.length || 
          account.accountProfiles.some(profile => !profile.isAssigned)
        isAvailable = isActive && hasUnassignedProfiles
      }

      // Mettre à jour le compte avec SQL brut
      await tx.$executeRaw`
        UPDATE "Account" 
        SET 
          status = ${status},
          "expiresAt" = ${expirationDate},
          availability = ${isAvailable}
        WHERE id = ${params.id}
      `

      // Mettre à jour chaque carte cadeau individuellement
      const updatedCards = await Promise.all(giftCards.map(card => 
        tx.giftCard.update({
          where: { id: card.id },
          data: {
            status: 'USED',
            usedAt: new Date(),
            usedById: account.id
          }
        })
      ))

      // Récupérer le compte mis à jour avec tous les détails
      const finalAccount = await tx.account.findUnique({
        where: { id: params.id },
        include: {
          platform: true,
          accountProfiles: true
        }
      })

      return {
        account: finalAccount,
        updatedGiftCards: updatedCards
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur lors de l\'activation du compte:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 
 
 