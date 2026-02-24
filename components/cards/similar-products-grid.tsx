'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Eye, Heart } from 'lucide-react'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { toast } from '@/components/ui/use-toast'
import { useCart } from '@/lib/hooks/use-cart'
import { ProductCardEnhanced } from '@/components/products/product-card-enhanced'

interface ProductImage {
  url: string
  type: 'image' | 'video'
  alt?: string
}

interface ProductCategory {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  images: ProductImage[]
  category: ProductCategory
  // Champs de tarification
  pricingType?: 'FIXED' | 'RANGE' | 'NEGOTIABLE' | 'QUOTE_REQUIRED' | 'AUCTION'
  minPrice?: number
  maxPrice?: number
  requiresQuote?: boolean
  autoAcceptNegotiation?: boolean
  auctionEndDate?: Date | string | null
  minimumBid?: number | null
  currentHighestBid?: number | null
}

interface SimilarProductsGridProps {
  categoryId: string
  currentProductId: string
  title?: string
  maxItems?: number
}

export function SimilarProductsGrid({
  categoryId,
  currentProductId,
  title = "Produits similaires",
  maxItems = 4
}: SimilarProductsGridProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])
  const { addToCart: addToCartAPI, isLoading: cartLoading } = useCart()

  // Charger les favoris depuis localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites')
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [])

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      try {
        const res = await fetch(`/api/public/products?category=${categoryId}`)
        if (!res.ok) throw new Error('Erreur lors du chargement')
        
        const allProducts = await res.json()
        
        // Filtrer pour exclure le produit actuel et limiter le nombre
        const similarProducts = allProducts
          .filter((product: Product) => product.id !== currentProductId)
          .slice(0, maxItems)
        
        setProducts(similarProducts)
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (categoryId && currentProductId) {
      fetchSimilarProducts()
    }
  }, [categoryId, currentProductId, maxItems])

  const addToCart = async (product: Product) => {
    if (cartLoading) return

    try {
      const firstImage = product.images?.find(img => img.type === 'image')
      
      await addToCartAPI({
        type: 'product',
        itemId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: 1,
        image: firstImage?.url || product.images?.[0]?.url
      })
      
      toast({
        title: "Produit ajouté!",
        description: `${product.name} ajouté à votre panier.`,
      })
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le produit au panier.",
        variant: "destructive",
      })
    }
  }

  const toggleFavorite = (productId: string) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId]
    
    setFavorites(newFavorites)
    localStorage.setItem('favorites', JSON.stringify(newFavorites))
    
    toast({
      title: favorites.includes(productId) ? "Retiré des favoris" : "Ajouté aux favoris",
      description: "Vos favoris ont été mis à jour.",
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {Array.from({ length: maxItems }).map((_, index) => (
            <Card key={index} className="overflow-hidden animate-pulse border-0 shadow-md bg-white">
              <div className="h-48 bg-gray-200"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {products.map((product) => (
          <ProductCardEnhanced
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug || product.id,
              price: Number(product.price),
              compareAtPrice: undefined,
              inventory: product.stock,
              images: product.images.map(img => ({ url: img.url, alt: img.alt })),
              pricingType: product.pricingType || 'FIXED',
              minPrice: product.minPrice ? Number(product.minPrice) : undefined,
              maxPrice: product.maxPrice ? Number(product.maxPrice) : undefined,
              requiresQuote: product.requiresQuote,
              auctionEndDate: product.auctionEndDate,
              currentHighestBid: product.currentHighestBid ? Number(product.currentHighestBid) : undefined,
              minimumBid: product.minimumBid ? Number(product.minimumBid) : undefined
            }}
            isFavorite={favorites.includes(product.id)}
            onToggleFavorite={() => toggleFavorite(product.id)}
            onAddToCart={() => addToCart(product)}
            compact={true}
            showStock={true}
          />
        ))}
      </div>
    </div>
  )
} 