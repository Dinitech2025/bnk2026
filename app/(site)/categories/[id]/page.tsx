'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbHeader } from '@/components/ui/breadcrumb'
import { Plus, Search, Grid3X3, List, Heart, Clock, Calendar, ChevronLeft, ChevronRight, ArrowLeft, Package, Wrench, Eye, ShoppingCart, MessageSquare } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { useCart } from '@/lib/hooks/use-cart'
import { QuoteRequestForm } from '@/components/quotes/quote-request-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ProductImage {
  url: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  images: ProductImage[];
  category: Category;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: string | null;
  images: ProductImage[];
  category: Category;
  pricingType?: 'FIXED' | 'NEGOTIABLE' | 'RANGE' | 'QUOTE_REQUIRED';
}

interface CategoryData {
  category: Category;
  products: Product[];
  services: Service[];
  type: 'product' | 'service';
}

async function getCategoryData(categoryId: string): Promise<CategoryData | null> {
  try {
    // Récupérer d'abord les informations de la catégorie
    const categoryResponse = await fetch(`/api/public/categories`)
    if (!categoryResponse.ok) {
      throw new Error('Failed to fetch categories')
    }
    const categoriesData = await categoryResponse.json()
    
    // Trouver la catégorie spécifique
    let targetCategory = null
    let isProductCategory = false
    
    if (categoriesData.products) {
      targetCategory = categoriesData.products.find((cat: Category) => cat.id === categoryId)
      if (targetCategory) isProductCategory = true
    }
    
    if (!targetCategory && categoriesData.services) {
      targetCategory = categoriesData.services.find((cat: Category) => cat.id === categoryId)
      isProductCategory = false
    }
    
    if (!targetCategory) {
      return null
    }

    // Récupérer les produits ou services de cette catégorie
    if (isProductCategory) {
      const productsResponse = await fetch(`/api/public/products?category=${categoryId}`)
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        return {
          category: targetCategory,
          products: productsData || [],
          services: [],
          type: 'product'
        }
      }
    } else {
      const servicesResponse = await fetch(`/api/public/services?category=${categoryId}`)
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json()
        return {
          category: targetCategory,
          products: [],
          services: servicesData || [],
          type: 'service'
        }
      }
    }
    
    return {
      category: targetCategory,
      products: [],
      services: [],
      type: isProductCategory ? 'product' : 'service'
    }
  } catch (error) {
    console.error('Error fetching category data:', error)
    return null
  }
}

export default function CategoryPage() {
  const params = useParams()
  const categoryId = params.id as string
  const { addToCart: addToDbCart } = useCart()
  
  const [categoryData, setCategoryData] = useState<CategoryData | null>(null)
  const [filteredItems, setFilteredItems] = useState<(Product | Service)[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<string>('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [favorites, setFavorites] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const itemsPerPage = 20

  // Charger les favoris depuis localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem(
      categoryData?.type === 'service' ? 'service-favorites' : 'favorites'
    )
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [categoryData?.type])

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCategoryData(categoryId)
        if (data) {
          setCategoryData(data)
          const items = data.type === 'product' ? data.products : data.services
          console.log('🔍 Items reçus:', items.slice(0, 2)) // Debug: voir les 2 premiers items
          setFilteredItems(items)
        } else {
          console.error('Catégorie non trouvée')
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [categoryId])

  // Filtrer et trier les éléments
  useEffect(() => {
    if (!categoryData) return

    const items = categoryData.type === 'product' ? categoryData.products : categoryData.services
    
    let filtered = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      
      return matchesSearch
    })

    // Trier les éléments
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

    setFilteredItems(filtered)
    setCurrentPage(1) // Reset page when filters change
  }, [categoryData, searchTerm, sortBy])

  // Calculer les éléments pour la page actuelle
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredItems.slice(startIndex, endIndex)

  const addToCart = async (item: Product | Service) => {
    // Pour les services avec devis requis, ouvrir le modal
    if (categoryData?.type === 'service' && 'pricingType' in item && item.pricingType === 'QUOTE_REQUIRED') {
      setSelectedService(item as Service)
      setQuoteModalOpen(true)
      return
    }

    const itemType = categoryData?.type || 'product'
    
    try {
      await addToDbCart({
        type: itemType,
        itemId: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: 1,
        image: item.images?.[0]?.url,
        data: itemType === 'service' && 'duration' in item ? { duration: item.duration } : undefined
      })
      
      toast({
        title: `${itemType === 'product' ? 'Produit' : 'Service'} ajouté!`,
        description: `${item.name} a été ajouté à votre panier.`,
      })
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'article au panier.",
        variant: "destructive",
      })
    }
  }

  const handleQuoteSuccess = (quoteId: string) => {
    setQuoteModalOpen(false)
    setSelectedService(null)
    toast({
      title: "Demande envoyée !",
      description: "Votre demande de devis a été transmise. Vous pouvez suivre son évolution dans votre profil.",
    })
  }

  const toggleFavorite = (itemId: string) => {
    const storageKey = categoryData?.type === 'service' ? 'service-favorites' : 'favorites'
    const newFavorites = favorites.includes(itemId)
      ? favorites.filter(id => id !== itemId)
      : [...favorites, itemId]
    
    setFavorites(newFavorites)
    localStorage.setItem(storageKey, JSON.stringify(newFavorites))
    
    toast({
      title: favorites.includes(itemId) ? "Retiré des favoris" : "Ajouté aux favoris",
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 bg-gray-200 animate-pulse"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!categoryData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Catégorie non trouvée</h1>
          <p className="text-gray-600 mb-4">
            La catégorie que vous recherchez n'existe pas ou a été supprimée.
          </p>
          <Button asChild>
            <Link href="/categories">
              Retour aux catégories
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <BreadcrumbHeader
        items={[
          { label: 'Catégories', href: '/categories' },
          { label: categoryData?.category?.name || 'Catégorie', current: true }
        ]}
        title={categoryData?.category?.name || 'Catégorie'}
        description={categoryData?.category?.description || undefined}
        icon={
          categoryData?.type === 'product' ? (
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
              <Wrench className="h-6 w-6 text-white" />
            </div>
          )
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hover:bg-primary hover:text-white transition-colors"
            >
              <Link href="/categories">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux catégories
              </Link>
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="transition-all"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="transition-all"
            >
              <List className="h-4 w-4" />
            </Button>
          </>
        }
      />

      <div className="container mx-auto px-4 py-8">
        {/* Filtres et recherche - Design compact */}
        <div className="mb-6">
          <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={`Rechercher des ${categoryData?.type === 'product' ? 'produits' : 'services'}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 border-gray-200 focus:border-primary focus:ring-primary"
                  />
                </div>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-44 h-9 border-gray-200 focus:border-primary focus:ring-primary">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nom A-Z</SelectItem>
                    <SelectItem value="price-asc">Prix croissant</SelectItem>
                    <SelectItem value="price-desc">Prix décroissant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Résultats et pagination info - Compact */}
              <div className="flex items-center justify-between text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-1">
                    {filteredItems.length} {categoryData?.type === 'product' ? 'produit(s)' : 'service(s)'}
                  </Badge>
                  {totalPages > 1 && (
                    <span className="text-gray-500 text-xs">
                      Page {currentPage}/{totalPages}
                    </span>
                  )}
                </div>
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    className="text-gray-500 hover:text-gray-700 h-7 px-2 text-xs"
                  >
                    Effacer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-gray-900">
              Aucun {categoryData?.type === 'product' ? 'produit' : 'service'} trouvé
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchTerm 
                ? 'Essayez avec d\'autres mots-clés ou supprimez les filtres' 
                : `Aucun ${categoryData?.type === 'product' ? 'produit' : 'service'} disponible dans cette catégorie pour le moment`
              }
            </p>
            {searchTerm && (
              <Button
                onClick={() => setSearchTerm('')}
                className="mt-4"
              >
                Voir tous les {categoryData?.type === 'product' ? 'produits' : 'services'}
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
              {currentItems.map((item) => (
                viewMode === 'grid' ? (
                  <Card key={item.id} className="group overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white">
                    <CardHeader className="p-0 relative">
                      <Link href={`/${categoryData?.type === 'product' ? 'products' : 'services'}/${item.id}`}>
                        <div className="relative w-full aspect-square overflow-hidden">
                          <Image
                            src={item.images?.[0]?.url || '/placeholder-image.svg'}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {/* Boutons overlay modernes */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-10 w-10 p-0 bg-white/95 hover:bg-white shadow-xl backdrop-blur-sm border-0 rounded-full"
                                asChild
                              >
                                <Link href={`/${categoryData?.type === 'product' ? 'products' : 'services'}/${item.id}`}>
                                  <Eye className="h-4 w-4 text-gray-700" />
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={(e) => {
                                  e.preventDefault()
                                  addToCart(item)
                                }}
                                disabled={categoryData?.type === 'product' && 'stock' in item && (item.stock || (item as any).inventory || 0) <= 0}
                                className="h-10 w-10 p-0 shadow-xl border-0 rounded-full"
                              >
                                {categoryData?.type === 'service' && 'pricingType' in item && item.pricingType === 'QUOTE_REQUIRED' ? (
                                  <MessageSquare className="h-4 w-4" />
                                ) : (
                                  <ShoppingCart className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.preventDefault()
                                  toggleFavorite(item.id)
                                }}
                                className={`h-10 w-10 p-0 shadow-xl border-0 rounded-full ${
                                  favorites.includes(item.id) 
                                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                                    : 'bg-white/95 hover:bg-white text-gray-700'
                                }`}
                              >
                                <Heart className={`h-4 w-4 ${favorites.includes(item.id) ? 'fill-current' : ''}`} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </CardHeader>
                    <CardContent className="p-3 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                          {item.category.name}
                        </Badge>
                        {categoryData?.type === 'product' && 'stock' in item && (
                          <div className="flex items-center text-xs">
                            {item.stock > 0 ? (
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
                        )}
                      </div>
                      <h3 className="font-medium text-sm mb-2 text-gray-900 line-clamp-2 leading-tight">
                        {item.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="text-base font-semibold text-primary">
                          {categoryData?.type === 'service' && 'pricingType' in item && item.pricingType === 'QUOTE_REQUIRED' ? (
                            <span className="text-orange-600">Sur devis</span>
                          ) : (
                            <PriceWithConversion price={Number(item.price)} />
                          )}
                        </div>
                        {categoryData?.type === 'service' && 'duration' in item && item.duration && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{item.duration} min</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card key={item.id} className="flex flex-row overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white">
                    <div className="relative w-32 h-32 flex-shrink-0">
                      <Image
                        src={item.images?.[0]?.url || '/placeholder-image.svg'}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                            {item.category.name}
                          </Badge>
                          {categoryData?.type === 'product' && 'stock' in item && (
                            <div className="flex items-center text-xs">
                              {item.stock > 0 ? (
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
                          )}
                        </div>
                        <h3 className="font-medium text-sm mb-2 text-gray-900">
                          {item.name}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-base font-semibold text-primary">
                          {categoryData?.type === 'service' && 'pricingType' in item && item.pricingType === 'QUOTE_REQUIRED' ? (
                            <span className="text-orange-600">Sur devis</span>
                          ) : (
                            <PriceWithConversion price={Number(item.price)} />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {categoryData?.type === 'service' && 'duration' in item && item.duration && (
                            <div className="flex items-center text-sm text-gray-500 mr-2">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{item.duration} min</span>
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="hover:bg-primary hover:text-white transition-colors"
                          >
                            <Link href={`/${categoryData?.type === 'product' ? 'products' : 'services'}/${item.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={(e) => {
                              e.preventDefault()
                              addToCart(item)
                            }}
                            disabled={categoryData?.type === 'product' && 'stock' in item && (item.stock || (item as any).inventory || 0) <= 0}
                            className="transition-colors"
                          >
                            {categoryData?.type === 'service' && 'pricingType' in item && item.pricingType === 'QUOTE_REQUIRED' ? (
                              <>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Demander un devis
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Ajouter
                              </>
                            )}
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

      {/* Modal de demande de devis */}
      {selectedService && (
        <Dialog open={quoteModalOpen} onOpenChange={setQuoteModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Demande de devis</DialogTitle>
            </DialogHeader>
            <QuoteRequestForm
              service={selectedService}
              onSuccess={handleQuoteSuccess}
              onCancel={() => {
                setQuoteModalOpen(false)
                setSelectedService(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 