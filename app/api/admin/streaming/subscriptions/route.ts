import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma, PrismaClient } from '@prisma/client'
import { generateOrderNumber } from '@/lib/utils'

export async function GET() {
  try {
    const subscriptions = await prisma.subscription.findMany({
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
            maxProfiles: true,
            maxUsers: true,
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
                type: true,
              },
            },
          },
        },
        subscriptionAccounts: {
          include: {
            account: {
              include: {
                platform: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                    hasProfiles: true,
                  }
                }
              }
            },
          },
        },
        accountProfiles: {
          select: {
            id: true,
            name: true,
            profileSlot: true,
            pin: true,
            isAssigned: true,
            accountId: true,
            account: {
              select: {
                username: true,
                email: true,
                id: true,
              }
            }
          }
        },
        Profile: {
          select: {
            id: true,
            name: true,
            profileSlot: true,
            accountId: true,
          }
        },
        UserSubscription: {
          include: {
            userProfiles: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Formater les dates pour la serialisation JSON
    const formattedSubscriptions = subscriptions.map((subscription: any) => ({
      ...subscription,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedSubscriptions)
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la récupération des abonnements.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validation des données requises
    if (!data.userId || !data.offerId || !data.startDate || !data.endDate) {
      return NextResponse.json(
        { message: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Récupération de l'offre
    const offer = await prisma.offer.findUnique({
      where: { id: data.offerId },
      include: {
        platformOffers: {
          include: {
            platform: true,
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json(
        { message: 'Offre non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier les données des plateformes
    if (!data.platformAccounts || !Array.isArray(data.platformAccounts) || data.platformAccounts.length === 0) {
      return NextResponse.json(
        { message: 'Aucune plateforme ou compte spécifié' },
        { status: 400 }
      )
    }

    // Récupérer le dernier numéro de commande
    const lastOrder = await prisma.order.findFirst({
      where: {
        orderNumber: {
          not: null
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        orderNumber: true
      }
    });

    // Générer le nouveau numéro de commande
    const orderNumber = generateOrderNumber(lastOrder?.orderNumber, 'QUOTE');

    // Transactions pour créer l'abonnement et la commande
    const result = await prisma.$transaction(
      async (tx) => {
        // Création de la commande
        const order = await tx.order.create({
          data: {
            userId: data.userId,
            orderNumber,
            status: 'QUOTE',
            total: Number(offer.price),
            items: {
              create: {
                quantity: 1,
                unitPrice: Number(offer.price),
                totalPrice: Number(offer.price),
                itemType: 'OFFER',
                offer: {
                  connect: {
                    id: offer.id
                  }
                },
                metadata: {
                  type: 'subscription',
                  startDate: data.startDate,
                  endDate: data.endDate,
                  autoRenew: data.autoRenew || false,
                  platformAccounts: data.platformAccounts
                }
              }
            }
          }
        });

        // Création de l'abonnement initial
        const newSubscription = await tx.subscription.create({
          data: {
            userId: data.userId,
            offerId: data.offerId,
            orderId: order.id,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            status: 'PENDING',
            autoRenew: data.autoRenew || false,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
              },
            },
            offer: true,
            platformOffer: true,
          },
        });

        // Créer les relations avec les comptes
        for (const accountConfig of data.platformAccounts) {
          const { platformOfferId, accountId, profileIds } = accountConfig;

          // Vérifier que le platformOfferId existe dans l'offre
          const platformOffer = offer.platformOffers.find((po: { id: string }) => po.id === platformOfferId);
          if (!platformOffer) {
            throw new Error(`PlatformOffer ${platformOfferId} n'appartient pas à l'offre ${offer.id}`);
          }

          // Créer la relation subscription-account
          await tx.subscriptionAccount.create({
            data: {
              subscriptionId: newSubscription.id,
              accountId: accountId,
            },
          });

          // Pour chaque profil sélectionné
          for (const profileId of profileIds) {
            // Marquer le profil comme assigné
            await tx.accountProfile.update({
              where: { id: profileId },
              data: { 
                isAssigned: true,
                subscriptionId: newSubscription.id
              },
            });
          }
        }

        // Récupérer l'abonnement complet avec toutes ses relations
        const completeSubscription = await tx.subscription.findUnique({
          where: {
            id: newSubscription.id,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
              },
            },
            subscriptionAccounts: {
              include: {
                account: true
              }
            },
            offer: true,
            platformOffer: true,
            order: {
              include: {
                items: true
              }
            }
          },
        });

        if (!completeSubscription) {
          throw new Error("Impossible de récupérer l'abonnement créé");
        }

        return completeSubscription;
      },
      {
        timeout: 10000,
        maxWait: 15000,
      }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { message: error.message || 'Une erreur est survenue lors de la création de l\'abonnement.' },
      { status: 500 }
    )
  }
} 

