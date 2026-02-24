import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: {
        id: params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        offer: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
            durationUnit: true,
          },
        },
        platformOffer: {
          include: {
            platform: {
              select: {
                id: true,
                name: true,
                logo: true,
                hasProfiles: true,
                maxProfilesPerAccount: true,
              },
            },
          },
        },
        subscriptionAccounts: {
          include: {
            account: {
              include: {
                accountProfiles: true,
              },
            },
          },
        },
        accountProfiles: true,
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { message: 'Abonnement non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la récupération de l\'abonnement.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const data = await request.json()
    const subscription = await prisma.subscription.update({
      where: {
        id: params.id,
      },
      data: {
        status: data.status,
        autoRenew: data.autoRenew,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        offer: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
            durationUnit: true,
          },
        },
        platformOffer: {
          include: {
            platform: true,
          },
        },
        subscriptionAccounts: {
          include: {
            account: true,
          },
        },
        accountProfiles: true,
      },
    })

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la mise à jour de l\'abonnement.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Récupérer l'abonnement avec ses profils
    const subscription = await prisma.subscription.findUnique({
      where: {
        id: params.id,
      },
      include: {
        accountProfiles: true,
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { message: 'Abonnement non trouvé' },
        { status: 404 }
      )
    }

    // Libérer les profils assignés
    if (subscription.accountProfiles.length > 0) {
      await prisma.accountProfile.updateMany({
        where: {
          id: {
            in: subscription.accountProfiles.map(profile => profile.id),
          },
        },
        data: {
          isAssigned: false,
          subscriptionId: null,
        },
      })
    }

    // Supprimer l'abonnement
    await prisma.subscription.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json(
      { message: 'Abonnement supprimé avec succès' }
    )
  } catch (error) {
    console.error('Error deleting subscription:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la suppression de l\'abonnement.' },
      { status: 500 }
    )
  }
} 
 
 
 