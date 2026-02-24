import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'

// Désactiver le cache pour cette API
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    console.log('GET /api/admin/orders - Récupération des commandes');
    
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        billingAddress: true,
        shippingAddress: true,
        items: {
          include: {
            offer: {
              select: {
                id: true,
                name: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payments: {
          where: {
            status: 'COMPLETED'
          },
          select: {
            id: true,
            amount: true,
            currency: true,
            method: true,
            provider: true,
            createdAt: true
          }
        },
        subscriptions: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            offer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`${orders.length} commandes trouvées`);
    
    // Formater les dates pour la serialisation JSON
    const formattedOrders = orders.map((order: any) => ({
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      subscriptions: order.subscriptions.map((sub: any) => ({
        ...sub,
        startDate: sub.startDate.toISOString(),
        endDate: sub.endDate.toISOString(),
      })),
    }))

    const response = NextResponse.json(formattedOrders)
    
    // Headers pour désactiver le cache
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la récupération des commandes.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log('=== DÉBUT CRÉATION COMMANDE ===');
    const data = await request.json()
    console.log('Données reçues:', JSON.stringify(data, null, 2));

    // Validation des données minimales requises
    if (!data.userId || !data.items || !Array.isArray(data.items) || data.items.length === 0) {
      console.error('Validation error: userId or items missing or invalid');
      return NextResponse.json(
        { message: 'Données invalides: userId et items sont requis' },
        { status: 400 }
      )
    }
    
    // Vérifier si l'utilisateur existe
    console.log('👤 Vérification de l\'utilisateur:', data.userId);
    const userExists = await prisma.user.findUnique({
      where: { id: data.userId },
    })
    
    if (!userExists) {
      console.error('❌ Utilisateur non trouvé:', data.userId);
      return NextResponse.json(
        { message: `Utilisateur non trouvé: ${data.userId}` },
        { status: 404 }
      )
    }
    
    console.log('✅ Utilisateur trouvé:', userExists.email);

    console.log('✅ Validation des données de base réussie');
    
    // Calcul du total avec réductions
    console.log('📊 Début du calcul des totaux avec réductions');
    let itemsSubtotal = 0
    const orderItems = data.items.map((item: any) => {
      // Calculer le prix total de l'article (avec réduction par article)
      const basePrice = Number(item.unitPrice) * item.quantity
      let itemTotalPrice = basePrice
      let itemDiscountAmount = 0
      
      // Appliquer la réduction par article si elle existe
      if (item.discountType && item.discountValue) {
        if (item.discountType === 'PERCENTAGE') {
          itemDiscountAmount = (basePrice * Number(item.discountValue)) / 100
        } else if (item.discountType === 'FIXED') {
          itemDiscountAmount = Math.min(Number(item.discountValue), basePrice)
        }
        itemTotalPrice = Math.max(0, basePrice - itemDiscountAmount)
      }
      
      itemsSubtotal += itemTotalPrice
      
      const orderItem: any = {
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotalPrice,
        itemType: item.itemType,
      }
      
      // Sauvegarder les métadonnées si elles existent (pour les produits importés)
      if (item.metadata) {
        orderItem.metadata = typeof item.metadata === 'string' ? item.metadata : JSON.stringify(item.metadata);
      }

      // Ajouter les champs de réduction seulement s'ils existent
      if (item.discountType && item.discountType !== 'NONE') {
        orderItem.discountType = item.discountType;
        orderItem.discountValue = item.discountValue ? Number(item.discountValue) : null;
        orderItem.discountAmount = itemDiscountAmount > 0 ? itemDiscountAmount : null;
      }
      
      // Ajouter les IDs spécifiques selon le type d'item
      if (item.productId) {
        orderItem.productId = item.productId;
      } 
      if (item.serviceId) {
        orderItem.serviceId = item.serviceId;
      }
      if (item.offerId) {
        orderItem.offerId = item.offerId;
      }
      
      return orderItem;
    })

    // Calculer la réduction globale
    let globalDiscountAmount = 0
    if (data.globalDiscount && data.globalDiscount.type && data.globalDiscount.value) {
      if (data.globalDiscount.type === 'PERCENTAGE') {
        globalDiscountAmount = (itemsSubtotal * Number(data.globalDiscount.value)) / 100
      } else if (data.globalDiscount.type === 'FIXED') {
        globalDiscountAmount = Math.min(Number(data.globalDiscount.value), itemsSubtotal)
      }
    }

    // Total final après réduction globale
    const total = Math.max(0, itemsSubtotal - globalDiscountAmount)

    console.log('📊 Calculs terminés:');
    console.log('   - Sous-total articles:', itemsSubtotal);
    console.log('   - Réduction globale:', globalDiscountAmount);
    console.log('   - Total final:', total);
    console.log('📦 Articles préparés:', JSON.stringify(orderItems, null, 2));
    
    // Récupérer le dernier numéro de commande pour générer le suivant
    const currentYear = new Date().getFullYear();
    
    // Trouver le dernier numéro séquentiel utilisé cette année
    const lastOrders = await prisma.order.findMany({
      where: {
        orderNumber: {
          contains: currentYear.toString()
        }
      },
      orderBy: {
        orderNumber: 'desc'
      },
      take: 10 // Prendre les 10 derniers pour être sûr
    });

    // Trouver le plus grand numéro séquentiel
    let maxSequentialNumber = 0;
    for (const order of lastOrders) {
      const match = order.orderNumber?.match(/(?:DEV|CMD)-\d{4}-(\d{4})/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSequentialNumber) {
          maxSequentialNumber = num;
        }
      }
    }

    // Générer le nouveau numéro avec le préfixe approprié
    // Les commandes PENDING utilisent le préfixe DEV (devis), les autres CMD
    const prefix = data.status === 'PENDING' ? `DEV-${currentYear}-` : `CMD-${currentYear}-`;
    const sequentialNumber = maxSequentialNumber + 1;
    const orderNumber = `${prefix}${sequentialNumber.toString().padStart(4, '0')}`;

    console.log('Creating order with:', {
      userId: data.userId,
      orderNumber,
      status: data.status || 'PENDING',
      total
    });

    // Création de la commande avec transaction pour gérer les abonnements
    const result = await prisma.$transaction(async (prismaClient) => {
      try {
        // Créer les adresses si fournies
        let billingAddressId = null;
        let shippingAddressId = null;

        if (data.billingAddress) {
          const billingAddr = await prismaClient.address.create({
            data: {
              userId: data.userId,
              type: 'BILLING',
              street: data.billingAddress.address,
              city: data.billingAddress.city,
              state: data.billingAddress.state || null,
              zipCode: data.billingAddress.postalCode || '',
              country: data.billingAddress.country || 'Madagascar',
              phoneNumber: data.billingAddress.phone || null,
              isDefault: false
            }
          });
          billingAddressId = billingAddr.id;
        }

        if (data.shippingAddress) {
          const shippingAddr = await prismaClient.address.create({
            data: {
              userId: data.userId,
              type: 'SHIPPING',
              street: data.shippingAddress.address,
              city: data.shippingAddress.city,
              state: data.shippingAddress.state || null,
              zipCode: data.shippingAddress.postalCode || '',
              country: data.shippingAddress.country || 'Madagascar',
              phoneNumber: data.shippingAddress.phone || null,
              isDefault: false
            }
          });
          shippingAddressId = shippingAddr.id;
        }

        // Création de la commande de base
        console.log('🗄️ Création de la commande dans la base de données...');
        console.log('📋 Données pour Prisma:', {
          userId: data.userId,
          orderNumber: orderNumber,
          status: data.status || 'PENDING',
          total,
          addressId: shippingAddressId || data.addressId,
          billingAddressId: billingAddressId,
          hasGlobalDiscount: !!(data.globalDiscount && data.globalDiscount.type && data.globalDiscount.type !== 'NONE' && globalDiscountAmount > 0),
          itemsCount: orderItems.length
        });
        
        const order = await prismaClient.order.create({
          data: {
            userId: data.userId,
            orderNumber: orderNumber,
            status: data.status || 'PENDING',
            total,
            addressId: shippingAddressId || data.addressId,
            billingAddressId: billingAddressId,
            // Réduction globale (seulement si elle existe)
            ...(data.globalDiscount && data.globalDiscount.type && data.globalDiscount.type !== 'NONE' && globalDiscountAmount > 0 ? {
              globalDiscountType: data.globalDiscount.type,
              globalDiscountValue: Number(data.globalDiscount.value),
              globalDiscountAmount: globalDiscountAmount,
            } : {}),
            // Sauvegarder le mode de livraison dans les notes pour traçabilité
            notes: data.notes ? 
              `Mode de livraison: ${data.shippingAddress ? 'Livraison à domicile' : 'Retrait au magasin'}\n\n${data.notes}` :
              `Mode de livraison: ${data.shippingAddress ? 'Livraison à domicile' : 'Retrait au magasin'}`,
            items: {
              create: orderItems,
            },
          },
          include: {
            user: true,
            items: {
              include: {
                offer: true,
                product: true,
                service: true,
              },
            },
          },
        })

        console.log('Order created:', order.id)
        
        // Création automatique des abonnements à partir de subscriptionConfigs
        if (data.subscriptionConfigs && Array.isArray(data.subscriptionConfigs) && data.subscriptionConfigs.length > 0) {
          console.log(`Création d'abonnements à partir de subscriptionConfigs: ${data.subscriptionConfigs.length}`);
          
          for (const config of data.subscriptionConfigs) {
            if (!config.offerId) continue;
            
            const subscriptionData: any = {
              userId: data.userId,
              offerId: config.offerId,
              orderId: order.id,
              status: 'ACTIVE',
              startDate: new Date(config.startDate),
              endDate: new Date(config.endDate),
              autoRenew: config.autoRenew || false,
            };
            
            // Si une plateforme spécifique est sélectionnée
            if (config.platformOfferId) {
              subscriptionData.platformOfferId = config.platformOfferId;
            }
            
            // Créer l'abonnement
            const subscription = await prismaClient.subscription.create({
              data: subscriptionData
            });
            
            console.log(`Abonnement créé depuis subscriptionConfigs: ${subscription.id}`);
            
            // Si des comptes et profils ont été sélectionnés
            if (config.platformAccounts && Array.isArray(config.platformAccounts) && config.platformAccounts.length > 0) {
              for (const pa of config.platformAccounts) {
                if (pa.accountId && pa.platformOfferId) {
                  // Créer l'association entre l'abonnement et le compte
                  await prismaClient.subscriptionAccount.create({
                    data: {
                      subscriptionId: subscription.id,
                      accountId: pa.accountId,
                      status: 'ACTIVE'
                    }
                  });
                  
                  console.log(`Association compte-abonnement créée: ${subscription.id} - ${pa.accountId}`);
                  
                  // Assigner les profils sélectionnés
                  if (pa.profileIds && pa.profileIds.length > 0) {
                    // Obtenir les profils du compte
                    const accountProfiles = await prismaClient.accountProfile.findMany({
                      where: {
                        accountId: pa.accountId
                      }
                    });
                    
                    // Mettre à jour chaque profil sélectionné
                    for (const profileId of pa.profileIds) {
                      const profile = accountProfiles.find(p => p.id === profileId);
                      if (profile) {
                        await prismaClient.accountProfile.update({
                          where: { id: profile.id },
                          data: {
                            isAssigned: true,
                            subscriptionId: subscription.id
                          }
                        });
                        console.log(`Profil assigné à l'abonnement: ${profile.id} -> ${subscription.id}`);
                      }
                    }
                  }
                }
              }
            }
          }
        }
        
        // Création automatique des abonnements pour les offres avec subscriptionDetails
        for (const item of data.items) {
          if (item.itemType === 'OFFER' && item.subscriptionDetails) {
            console.log(`Création d'abonnement à partir de item.subscriptionDetails pour l'item: ${item.offerId}`);
            
            // Créer l'abonnement avec le type correct
            const subscription = await prismaClient.subscription.create({
              data: {
                userId: data.userId,
                orderId: order.id,
                status: 'ACTIVE',
                startDate: new Date(item.subscriptionDetails.startDate),
                endDate: new Date(item.subscriptionDetails.endDate),
                autoRenew: item.subscriptionDetails.autoRenew || false,
                platformOfferId: item.subscriptionDetails.platformOfferId,
                offerId: item.offerId
              }
            });
            
            console.log(`Abonnement créé depuis item.subscriptionDetails: ${subscription.id}`);

            // Gestion des comptes et profils sélectionnés
            if (item.subscriptionDetails.platformAccounts && 
                Array.isArray(item.subscriptionDetails.platformAccounts) && 
                item.subscriptionDetails.platformAccounts.length > 0) {
              
              for (const pa of item.subscriptionDetails.platformAccounts) {
                if (pa.accountId && pa.platformOfferId) {
                  // Créer l'association entre l'abonnement et le compte
                  const subscriptionAccount = await prismaClient.subscriptionAccount.create({
                    data: {
                      subscriptionId: subscription.id,
                      accountId: pa.accountId,
                      status: 'ACTIVE'
                    }
                  });
                  
                  console.log(`Association compte-abonnement créée: ${subscription.id} - ${pa.accountId}`);
                  
                  // Assigner les profils sélectionnés
                  if (pa.profileIds && pa.profileIds.length > 0) {
                    // Obtenir les profils du compte
                    const accountProfiles = await prismaClient.accountProfile.findMany({
                      where: {
                        accountId: pa.accountId
                      }
                    });
                    
                    // Mettre à jour chaque profil sélectionné
                    for (const profileId of pa.profileIds) {
                      const profile = accountProfiles.find(p => p.id === profileId);
                      if (profile) {
                        await prismaClient.accountProfile.update({
                          where: { id: profile.id },
                          data: {
                            isAssigned: true,
                            subscriptionId: subscription.id
                          }
                        });
                        console.log(`Profil assigné à l'abonnement: ${profile.id} -> ${subscription.id}`);
                      }
                    }
                  }
                }
              }
            }
          }
        }
        
        return order;
      } catch (innerError) {
        console.error('Error in transaction:', innerError);
        throw innerError;
      }
    },
    {
      timeout: 10000, // Augmenter le timeout à 10 secondes
      maxWait: 15000, // Temps d'attente maximum pour obtenir une connexion
    })

    console.log('Order created successfully:', result.id);
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating order:', error)
    
    // Gestion spécifique des erreurs Prisma
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack)
      return NextResponse.json(
        { message: `Erreur lors de la création de la commande: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { message: 'Une erreur inconnue est survenue lors de la création de la commande.' },
      { status: 500 }
    )
  }
} 
