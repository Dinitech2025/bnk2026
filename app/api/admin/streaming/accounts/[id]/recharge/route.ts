import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { giftCardIds } = await request.json()
    const accountId = params.id

    if (!giftCardIds || !Array.isArray(giftCardIds) || giftCardIds.length === 0) {
      return NextResponse.json({ error: 'Au moins une carte cadeau est requise' }, { status: 400 })
    }

    // Vérifier que le compte existe et récupérer l'offre fournisseur avec SQL brut
    const [accountData] = await prisma.$queryRaw<[{
      id: string;
      platformId: string;
      providerOfferId: string | null;
      expiresAt: Date | null;
    }]>`
      SELECT id, "platformId", "providerOfferId", "expiresAt" 
      FROM "Account" 
      WHERE id = ${accountId}
    `

    if (!accountData) {
      return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 })
    }

    // Récupérer l'offre fournisseur avec SQL brut
    let providerOffer = null
    if (accountData.providerOfferId) {
      const [offerData] = await prisma.$queryRaw<[{
        id: string;
        price: number;
        currency: string;
        name: string;
      }]>`
        SELECT id, price, currency, name
        FROM "PlatformProviderOffer" 
        WHERE id = ${accountData.providerOfferId}
      `
      providerOffer = offerData
    }

    if (!providerOffer) {
      return NextResponse.json({ 
        error: 'Aucune offre fournisseur associée à ce compte. Veuillez d\'abord associer une offre pour pouvoir calculer la recharge.' 
      }, { status: 400 })
    }

    // Vérifier que toutes les cartes cadeaux existent et sont disponibles
    const giftCards = await prisma.giftCard.findMany({
      where: { id: { in: giftCardIds } }
    })

    if (giftCards.length !== giftCardIds.length) {
      return NextResponse.json({ error: 'Une ou plusieurs cartes cadeaux non trouvées' }, { status: 404 })
    }

    // Vérifier que toutes les cartes sont disponibles et de la bonne plateforme
    for (const giftCard of giftCards) {
      if (giftCard.status !== 'ACTIVE' || giftCard.usedById || giftCard.usedAt) {
        return NextResponse.json({ 
          error: `Carte cadeau ${giftCard.code} non disponible` 
        }, { status: 400 })
      }

      if (giftCard.platformId !== accountData.platformId) {
        return NextResponse.json({ 
          error: `La carte cadeau ${giftCard.code} ne correspond pas à la plateforme du compte` 
        }, { status: 400 })
      }

      // Vérifier la date d'expiration de la carte cadeau
      if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
        return NextResponse.json({ 
          error: `Carte cadeau ${giftCard.code} expirée` 
        }, { status: 400 })
      }
    }

    // Calculer le nombre total de jours à ajouter basé sur le prix de l'offre
    const totalAmount = giftCards.reduce((sum, card) => sum + card.amount, 0)
    
    // Calculer les jours : (montant total / prix mensuel) * 30 jours
    const totalDays = Math.floor((totalAmount / providerOffer.price) * 30)
    
    if (totalDays <= 0) {
      return NextResponse.json({ 
        error: `Le montant des cartes cadeaux (${totalAmount} ${giftCards[0].currency}) est insuffisant pour au moins un jour d'abonnement (prix mensuel: ${providerOffer.price} ${providerOffer.currency})` 
      }, { status: 400 })
    }

    // Calculer la nouvelle date d'expiration du compte
    const currentExpiration = accountData.expiresAt || new Date()
    const startDate = new Date(Math.max(currentExpiration.getTime(), new Date().getTime()))
    const newExpiration = new Date(startDate)
    newExpiration.setDate(newExpiration.getDate() + totalDays)

    // Effectuer la transaction pour toutes les cartes
    await prisma.$transaction(async (tx) => {
      // Marquer toutes les cartes cadeaux comme utilisées
      for (const giftCard of giftCards) {
        await tx.giftCard.update({
          where: { id: giftCard.id },
          data: {
            status: 'USED',
            usedAt: new Date(),
            usedById: accountId
          }
        })
      }

      // Mettre à jour la date d'expiration du compte avec SQL brut
      await tx.$executeRaw`
        UPDATE "Account" 
        SET "expiresAt" = ${newExpiration}, status = 'ACTIVE'
        WHERE id = ${accountId}
      `
    })

    return NextResponse.json({ 
      message: 'Compte rechargé avec succès',
      newExpirationDate: newExpiration.toISOString(),
      usedGiftCards: giftCards.length,
      totalAmount: totalAmount,
      currency: providerOffer.currency,
      providerOffer: providerOffer.name,
      monthlyPrice: providerOffer.price,
      totalDaysAdded: totalDays
    })

  } catch (error) {
    console.error('Erreur lors de la recharge:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
} 