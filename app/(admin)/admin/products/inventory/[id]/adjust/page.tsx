import React from 'react';
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import StockAdjustmentClient from './stock-adjustment-client'

export const dynamic = 'force-dynamic'

interface StockAdjustmentPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: StockAdjustmentPageProps): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { name: true }
  })

  return {
    title: `Ajuster Stock - ${product?.name || 'Produit'} | BoutikNaka Admin`,
    description: `Gestion avancée du stock pour ${product?.name || 'ce produit'}`,
  }
}

// Récupérer le produit avec toutes ses données
async function getProductWithStock(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      inventory: true,
      price: true,
      compareAtPrice: true,
      pricingType: true,
      published: true,
      featured: true,
      createdAt: true,
      updatedAt: true,
      images: {
        take: 3,
        select: {
          id: true,
          path: true,
          alt: true
        }
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      variations: {
        select: {
          id: true,
          sku: true,
          inventory: true,
          price: true,
          attributes: {
            select: {
              name: true,
              value: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
      _count: {
        select: {
          variations: true,
          orderItems: true
        }
      }
    }
  })

  if (!product) {
    notFound()
  }

  // Calculer les statistiques
  const totalVariationStock = product.variations.reduce((sum, variation) => sum + variation.inventory, 0)
  const totalInventory = product.inventory + totalVariationStock
  const stockValue = totalInventory * Number(product.price)

  // Déterminer le statut du stock
  let stockStatus: 'critical' | 'low' | 'normal' | 'high' = 'normal'
  if (totalInventory === 0) stockStatus = 'critical'
  else if (totalInventory <= 5) stockStatus = 'critical'
  else if (totalInventory <= 10) stockStatus = 'low'
  else if (totalInventory >= 100) stockStatus = 'high'

  return {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    totalInventory,
    stockValue,
    stockStatus,
    hasVariations: product.variations.length > 0,
    variationsCount: product.variations.length,
    ordersCount: product._count.orderItems,
    variations: product.variations.map(v => ({
      ...v,
      price: Number(v.price)
    }))
  }
}

// Récupérer l'historique des mouvements de stock (simulé pour l'instant)
async function getStockHistory(productId: string) {
  // TODO: Implémenter un vrai système de suivi des mouvements de stock
  // Pour l'instant, retourner des données factices basées sur l'ID
  const baseHistory = [
    {
      id: `${productId}-1`,
      type: 'adjustment' as const,
      quantity: 50,
      previousQuantity: 100,
      newQuantity: 150,
      reason: 'Réapprovisionnement fournisseur',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
      createdBy: 'Admin',
      reference: 'REF-2024-001'
    },
    {
      id: `${productId}-2`,
      type: 'sale' as const,
      quantity: -5,
      previousQuantity: 150,
      newQuantity: 145,
      reason: 'Vente commande #1234',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Il y a 1 jour
      createdBy: 'System',
      reference: 'ORDER-1234'
    },
    {
      id: `${productId}-3`,
      type: 'correction' as const,
      quantity: -10,
      previousQuantity: 145,
      newQuantity: 135,
      reason: 'Correction inventaire physique',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // Il y a 12h
      createdBy: 'Manager',
      reference: 'INV-2024-11'
    },
    {
      id: `${productId}-4`,
      type: 'return' as const,
      quantity: 3,
      previousQuantity: 135,
      newQuantity: 138,
      reason: 'Retour client commande #1230',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // Il y a 6h
      createdBy: 'System',
      reference: 'RETURN-1230'
    }
  ]

  return baseHistory
}

// Récupérer les paramètres de stock
async function getStockSettings() {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ['lowStockThreshold', 'criticalStockThreshold', 'autoReorderEnabled', 'autoReorderQuantity']
      }
    }
  })
  
  const settingsMap: Record<string, string> = {}
  settings.forEach(setting => {
    settingsMap[setting.key] = setting.value || ''
  })
  
  return {
    lowStockThreshold: parseInt(settingsMap.lowStockThreshold) || 10,
    criticalStockThreshold: parseInt(settingsMap.criticalStockThreshold) || 5,
    autoReorderEnabled: settingsMap.autoReorderEnabled === 'true',
    autoReorderQuantity: parseInt(settingsMap.autoReorderQuantity) || 50
  }
}

export default async function StockAdjustmentPage({ params }: StockAdjustmentPageProps) {
  const [product, stockHistory, stockSettings] = await Promise.all([
    getProductWithStock(params.id),
    getStockHistory(params.id),
    getStockSettings()
  ])

  return (
    <StockAdjustmentClient 
      product={product}
      stockHistory={stockHistory}
      stockSettings={stockSettings}
    />
  )
}