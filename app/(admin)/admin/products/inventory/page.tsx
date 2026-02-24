import React from 'react';
import { prisma } from '@/lib/prisma'
import { Plus, Search, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import Link from 'next/link'
import { convertDecimalToNumber } from '@/lib/utils'
import { useCurrency } from '@/lib/hooks/use-currency'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import InventoryClient from './inventory-client'
import InventoryEnhancedClient from './inventory-enhanced-client'

export const dynamic = 'force-dynamic'

// Récupérer les paramètres de devise depuis la base de données
async function getCurrencySettings() {
  const currencySettings = await prisma.setting.findMany({
    where: {
      key: {
        in: ['currency', 'currencySymbol', 'lowStockThreshold', 'criticalStockThreshold']
      }
    }
  })
  
  const settings: Record<string, string> = {}
  currencySettings.forEach(setting => {
    settings[setting.key] = setting.value || ''
  })
  
  return {
    currency: settings.currency || 'EUR',
    currencySymbol: settings.currencySymbol || '€',
    lowStockThreshold: parseInt(settings.lowStockThreshold) || 10,
    criticalStockThreshold: parseInt(settings.criticalStockThreshold) || 5
  }
}

async function getProducts() {
  // Récupérer les produits avec leurs données de base
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      inventory: true,
      price: true,
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
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  // Pour chaque produit, récupérer les variations avec une requête SQL directe
  const productsWithVariations = await Promise.all(
    products.map(async (product) => {
      const variationsResult = await prisma.$queryRaw`
        SELECT v.*, 
          (
            SELECT json_agg(a.*) 
            FROM "ProductAttribute" a 
            WHERE a."variationId" = v.id
          ) as attributes
        FROM "ProductVariation" v
        WHERE v."productId" = ${product.id}
      `

      const variations = Array.isArray(variationsResult) ? variationsResult : []
      
      return {
        ...product,
        // Convertir les Decimals en numbers pour éviter les warnings React
        price: Number(product.price),
        variations: convertDecimalToNumber(variations),
        totalInventory: product.inventory + (
          Array.isArray(variations) 
            ? variations.reduce((sum: number, v: any) => sum + (Number(v.inventory) || 0), 0)
            : 0
        )
      }
    })
  )

  return productsWithVariations
}

// Récupérer les produits avec toutes les données nécessaires pour la version améliorée
async function getEnhancedProducts() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      inventory: true,
      price: true,
      compareAtPrice: true,
      pricingType: true,
      minPrice: true,
      maxPrice: true,
      published: true,
      featured: true,
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
        }
      },
      _count: {
        select: {
          variations: true,
          orderItems: true
        }
      }
    },
    orderBy: [
      { featured: 'desc' },
      { updatedAt: 'desc' }
    ]
  })

  // Calculer les statistiques pour chaque produit
  const enhancedProducts = products.map(product => {
    const totalVariationStock = product.variations.reduce((sum, variation) => sum + variation.inventory, 0)
    const totalInventory = product.inventory + totalVariationStock
    
    // Calculer la valeur totale du stock
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
      minPrice: product.minPrice ? Number(product.minPrice) : null,
      maxPrice: product.maxPrice ? Number(product.maxPrice) : null,
      totalInventory,
      stockValue,
      stockStatus,
      hasVariations: product.variations.length > 0,
      variationsCount: product.variations.length,
      ordersCount: product._count.orderItems,
      lastUpdated: product.updatedAt,
      variations: product.variations.map(v => ({
        ...v,
        price: Number(v.price)
      })),
      // Ajouter les champs manquants pour la compatibilité
      images: product.images.map(img => ({ ...img, url: img.path })),
      category: product.category,
      pricingType: product.pricingType || 'FIXED'
    }
  })

  return enhancedProducts
}

// Récupérer les statistiques globales
async function getInventoryStats() {
  const [
    totalProducts,
    publishedProducts,
    lowStockProducts,
    outOfStockProducts,
    totalStockValue
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { published: true } }),
    prisma.product.count({ 
      where: { 
        AND: [
          { inventory: { gt: 0 } },
          { inventory: { lte: 10 } }
        ]
      } 
    }),
    prisma.product.count({ where: { inventory: 0 } }),
    prisma.product.aggregate({
      _sum: { inventory: true }
    })
  ])

  return {
    totalProducts,
    publishedProducts,
    lowStockProducts,
    outOfStockProducts,
    totalStockUnits: totalStockValue._sum.inventory || 0
  }
}

// Récupérer les catégories avec compteurs
async function getCategoriesWithCounts() {
  const categories = await prisma.productCategory.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          products: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  return categories
}

// Fonction simplifiée pour récupérer les produits avec le bon format
async function getSimplifiedProducts() {
  // Utiliser une requête SQL brute pour éviter les problèmes de types Prisma
  const products = await prisma.$queryRaw`
    SELECT 
      p.id,
      p.name,
      p.slug,
      p.sku,
      p.inventory,
      p.price,
      p."compareAtPrice",
      p."pricingType",
      p."minPrice",
      p."maxPrice",
      p.published,
      p.featured,
      p."createdAt",
      p."updatedAt",
      c.id as "categoryId",
      c.name as "categoryName",
      c.slug as "categorySlug",
      (
        SELECT json_agg(
          json_build_object(
            'path', m.path
          )
        )
        FROM "Media" m 
        INNER JOIN "_MediaToProduct" mtp ON m.id = mtp."A"
        WHERE mtp."B" = p.id 
        LIMIT 1
      ) as images,
      (
        SELECT json_agg(
          json_build_object(
            'id', v.id,
            'sku', v.sku,
            'inventory', v.inventory,
            'price', v.price,
            'attributes', (
              SELECT json_agg(
                json_build_object(
                  'name', a.name,
                  'value', a.value
                )
              )
              FROM "ProductAttribute" a
              WHERE a."variationId" = v.id
            )
          )
        )
        FROM "ProductVariation" v
        WHERE v."productId" = p.id
      ) as variations,
      (
        SELECT COUNT(*)
        FROM "ProductVariation" v
        WHERE v."productId" = p.id
      ) as "variationsCount",
      (
        SELECT COUNT(*)
        FROM "OrderItem" oi
        WHERE oi."productId" = p.id
      ) as "ordersCount"
    FROM "Product" p
    LEFT JOIN "ProductCategory" c ON p."categoryId" = c.id
    ORDER BY p.featured DESC, p."updatedAt" DESC
  ` as any[]

  // Transformer les données pour éviter les fonctions inline
  const transformedProducts = []
  
  for (const product of products) {
    const variations = product.variations || []
    let totalVariationStock = 0
    
    for (const variation of variations) {
      totalVariationStock += Number(variation.inventory) || 0
    }
    
    const totalInventory = Number(product.inventory) + totalVariationStock
    const stockValue = totalInventory * Number(product.price)
    
    let stockStatus: 'critical' | 'low' | 'normal' | 'high' = 'normal'
    if (totalInventory === 0) stockStatus = 'critical'
    else if (totalInventory <= 5) stockStatus = 'critical'
    else if (totalInventory <= 10) stockStatus = 'low'
    else if (totalInventory >= 100) stockStatus = 'high'
    
    const transformedVariations = []
    for (const variation of variations) {
      transformedVariations.push({
        ...variation,
        price: Number(variation.price)
      })
    }
    
    const transformedImages = []
    const images = product.images || []
    for (const image of images) {
      if (image && image.path) {
        transformedImages.push({ ...image, url: image.path })
      }
    }
    
    transformedProducts.push({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      inventory: Number(product.inventory),
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      minPrice: product.minPrice ? Number(product.minPrice) : null,
      maxPrice: product.maxPrice ? Number(product.maxPrice) : null,
      published: product.published,
      featured: product.featured,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      totalInventory,
      stockValue,
      stockStatus,
      hasVariations: variations.length > 0,
      variationsCount: variations.length,
      ordersCount: Number(product.ordersCount) || 0,
      lastUpdated: product.updatedAt,
      variations: transformedVariations,
      images: transformedImages,
      category: product.categoryId ? {
        id: product.categoryId,
        name: product.categoryName,
        slug: product.categorySlug
      } : null,
      pricingType: product.pricingType || 'FIXED'
    })
  }

  return transformedProducts
}

export default async function InventoryPage() {
  // Utiliser la version simplifiée qui évite les fonctions inline
  const [products, currencySettings] = await Promise.all([
    getSimplifiedProducts(),
    getCurrencySettings()
  ])

  // Calculer les statistiques basiques - éviter les fonctions inline
  let totalProducts = 0
  let publishedProducts = 0
  let lowStockProducts = 0
  let outOfStockProducts = 0
  let totalStockUnits = 0

  for (const product of products) {
    totalProducts++
    if (product.published !== false) publishedProducts++
    if (product.totalInventory > 0 && product.totalInventory <= 10) lowStockProducts++
    if (product.totalInventory === 0) outOfStockProducts++
    totalStockUnits += product.totalInventory
  }

  const inventoryStats = {
    totalProducts,
    publishedProducts,
    lowStockProducts,
    outOfStockProducts,
    totalStockUnits
  }

  // Extraire les catégories des produits - éviter les fonctions inline
  const categoryNamesArray: string[] = []
  for (const product of products) {
    if (product.category?.name && !categoryNamesArray.includes(product.category.name)) {
      categoryNamesArray.push(product.category.name)
    }
  }
  
  const categories = []
  for (let index = 0; index < categoryNamesArray.length; index++) {
    const name = categoryNamesArray[index]
    let productCount = 0
    for (const product of products) {
      if (product.category?.name === name) productCount++
    }
    
    categories.push({
      id: `cat-${index}`,
      name: name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      _count: { products: productCount }
    })
  }

  return (
    <InventoryEnhancedClient 
      products={products}
      currencySettings={currencySettings}
      inventoryStats={inventoryStats}
      categories={categories}
    />
  )
} 