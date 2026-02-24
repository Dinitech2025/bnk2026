'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Plus, Search, Filter, Grid3X3, List, Heart, ChevronLeft, ChevronRight, Eye, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { useCart } from '@/lib/hooks/use-cart'
import { ProductCardEnhanced } from '@/components/products/product-card-enhanced'

interface ProductImage {
  url: string;
}

interface ProductCategory {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  inventory: number;
  images: ProductImage[];
  category: ProductCategory;
  // Champs de tarification
  pricingType?: 'FIXED' | 'RANGE' | 'NEGOTIABLE' | 'QUOTE_REQUIRED' | 'AUCTION';
  minPrice?: number;
  maxPrice?: number;
  requiresQuote?: boolean;
  autoAcceptNegotiation?: boolean;
  auctionEndDate?: Date | string | null;
  minimumBid?: number | null;
  currentHighestBid?: number | null;
}

async function getProducts(): Promise<Product[]> {
  const res = await fetch('/api/public/products', { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch products')
  }
  return res.json()
}

async function getCategories(): Promise<ProductCategory[]> {
  const res = await fetch('/api/public/categories', { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch categories')
  }
  const data = await res.json()
  return data.products || []
}

function ProductsContent() {
  const searchParams = useSearchParams()
  const { addToCart: addToDbCart } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [favorites, setFavorites] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 16

  // Charger les favoris depuis localStorage et le terme de recherche depuis l'URL
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites')
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }

    // Récupérer le terme de recherche depuis l'URL
    const urlSearchTerm = searchParams.get('search')
    if (urlSearchTerm) {
      setSearchTerm(urlSearchTerm)
    }
  }, [searchParams])

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories()
        ])
        setProducts(productsData)
        setCategories(categoriesData)
        setFilteredProducts(productsData)
      } catch (error) {
        console.error(error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les données.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filtrer et trier les produits
  useEffect(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = selectedCategory === 'all' || product.category.id === selectedCategory
      
      return matchesSearch && matchesCategory
    })

    // Trier les produits
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    setFilteredProducts(filtered)
    setCurrentPage(1) // Reset page when filters change
  }, [products, searchTerm, selectedCategory, sortBy])

  // Calculer les éléments pour la page actuelle
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = filteredProducts.slice(startIndex, endIndex)

  const addToCart = async (product: Product) => {
    try {
      await addToDbCart({
        type: 'product',
        itemId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: 1,
        image: product.images?.[0]?.url
      })
      
      toast({
        title: "Produit ajouté!",
        description: `${product.name} a été ajouté à votre panier.`,
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

  // Génération des numéros de pages
  const getPageNumbers = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb 
        items={[
          { label: 'Produits', current: true }
        ]} 
        className="mb-8"
      />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Nos Produits</h1>
          <p className="text-gray-600">Découvrez notre sélection de produits de qualité</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 lg:mt-0">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher des produits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nom A-Z</SelectItem>
                  <SelectItem value="price-asc">Prix croissant</SelectItem>
                  <SelectItem value="price-desc">Prix décroissant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {filteredProducts.length} produit(s)
                </Badge>
                {totalPages > 1 && (
                  <span className="text-sm text-gray-500">
                    Page {currentPage} sur {totalPages}
                  </span>
                )}
              </div>
              {(searchTerm || selectedCategory !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                  }}
                >
                  Effacer les filtres
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {Array.from({ length: 16 }).map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
              <CardFooter className="p-4">
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">Aucun produit trouvé</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Essayez avec d\'autres mots-clés ou supprimez les filtres' 
              : 'Aucun produit disponible pour le moment'
            }
          </p>
          {(searchTerm || selectedCategory !== 'all') && (
            <Button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
              }}
              className="mt-4"
            >
              Voir tous les produits
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className={
            viewMode === 'grid' 
                              ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8"
              : "space-y-4 mb-8"
          }>
            {currentProducts.map((product) => (
              viewMode === 'grid' ? (
                <ProductCardEnhanced
                  key={product.id}
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug || product.id,
                    price: Number(product.price),
                    compareAtPrice: undefined,
                    inventory: product.stock,
                    images: product.images.map(img => ({ url: img.url, alt: product.name })),
                    pricingType: product.pricingType || 'FIXED',
                    minPrice: product.minPrice ? Number(product.minPrice) : undefined,
                    maxPrice: product.maxPrice ? Number(product.maxPrice) : undefined,
                    requiresQuote: product.requiresQuote,
                    auctionEndDate: product.auctionEndDate,
                    currentHighestBid: product.currentHighestBid ? Number(product.currentHighestBid) : undefined,
                    minimumBid: product.minimumBid ? Number(product.minimumBid) : undefined
                  }}
                  isFavorite={favorites.includes(product.id)}
                  onToggleFavorite={() => handleToggleFavoriteProduct(product.id)}
                  onAddToCart={() => handleAddToCartProduct(product)}
                  compact={true}
                  showStock={true}
                />
              ) : (
                <Card key={product.id} className="flex flex-row overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white">
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <Image
                      src={product.images?.[0]?.url || '/placeholder-image.svg'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                          {product.category.name}
                        </Badge>
                        <div className="flex items-center text-xs">
                          {product.stock > 0 ? (
                            <div className="flex items-center text-green-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                              Disponible en stock
                            </div>
                          ) : (
                            <div className="flex items-center text-orange-600">
                              <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                              Disponible en commande
                            </div>
                          )}
                        </div>
                      </div>
                      <h3 className="font-medium text-sm mb-2 text-gray-900">
                        {product.name}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-base font-semibold text-primary">
                        <PriceWithConversion price={Number(product.price)} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="hover:bg-primary hover:text-white transition-colors"
                        >
                          <Link href={`/products/${product.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={(e) => {
                            e.preventDefault()
                            addToCart(product)
                          }}
                          disabled={product.stock <= 0}
                          className="transition-colors"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            ))}
          </div>

          {/* Pagination moderne */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="hover:bg-primary hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
              
              <div className="flex items-center space-x-1">
                {getPageNumbers().map((pageNum, index) => (
                  pageNum === '...' ? (
                    <span key={index} className="px-2 py-1 text-gray-500">...</span>
                  ) : (
                    <Button
                      key={index}
                      variant={pageNum === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum as number)}
                      className="w-8 h-8 p-0 hover:bg-primary hover:text-white transition-colors"
                    >
                      {pageNum}
                    </Button>
                  )
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="hover:bg-primary hover:text-white transition-colors"
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsContent />
    </Suspense>
  )
} 