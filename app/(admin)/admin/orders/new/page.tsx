import React from 'react';
import { prisma } from '@/lib/prisma';
import { EnhancedOrderForm } from '@/components/admin/orders/enhanced-order-form';
import { Metadata } from 'next';

// Désactiver le cache pour avoir les données en temps réel
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Nouvelle commande',
  description: 'Créer une nouvelle commande',
};

export default async function NewOrderPage() {
  // Trouver d'abord la catégorie "Produits importés"
  const importedCategory = await prisma.productCategory.findFirst({
    where: { 
      OR: [
        { name: 'Produits importés' },
        { slug: 'produits-importes' }
      ]
    },
    select: { id: true }
  });

  // Récupérer les données nécessaires (temps réel, sans cache)
  const [users, products, services, offers, paymentMethods, deliveryMethods] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: 'CLIENT'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        addresses: {
          select: {
            id: true,
            type: true,
            street: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            phoneNumber: true,
            isDefault: true
          },
          orderBy: {
            isDefault: 'desc' // Adresse par défaut en premier
          }
        }
      }
    }),
    prisma.product.findMany({
      where: {
        OR: [
          { published: true },
          ...(importedCategory ? [{ categoryId: importedCategory.id }] : [])
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true
      },
      orderBy: {
        name: 'asc'
      }
    }),
    prisma.service.findMany({
      where: { published: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        pricingType: true,
        requiresQuote: true,
        minPrice: true,
        maxPrice: true,
        autoAcceptNegotiation: true,
        duration: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        images: {
          select: {
            id: true,
            path: true,
            alt: true
          },
          take: 1
        }
      },
      orderBy: {
        name: 'asc'
      }
    }),
    prisma.offer.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        platformOffers: {
          select: {
            id: true,
            platform: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    }),
    // Modes de paiement actifs
    prisma.paymentMethod.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        feeType: true,
        feeValue: true,
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    }),
    // Modes de livraison actifs
    prisma.deliveryMethod.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        estimatedDays: true,
        isActive: true,
        pricingRules: {
          select: {
            id: true,
            fixedPrice: true,
            isActive: true
          },
          where: { isActive: true },
          orderBy: { fixedPrice: 'asc' },
          take: 1
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
  ]);

  // Formater les données
  const formattedData = {
    users: users.map(user => ({
      ...user,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || ""
    })),
    products: products.map(product => ({
      id: product.id,
      name: product.name.trim(), // Nettoyer le nom
      price: Number(product.price),
      description: product.description 
        ? product.description.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim() // Nettoyer la description
        : undefined
    })),
    services: services.map(service => ({
      id: service.id,
      name: service.name.trim(), // Nettoyer le nom
      price: Number(service.price),
      description: service.description
        ? service.description.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim() // Nettoyer la description
        : undefined,
      pricingType: service.pricingType || 'FIXED',
      requiresQuote: service.requiresQuote || false,
      minPrice: service.minPrice ? Number(service.minPrice) : null,
      maxPrice: service.maxPrice ? Number(service.maxPrice) : null,
      autoAcceptNegotiation: service.autoAcceptNegotiation || false,
      duration: service.duration || 0,
      category: service.category || null,
      image: service.images?.[0]?.path || null
    })),
    offers: offers.map(offer => ({
      id: offer.id,
      name: offer.name.trim(), // Nettoyer le nom
      price: Number(offer.price),
      description: offer.description 
        ? offer.description.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim() // Nettoyer la description
        : undefined,
      duration: offer.duration,
      platformOffers: offer.platformOffers.map(po => ({
        id: po.id,
        platform: {
          id: po.platform.id,
          name: po.platform.name,
          logo: po.platform.logo || undefined
        }
      }))
    })),
    paymentMethods: paymentMethods.map(method => ({
      id: method.id,
      name: method.name,
      type: method.type,
      description: method.description,
      feeType: method.feeType,
      feeValue: method.feeValue ? Number(method.feeValue) : 0,
      isActive: method.isActive
    })),
    deliveryMethods: deliveryMethods.map(method => {
      const estimatedDaysData = method.estimatedDays as any;
      return {
        id: method.id,
        name: method.name,
        description: method.description,
        basePrice: method.pricingRules[0]?.fixedPrice ? Number(method.pricingRules[0].fixedPrice) : 0,
        estimatedDays: estimatedDaysData?.min || estimatedDaysData?.max || 0,
        isActive: method.isActive
      };
    })
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <EnhancedOrderForm {...formattedData} />
      </div>
    </div>
  );
} 