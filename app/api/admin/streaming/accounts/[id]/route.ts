import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireStaff } from '@/lib/auth'

// GET - Récupérer un compte spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const account = await db.account.findUnique({
      where: { id: params.id },
      include: {
        platform: true,
        accountProfiles: {
          include: {
            subscription: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Compte non trouvé' },
        { status: 404 }
      )
    }

    // Charger les offres fournisseur séparément
    const providerOffers = await db.$queryRaw`
      SELECT * FROM "PlatformProviderOffer"
      WHERE "platformId" = ${account.platformId}
    `

    const response = {
      ...account,
      platform: {
        ...account.platform,
        providerOffers
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erreur lors de la récupération du compte:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération du compte' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un compte
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()

    if (!data.username || !data.password) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    const updateData = {
      username: data.username,
      email: data.email || null,
      password: data.password,
      status: data.status || 'ACTIVE',
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    } as any

    // Gérer la mise à jour de l'offre fournisseur
    if (data.providerOfferId) {
      updateData.providerOffer = {
        connect: { id: data.providerOfferId }
      }
    } else {
      updateData.providerOffer = {
        disconnect: true
      }
    }

    const updatedAccount = await db.account.update({
      where: { id: params.id },
      data: updateData,
      include: {
        platform: true,
        accountProfiles: {
          include: {
            subscription: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedAccount)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du compte:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour du compte' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour partiellement un compte (ex: statut)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()

    // Vérifier si le compte existe
    const existingAccount = await db.account.findUnique({
      where: { id: params.id },
      include: {
        accountProfiles: true
      }
    })

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Compte non trouvé' },
        { status: 404 }
      )
    }

    // Si on essaie de rendre le compte disponible alors que tous les profils sont assignés
    if (
      data.availability === true &&
      existingAccount.accountProfiles.length > 0 &&
      existingAccount.accountProfiles.every(profile => profile.isAssigned)
    ) {
      return NextResponse.json(
        { error: 'Impossible de rendre le compte disponible car tous les profils sont assignés' },
        { status: 400 }
      )
    }

    const updatedAccount = await db.account.update({
      where: { id: params.id },
      data,
      include: {
        platform: true,
        accountProfiles: {
          include: {
            subscription: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    // Charger les offres fournisseur séparément
    const providerOffers = await db.$queryRaw`
      SELECT * FROM "PlatformProviderOffer"
      WHERE "platformId" = ${updatedAccount.platformId}
    `

    const response = {
      ...updatedAccount,
      platform: {
        ...updatedAccount.platform,
        providerOffers
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du compte:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour du compte' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un compte
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }
    
    // Vérifier si le compte existe
    const existingAccount = await db.account.findUnique({
      where: { id: params.id },
      include: {
        accountProfiles: true,
        subscriptionAccounts: true
      }
    })

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Compte non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si le compte a des abonnements actifs
    if (existingAccount.subscriptionAccounts.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un compte qui a des abonnements actifs' },
        { status: 400 }
      )
    }

    // Supprimer d'abord les profils
    if (existingAccount.accountProfiles.length > 0) {
      await db.accountProfile.deleteMany({
        where: { accountId: params.id }
      })
    }

    // Supprimer le compte
    await db.account.delete({
      where: { id: params.id }
    })

    return NextResponse.json(
      { message: 'Compte supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la suppression du compte' },
      { status: 500 }
    )
  }
} 