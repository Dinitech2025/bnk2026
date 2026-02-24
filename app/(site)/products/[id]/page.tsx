'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Plus, Minus, ShoppingCart, ArrowLeft, Play, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { SimilarProductsGrid } from '@/components/cards/similar-products-grid'
import { useCart } from '@/lib/hooks/use-cart'
import { ProductPricingSelector } from '@/components/products/product-pricing-selector'
import { ProductAuction } from '@/components/products/product-auction'
import { ProductImageSlider } from '@/components/products/product-image-slider'

interface ProductMedia {
  url: string;
  type: 'image' | 'video';
  alt?: string;
  thumbnail?: string; // Pour les vidéos
}

interface ProductCategory {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  images: ProductMedia[]; // Maintenant ça peut être des images ou vidéos
  category: ProductCategory;
  pricingType?: 'FIXED' | 'RANGE' | 'NEGOTIABLE' | 'QUOTE_REQUIRED' | 'AUCTION';
  minPrice?: number;
  maxPrice?: number;
  requiresQuote?: boolean;
  autoAcceptNegotiation?: boolean;
  auctionEndDate?: Date | string | null;
  minimumBid?: number | null;
  currentHighestBid?: number | null;
}

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
  const { addToCart: addToCartAPI, isLoading: cartLoading } = useCart()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/public/products?id=${productId}`)
        if (!res.ok) throw new Error('Produit non trouvé')
        
        const products = await res.json()
        const foundProduct = products.find((p: Product) => p.id === productId)
        
        if (!foundProduct) throw new Error('Produit non trouvé')
        
        // Transformer les images en format média si nécessaire
        if (foundProduct.images && foundProduct.images.length > 0) {
          foundProduct.images = foundProduct.images.map((img: any) => ({
            url: img.url || img,
            type: img.type || 'image',
            alt: img.alt,
            thumbnail: img.thumbnail
          }))
        } else {
          // S'assurer qu'il y a au moins un placeholder
          foundProduct.images = [{
            url: '/placeholder-image.svg',
            type: 'image',
            alt: foundProduct.name
          }]
        }
        
        setProduct(foundProduct)
      } catch (error) {
        console.error(error)
        toast({
          title: "Erreur",
          description: "Impossible de charger le produit.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const addToCart = async () => {
    if (!product || cartLoading) return

    try {
      // Utiliser la première image pour le panier
      const firstImage = product.images?.find(media => media.type === 'image')
      
      await addToCartAPI({
        type: 'product',
        itemId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: quantity,
        image: firstImage?.url || product.images?.[0]?.url
      })
      
      toast({
        title: "Produit ajouté!",
        description: `${quantity} x ${product.name} ajouté(s) à votre panier.`,
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

  const handlePlaceBid = async (amount: number, message?: string) => {
    try {
      console.log('Offre placée:', { amount, message })
      toast({
        title: "Offre placée !",
        description: `Votre offre de ${amount.toLocaleString()} Ar a été enregistrée`,
      })
    } catch (error) {
      console.error('Erreur lors du placement de l\'offre:', error)
      toast({
        title: "Erreur",
        description: "Impossible de placer votre offre.",
        variant: "destructive",
      })
    }
  }

  const handleRequestQuote = async (proposedPrice?: number, message?: string) => {
    try {
      console.log('Demande de devis:', { proposedPrice, message })
      toast({
        title: "Demande de devis envoyée",
        description: "Votre demande a été envoyée avec succès",
      })
    } catch (error) {
      console.error('Erreur lors de la demande de devis:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre demande.",
        variant: "destructive",
      })
    }
  }

  const renderMainMedia = () => {
    const currentMedia = product?.images?.[selectedMediaIndex]
    if (!currentMedia) return null

    if (currentMedia.type === 'video') {
      return (
        <video
          controls
          className="w-full h-full object-cover rounded-lg"
          poster={currentMedia.thumbnail}
        >
          <source src={currentMedia.url} type="video/mp4" />
          Votre navigateur ne supporte pas la lecture vidéo.
        </video>
      )
    }

    return (
      <Image
        src={currentMedia.url || '/placeholder-image.svg'}
        alt={currentMedia.alt || product.name}
        fill
        className="object-cover"
        priority
      />
    )
  }

  const renderMediaThumbnail = (media: ProductMedia, index: number) => {
    const isSelected = selectedMediaIndex === index
    const isVideo = media.type === 'video'

    return (
      <button
        key={index}
        onClick={() => setSelectedMediaIndex(index)}
        className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
          isSelected ? 'border-primary' : 'border-gray-200'
        } hover:border-primary/50 transition-colors`}
      >
        {isVideo ? (
          <>
            <Image
              src={media.thumbnail || '/placeholder-image.svg'}
              alt={media.alt || `${product?.name} vidéo ${index + 1}`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Play className="h-6 w-6 text-white" />
            </div>
          </>
        ) : (
          <>
            <Image
              src={media.url}
              alt={media.alt || `${product?.name} ${index + 1}`}
              fill
              className="object-cover"
            />
            <div className="absolute top-1 right-1">
              <ImageIcon className="h-3 w-3 text-white drop-shadow-md" />
            </div>
          </>
        )}
      </button>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Produit non trouvé</h1>
        <p className="text-gray-600 mb-8">Le produit que vous recherchez n'existe pas ou a été supprimé.</p>
        <Link href="/products">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux produits
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb 
        items={[
          { label: product?.category?.name || 'Catégorie', href: `/categories/${product?.category?.id}` },
          { label: product?.name || 'Produit', current: true }
        ]} 
        className="mb-8"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Galerie d'images avec slider */}
        <div>
          <ProductImageSlider
            images={product.images || []}
            productName={product.name}
            showThumbnails={true}
            showZoom={true}
            showFavorite={false}
          />
        </div>

        {/* Informations produit */}
        <div className="space-y-6">
                <div>
                  {product.category && (
                    <Badge variant="secondary" className="mb-2">
                      {product.category.name}
                    </Badge>
                  )}
                  <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            
            {/* Affichage du prix selon le type */}
            {product.pricingType === 'QUOTE_REQUIRED' ? (
              <div className="text-2xl font-bold text-purple-600 mb-4">
                Prix sur devis uniquement
              </div>
            ) : product.pricingType === 'AUCTION' ? (
              <div className="text-2xl font-bold text-orange-600 mb-4">
                Enchère en cours
              </div>
            ) : product.pricingType === 'RANGE' && product.minPrice && product.maxPrice ? (
              <div className="text-2xl font-bold text-blue-600 mb-4">
                {product.minPrice.toLocaleString()} - {product.maxPrice.toLocaleString()} Ar
              </div>
            ) : product.pricingType === 'NEGOTIABLE' ? (
              <div className="text-3xl font-bold text-primary mb-4 flex items-center gap-2">
                <PriceWithConversion price={Number(product.price)} />
                <Badge variant="secondary" className="text-sm">Négociable</Badge>
              </div>
            ) : (
              <div className="text-3xl font-bold text-primary mb-4">
                <PriceWithConversion price={Number(product.price)} />
              </div>
            )}
          </div>

          {/* Options d'achat - AVANT la description */}
          <div className="border-t border-b py-6">
            {product.pricingType === 'AUCTION' ? (
              <ProductAuction
                product={{
                  id: product.id,
                  name: product.name,
                  currentHighestBid: product.currentHighestBid,
                  minimumBid: product.minimumBid,
                  auctionEndDate: product.auctionEndDate
                }}
                onPlaceBid={handlePlaceBid}
                loading={cartLoading}
              />
            ) : (
              <ProductPricingSelector
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  pricingType: (product.pricingType || 'FIXED') as any,
                  inventory: product.stock,
                  minPrice: product.minPrice,
                  maxPrice: product.maxPrice,
                  requiresQuote: product.requiresQuote || false,
                  autoAcceptNegotiation: product.autoAcceptNegotiation || false,
                  auctionEndDate: product.auctionEndDate,
                  minimumBid: product.minimumBid,
                  currentHighestBid: product.currentHighestBid
                }}
                quantity={quantity}
                onAddToCart={addToCart}
                onRequestQuote={handleRequestQuote}
                loading={cartLoading}
                hidePrice={true}
              />
            )}
          </div>

          {/* Description - APRÈS les options d'achat */}
          {product.description && (
            <div className="pt-4 pb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Section des produits similaires */}
      {product.category && (
        <div className="mt-16 border-t pt-12">
          <SimilarProductsGrid 
            categoryId={product.category.id}
            currentProductId={product.id}
            title="Produits similaires"
            maxItems={4}
          />
        </div>
      )}
    </div>
  )
} 