import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log('Commande publique reçue:', JSON.stringify(data, null, 2))

    // Validation des données
    if (!data.customer || !data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json(
        { message: 'Données invalides: customer et items sont requis' },
        { status: 400 }
      )
    }

    const { customer, items, total, paymentMethod, billingAddress, shippingAddress, notes } = data

    // Validation des champs client obligatoires selon le mode
    if (!customer.email && !customer.phone) {
      return NextResponse.json(
        { message: 'Email ou téléphone requis' },
        { status: 400 }
      )
    }

    if (!customer.hasAccount) {
      // Mode création de compte : prénom et nom requis
      if (!customer.firstName || !customer.lastName) {
        return NextResponse.json(
          { message: 'Prénom et nom requis pour la création de compte' },
          { status: 400 }
        )
      }
    }
    // Mode connexion : seuls email et mot de passe sont requis

    // Validation du mot de passe pour les nouveaux comptes
    if (customer.createAccount && !customer.hasAccount && customer.password) {
      if (customer.password.length < 6) {
        return NextResponse.json(
          { message: 'Le mot de passe doit contenir au moins 6 caractères' },
          { status: 400 }
        )
      }
    }

    let accountCreated = false

    // Vérifier ou créer l'utilisateur - rechercher par email ou téléphone
    let user = null
    
    if (customer.email) {
      user = await prisma.user.findUnique({
        where: { email: customer.email }
      })
    } else if (customer.phone) {
      user = await prisma.user.findFirst({
        where: { phone: customer.phone }
      })
    }

    if (!user && customer.createAccount && !customer.hasAccount) {
      // Créer un nouvel utilisateur avec mot de passe
      const hashedPassword = customer.password ? await bcrypt.hash(customer.password, 12) : null
      
      user = await prisma.user.create({
        data: {
          email: customer.email || null,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone || null,
          password: hashedPassword,
          role: 'CLIENT',
          newsletter: customer.newsletter || false
        }
      })
      accountCreated = true
      console.log('Nouvel utilisateur créé avec mot de passe:', user.id)
    } else if (user) {
      // Mettre à jour les informations si nécessaire
      const updateData: any = {}

      // En mode création de compte, mettre à jour toutes les informations
      if (!customer.hasAccount && customer.createAccount) {
        updateData.firstName = customer.firstName
        updateData.lastName = customer.lastName
        updateData.phone = customer.phone
        updateData.newsletter = customer.newsletter || user.newsletter

        // Si l'utilisateur n'a pas de mot de passe et qu'on en fournit un, l'ajouter
        if (!user.password && customer.password) {
          updateData.password = await bcrypt.hash(customer.password, 12)
          console.log('Mot de passe ajouté à un compte existant')
        }
      } else {
        // En mode connexion, ne mettre à jour que la newsletter si fournie
        if (customer.newsletter !== undefined) {
          updateData.newsletter = customer.newsletter
        }
      }

      // Ne faire la mise à jour que s'il y a des changements
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData
        })
        console.log('Utilisateur existant mis à jour:', user.id)
      } else {
        console.log('Utilisateur existant utilisé sans modification:', user.id)
      }
    } else {
      // Cas où l'utilisateur n'existe pas mais qu'on ne veut pas créer de compte
      return NextResponse.json(
        { message: 'Utilisateur introuvable. Veuillez créer un compte.' },
        { status: 404 }
      )
    }

    // Créer les adresses
    let billingAddressId = null
    let shippingAddressId = null

    // Adresse de facturation
    if (billingAddress && billingAddress.city) {
      try {
        const billing = await prisma.address.create({
          data: {
            userId: user.id,
            type: 'BILLING',
            street: billingAddress.street || '',
            city: billingAddress.city,
            zipCode: billingAddress.zipCode || '000',
            country: billingAddress.country || 'Madagascar',
            isDefault: false
          }
        })
        billingAddressId = billing.id
        console.log('Adresse de facturation créée:', billing.id)
      } catch (error) {
        console.log('Erreur lors de la création de l\'adresse de facturation:', error)
      }
    }

    // Adresse de livraison (si différente de facturation)
    if (shippingAddress && shippingAddress.city) {
      // Vérifier si l'adresse de livraison est différente de la facturation
      const isDifferent = billingAddress && (
        shippingAddress.street !== billingAddress.street ||
        shippingAddress.city !== billingAddress.city ||
        shippingAddress.zipCode !== billingAddress.zipCode ||
        shippingAddress.country !== billingAddress.country
      )

      if (isDifferent) {
        try {
          const shipping = await prisma.address.create({
            data: {
              userId: user.id,
              type: 'SHIPPING',
              street: shippingAddress.street || '',
              city: shippingAddress.city,
              zipCode: shippingAddress.zipCode || '000',
              country: shippingAddress.country || 'Madagascar',
              isDefault: false
            }
          })
          shippingAddressId = shipping.id
          console.log('Adresse de livraison créée:', shipping.id)
        } catch (error) {
          console.log('Erreur lors de la création de l\'adresse de livraison:', error)
        }
      } else {
        // Utiliser la même adresse pour la livraison
        shippingAddressId = billingAddressId
        console.log('Adresse de livraison identique à la facturation')
      }
    }

    // Déterminer le statut selon la méthode de paiement AVANT de générer le numéro
    let orderStatus = 'Devis en attente de paiement' // Par défaut: devis en attente de paiement
    
    // Les paiements instantanés sont marqués comme payés
    if (paymentMethod === 'mobile_money' || paymentMethod === 'card') {
      orderStatus = 'Payée' // Paiement instantané reçu
    }
    // Les virements et espèces restent en statut devis

    console.log(`💳 Méthode de paiement: ${paymentMethod} → Statut: ${orderStatus}`)

    // Déterminer le préfixe selon le statut
    const prefix = orderStatus === 'Devis en attente de paiement' ? 'DEV' : 'CMD'

    // Générer le numéro de commande avec le bon préfixe
    const currentYear = new Date().getFullYear()
    const lastOrders = await prisma.order.findMany({
      where: {
        orderNumber: {
          startsWith: `${prefix}-${currentYear}`
        }
      },
      orderBy: {
        orderNumber: 'desc'
      },
      take: 1
    })

    let sequentialNumber = 1
    if (lastOrders.length > 0 && lastOrders[0].orderNumber) {
      const match = lastOrders[0].orderNumber.match(new RegExp(`${prefix}-(\\d{4})-(\\d{4})`))
      if (match) {
        sequentialNumber = parseInt(match[2], 10) + 1
      }
    }

    const orderNumber = `${prefix}-${currentYear}-${sequentialNumber.toString().padStart(4, '0')}`

    console.log(`📋 Numéro généré: ${orderNumber} (préfixe: ${prefix})`)

    // Préparer les items de commande
    const orderItems = []
    let calculatedTotal = 0

    for (const item of items) {
      const unitPrice = Number(item.price)
      const totalPrice = unitPrice * item.quantity
      calculatedTotal += totalPrice

      // Déterminer le type d'item et les IDs
      let itemType = 'PRODUCT'
      let productId = null
      let serviceId = null
      let offerId = null

      if (item.type === 'subscription') {
        itemType = 'OFFER'
        if (item.reservation?.offerId) {
          offerId = item.reservation.offerId
        }
      } else if (item.type === 'service') {
        itemType = 'SERVICE'
        serviceId = item.serviceId || item.id
      } else {
        // Par défaut ou type === 'product'
        itemType = 'PRODUCT'
        productId = item.productId || item.id
      }

      const orderItem: any = {
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        itemType
      }

      // Ajouter les IDs selon le type
      if (productId) orderItem.productId = productId
      if (serviceId) orderItem.serviceId = serviceId
      if (offerId) orderItem.offerId = offerId

      // Gérer les métadonnées selon le type
      if (item.type === 'subscription') {
        // Stocker les informations de réservation dans metadata
        orderItem.metadata = JSON.stringify({
          type: 'subscription',
          platform: item.platform,
          duration: item.duration,
          maxProfiles: item.maxProfiles,
          reservation: item.reservation,
          paymentMethod: paymentMethod,
          currency: 'Ar',
          billingAddress,
          shippingAddress,
          billingAddressId,
          shippingAddressId,
          notes: notes || null,
          timestamp: new Date().toISOString()
        })
      } else if (item.type === 'service') {
        // Stocker les informations générales dans metadata pour les services
        orderItem.metadata = JSON.stringify({
          type: 'service',
          paymentMethod: paymentMethod,
          currency: 'Ar',
          billingAddress,
          shippingAddress,
          billingAddressId,
          shippingAddressId,
          notes: notes || null,
          timestamp: new Date().toISOString()
        })
      } else {
        // Stocker les informations générales dans metadata pour les produits
        orderItem.metadata = JSON.stringify({
          type: 'product',
          paymentMethod: paymentMethod,
          currency: 'Ar',
          billingAddress,
          shippingAddress,
          billingAddressId,
          shippingAddressId,
          notes: notes || null,
          timestamp: new Date().toISOString()
        })
      }

      orderItems.push(orderItem)
    }

    console.log('Items de commande préparés:', orderItems)

    // Créer la commande
    const result = await prisma.$transaction(async (prismaClient) => {
      // Créer la commande
      const order = await prismaClient.order.create({
        data: {
          orderNumber,
          userId: user.id,
          status: orderStatus,
          total: calculatedTotal,
          addressId: shippingAddressId,      // Adresse de livraison
          billingAddressId: billingAddressId, // Adresse de facturation
          items: {
            create: orderItems
          }
        },
        include: {
          items: {
            include: {
              offer: {
                select: {
                  id: true,
                  name: true
                }
              },
              product: {
                select: {
                  id: true,
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
          },
          shippingAddress: true,  // Adresse de livraison
          billingAddress: true    // Adresse de facturation
        }
      })

      // Créer les abonnements pour les offres streaming
      for (const item of items) {
        if (item.type === 'subscription' && item.reservation?.offerId) {
          const offer = await prismaClient.offer.findUnique({
            where: { id: item.reservation.offerId },
            include: {
              platformOffers: {
                include: {
                  platform: {
                    select: {
                      id: true,
                      name: true,
                      hasProfiles: true,
                      maxProfilesPerAccount: true
                    }
                  }
                }
              }
            }
          })

          if (offer && offer.platformOffers.length > 0) {
            // Prendre la première plateforme disponible
            const platformOffer = offer.platformOffers[0]
            
            // Calculer les dates de début et fin
            const startDate = new Date()
            const endDate = new Date()
            
            // Ajouter la durée selon l'offre
            if (offer.durationUnit === 'MONTH') {
              endDate.setMonth(endDate.getMonth() + offer.duration)
            } else if (offer.durationUnit === 'YEAR') {
              endDate.setFullYear(endDate.getFullYear() + offer.duration)
            } else if (offer.durationUnit === 'DAY') {
              endDate.setDate(endDate.getDate() + offer.duration)
            }

            // Créer l'abonnement avec la plateforme
            const subscription = await prismaClient.subscription.create({
              data: {
                userId: user.id,
                offerId: offer.id,
                orderId: order.id,
                platformOfferId: platformOffer.id,
                status: orderStatus === 'Payée' ? 'ACTIVE' : 'PENDING',
                startDate,
                endDate
              }
            })

            // Utiliser le compte spécifique de la réservation si disponible
            let targetAccountId = null
            let targetProfileIds = []

            if (item.reservation?.account?.id) {
              targetAccountId = item.reservation.account.id
              targetProfileIds = item.reservation.profiles?.map(p => p.id) || []
            }

            if (targetAccountId) {
              // Utiliser le compte spécifique réservé
              await prismaClient.subscriptionAccount.create({
                data: {
                  subscriptionId: subscription.id,
                  accountId: targetAccountId
                }
              })

              // Assigner les profils spécifiques réservés
              if (targetProfileIds.length > 0) {
                for (let i = 0; i < targetProfileIds.length; i++) {
                  const profileId = targetProfileIds[i]
                  
                  await prismaClient.accountProfile.update({
                    where: { id: profileId },
                    data: {
                      isAssigned: true,
                      subscriptionId: subscription.id,
                      name: i === 0 ? `${user.firstName || 'Profil'} Principal` : `${user.firstName || 'Profil'} ${i + 1}`
                    }
                  })
                }
                console.log(`✅ Abonnement créé avec compte réservé et ${targetProfileIds.length} profils assignés`)
              }
            } else {
              // Fallback: chercher un compte disponible (logique existante)
              const availableAccount = await prismaClient.account.findFirst({
                where: {
                  platformId: platformOffer.platform.id,
                  availability: true,
                  status: 'ACTIVE',
                  accountProfiles: {
                    some: {
                      isAssigned: false
                    }
                  }
                },
                include: {
                  accountProfiles: {
                    where: {
                      isAssigned: false
                    },
                    orderBy: {
                      profileSlot: 'asc'
                    }
                  }
                }
              })

              if (availableAccount) {
                await prismaClient.subscriptionAccount.create({
                  data: {
                    subscriptionId: subscription.id,
                    accountId: availableAccount.id
                  }
                })

                const profilesToAssign = Math.min(
                  offer.maxProfiles || 1,
                  availableAccount.accountProfiles.length
                )

                for (let i = 0; i < profilesToAssign; i++) {
                  const profile = availableAccount.accountProfiles[i]
                  
                  await prismaClient.accountProfile.update({
                    where: { id: profile.id },
                    data: {
                      isAssigned: true,
                      subscriptionId: subscription.id,
                      name: i === 0 ? `${user.firstName || 'Profil'} Principal` : `${user.firstName || 'Profil'} ${i + 1}`
                    }
                  })
                }

                console.log(`✅ Abonnement créé avec compte ${availableAccount.username} et ${profilesToAssign} profils assignés`)
              } else {
                console.log(`⚠️ Aucun compte disponible trouvé pour la plateforme ${platformOffer.platform.name}`)
              }
            }
          }
        }
      }

      return order
    }, {
      timeout: 15000 // Augmenter le timeout à 15 secondes
    })

    console.log('Commande créée avec succès:', result.orderNumber)

    return NextResponse.json({
      success: true,
      orderId: result.id,
      orderNumber: result.orderNumber,
      accountCreated,
      message: accountCreated 
        ? 'Commande créée avec succès. Un compte client a été automatiquement créé.'
        : 'Commande créée avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Une erreur est survenue lors de la création de la commande',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
} 