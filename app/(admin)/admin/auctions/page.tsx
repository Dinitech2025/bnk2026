import React from 'react';
import { prisma } from '@/lib/prisma';
import { convertDecimalToNumber } from '@/lib/utils';
import AuctionsClient from './auctions-client';

export const dynamic = 'force-dynamic';

// Récupérer les paramètres de devise depuis la base de données
async function getCurrencySettings() {
  const currencySettings = await prisma.setting.findMany({
    where: {
      key: {
        in: ['currency', 'currencySymbol']
      }
    }
  });
  
  const settings: Record<string, string> = {};
  currencySettings.forEach(setting => {
    settings[setting.key] = setting.value || '';
  });
  
  return {
    currency: settings.currency || 'EUR',
    currencySymbol: settings.currencySymbol || '€'
  };
}

// Récupérer toutes les enchères avec les informations détaillées
async function getAuctions() {
  const auctions = await prisma.product.findMany({
    where: {
      pricingType: 'AUCTION'
    },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      price: true,
      minimumBid: true,
      currentHighestBid: true,
      auctionEndDate: true,
      published: true,
      createdAt: true,
      updatedAt: true,
      images: {
        take: 1,
        select: {
          path: true
        }
      },
      category: {
        select: {
          name: true
        }
      },
      bids: {
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      _count: {
        select: {
          bids: true
        }
      }
    },
    orderBy: [
      { auctionEndDate: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  // Transformer les données pour éviter les problèmes de sérialisation
  const transformedAuctions = [];
  
  for (const auction of auctions) {
    const now = new Date();
    const endDate = auction.auctionEndDate ? new Date(auction.auctionEndDate) : null;
    const isActive = endDate ? endDate > now : false;
    const isExpired = endDate ? endDate <= now : false;
    
    // Calculer les statistiques des enchères
    const totalBids = auction._count.bids;
    const activeBids = auction.bids.filter(bid => bid.status === 'ACCEPTED').length;
    const highestBid = auction.bids.find(bid => bid.status === 'ACCEPTED');
    
    // Transformer les enchères
    const transformedBids = [];
    for (const bid of auction.bids) {
      transformedBids.push({
        ...bid,
        amount: Number(bid.amount),
        createdAt: bid.createdAt.toISOString(),
        user: {
          ...bid.user,
          fullName: `${bid.user.firstName || ''} ${bid.user.lastName || ''}`.trim() || 'Utilisateur anonyme'
        }
      });
    }
    
    transformedAuctions.push({
      ...auction,
      price: Number(auction.price),
      minimumBid: auction.minimumBid ? Number(auction.minimumBid) : null,
      currentHighestBid: auction.currentHighestBid ? Number(auction.currentHighestBid) : null,
      auctionEndDate: auction.auctionEndDate ? auction.auctionEndDate.toISOString() : null,
      createdAt: auction.createdAt.toISOString(),
      updatedAt: auction.updatedAt.toISOString(),
      isActive,
      isExpired,
      totalBids,
      activeBids,
      highestBidder: highestBid ? {
        id: highestBid.user.id,
        fullName: `${highestBid.user.firstName || ''} ${highestBid.user.lastName || ''}`.trim() || 'Utilisateur anonyme',
        email: highestBid.user.email,
        amount: Number(highestBid.amount),
        bidDate: highestBid.createdAt.toISOString()
      } : null,
      bids: transformedBids,
      images: auction.images || [],
      category: auction.category
    });
  }

  return transformedAuctions;
}

// Récupérer les statistiques globales des enchères
async function getAuctionStats() {
  const now = new Date();
  
  const [
    totalAuctions,
    activeAuctions,
    expiredAuctions,
    totalBids,
    activeBids,
    totalRevenue
  ] = await Promise.all([
    // Total des produits en enchères
    prisma.product.count({
      where: { pricingType: 'AUCTION' }
    }),
    // Enchères actives (pas encore expirées)
    prisma.product.count({
      where: {
        pricingType: 'AUCTION',
        auctionEndDate: { gt: now }
      }
    }),
    // Enchères expirées
    prisma.product.count({
      where: {
        pricingType: 'AUCTION',
        auctionEndDate: { lte: now }
      }
    }),
    // Total des enchères placées
    prisma.bid.count(),
    // Enchères actives (non annulées)
    prisma.bid.count({
      where: { status: 'ACCEPTED' }
    }),
    // Revenus potentiels (somme des enchères gagnantes)
    prisma.bid.aggregate({
      where: { status: 'ACCEPTED' },
      _sum: { amount: true }
    })
  ]);

  return {
    totalAuctions,
    activeAuctions,
    expiredAuctions,
    totalBids,
    activeBids,
    totalRevenue: Number(totalRevenue._sum.amount) || 0
  };
}

export default async function AuctionsPage() {
  const [auctions, currencySettings, stats] = await Promise.all([
    getAuctions(),
    getCurrencySettings(),
    getAuctionStats()
  ]);

  return (
    <AuctionsClient 
      auctions={auctions}
      currencySettings={currencySettings}
      stats={stats}
    />
  );
}
