'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Plus, Search, Filter, Grid3X3, List, Heart, ChevronLeft, ChevronRight, Eye, ShoppingCart, Clock, MessageSquare } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { useCart } from '@/lib/hooks/use-cart'
import { useToast } from '@/components/ui/use-toast'
import { QuoteRequestForm } from '@/components/quotes/quote-request-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ServiceImage {
  url: string;
}

interface ServiceCategory {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  duration: number | null;
  images: ServiceImage[];
  category: ServiceCategory;
  // Nouveaux champs de pricing
  pricingType: 'FIXED' | 'NEGOTIABLE' | 'RANGE' | 'QUOTE_REQUIRED';
  minPrice?: number;
  maxPrice?: number;
  requiresQuote: boolean;
  autoAcceptNegotiation: boolean;
}

async function getServices(): Promise<Service[]> {
  const res = await fetch('/api/public/services', { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch services')
  }
  return res.json()
}

async function getCategories(): Promise<ServiceCategory[]> {
  const res = await fetch('/api/public/categories', { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch categories')
  }
  const data = await res.json()
  return data.services || []
}

function ServicesContent() {
  const searchParams = useSearchParams()
  const { addToCart: addToDbCart } = useCart()
  const { toast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [favorites, setFavorites] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const itemsPerPage = 16

  // Charger les favoris depuis localStorage et le terme de recherche depuis l'URL
  useEffect(() => {
    const savedFavorites = localStorage.getItem('service-favorites')
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
        const [servicesData, categoriesData] = await Promise.all([
          getServices(),
          getCategories()
        ])
        setServices(servicesData)
        setCategories(categoriesData)
        setFilteredServices(servicesData)
      } catch (error) {
        console.error(error)
        console.log("Impossible de charger les données.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filtrer et trier les services
  useEffect(() => {
    let filtered = services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = selectedCategory === 'all' || service.category.id === selectedCategory
      
      return matchesSearch && matchesCategory
    })

    // Trier les services
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'duration-asc':
          if (!a.duration || !b.duration) return 0
          return a.duration - b.duration
        case 'duration-desc':
          if (!a.duration || !b.duration) return 0
          return b.duration - a.duration
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    setFilteredServices(filtered)
    setCurrentPage(1) // Reset page when filters change
  }, [services, searchTerm, selectedCategory, sortBy])

  // Calculer les éléments pour la page actuelle
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentServices = filteredServices.slice(startIndex, endIndex)

  const addToCart = async (service: Service) => {
    // Pour les services avec devis requis, ouvrir le modal
    if (service.pricingType === 'QUOTE_REQUIRED') {
      setSelectedService(service)
      setQuoteModalOpen(true)
      return
    }

    try {
      await addToDbCart({
        type: 'service',
        itemId: service.id,
        name: service.name,
        price: Number(service.price),
        quantity: 1,
        image: service.images?.[0]?.url,
        data: service.duration ? { duration: service.duration } : undefined
      })
      
      toast({
        title: "Service ajouté!",
        description: `${service.name} a été ajouté à votre panier.`,
      })
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le service au panier.",
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

  const toggleFavorite = (serviceId: string) => {
    const newFavorites = favorites.includes(serviceId)
      ? favorites.filter(id => id !== serviceId)
      : [...favorites, serviceId]
    
    setFavorites(newFavorites)
    localStorage.setItem('service-favorites', JSON.stringify(newFavorites))
    
    console.log(favorites.includes(serviceId) ? "Retiré des favoris" : "Ajouté aux favoris")
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
          { label: 'Services', current: true }
        ]} 
        className="mb-8"
      />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Nos Services</h1>
          <p className="text-gray-600">Découvrez notre gamme complète de services professionnels</p>
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
                  placeholder="Rechercher des services..."
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
                  <SelectItem value="duration-asc">Durée croissante</SelectItem>
                  <SelectItem value="duration-desc">Durée décroissante</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {filteredServices.length} service(s)
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
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun service trouvé</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Essayez avec d\'autres mots-clés' : 'Aucun service disponible pour le moment'}
          </p>
        </div>
      ) : (
        <>
          <div className={
            viewMode === 'grid' 
                              ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8"
              : "space-y-4 mb-8"
          }>
            {currentServices.map((service) => (
              viewMode === 'grid' ? (
                <Card key={service.id} className="group overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:shadow-xl hover:-translate-y-1">
                  <CardHeader className="p-0 relative">
                    <Link href={`/services/${service.slug || service.id}`}>
                      <div className="relative w-full aspect-square overflow-hidden">
                        <Image
                          src={service.images?.[0]?.url || '/placeholder-image.svg'}
                          alt={service.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Boutons overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-10 w-10 p-0 bg-white/95 hover:bg-white shadow-xl backdrop-blur-sm border-0 rounded-full"
                              asChild
                            >
                              <Link href={`/services/${service.slug || service.id}`}>
                                <Eye className="h-4 w-4 text-gray-700" />
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                addToCart(service)
                              }}
                              className="h-10 w-10 p-0 bg-primary hover:bg-primary/90 shadow-xl rounded-full"
                            >
                              {service.pricingType === 'QUOTE_REQUIRED' ? (
                                <MessageSquare className="h-4 w-4 text-white" />
                              ) : (
                                <ShoppingCart className="h-4 w-4 text-white" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-lg backdrop-blur-sm rounded-full"
                      onClick={() => toggleFavorite(service.id)}
                    >
                      <Heart 
                        className={`h-4 w-4 transition-colors ${
                          favorites.includes(service.id) 
                            ? 'fill-red-500 text-red-500' 
                            : 'text-gray-600 hover:text-red-500'
                        }`} 
                      />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-3 flex-grow">
                    <div className="mb-2 flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs px-2 py-1 bg-gray-100 text-gray-700">
                        {service.category.name}
                      </Badge>
                      {/* Badge pour le type de pricing */}
                      {service.pricingType === 'NEGOTIABLE' && (
                        <Badge className="text-xs px-2 py-1 bg-green-100 text-green-700">
                          Négociable
                        </Badge>
                      )}
                      {service.pricingType === 'RANGE' && (
                        <Badge className="text-xs px-2 py-1 bg-purple-100 text-purple-700">
                          Plage
                        </Badge>
                      )}
                      {service.pricingType === 'QUOTE_REQUIRED' && (
                        <Badge className="text-xs px-2 py-1 bg-orange-100 text-orange-700">
                          Devis
                        </Badge>
                      )}
                    </div>
                    <Link href={`/services/${service.slug || service.id}`}>
                      <CardTitle className="text-sm font-medium mb-2 h-12 overflow-hidden leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {service.name}
                      </CardTitle>
                    </Link>
                    <div className="space-y-1">
                      {/* Affichage du prix selon le type */}
                      {service.pricingType === 'FIXED' && (
                        <p className="font-semibold text-base text-primary">
                          <PriceWithConversion price={Number(service.price)} />
                        </p>
                      )}
                      
                      {service.pricingType === 'NEGOTIABLE' && (
                        <div>
                          <p className="font-semibold text-base text-primary">
                            <PriceWithConversion price={Number(service.price)} />
                          </p>
                          <p className="text-xs text-green-600">Négociable</p>
                        </div>
                      )}
                      
                      {service.pricingType === 'RANGE' && (
                        <div>
                          <p className="font-semibold text-base text-primary">
                            <PriceWithConversion price={Number(service.minPrice || service.price)} /> - <PriceWithConversion price={Number(service.maxPrice || service.price)} />
                          </p>
                          <p className="text-xs text-purple-600">Plage de prix</p>
                        </div>
                      )}
                      
                      {service.pricingType === 'QUOTE_REQUIRED' && (
                        <div>
                          <p className="font-semibold text-base text-orange-600">
                            Sur devis
                          </p>
                          <p className="text-xs text-orange-600">Prix personnalisé</p>
                        </div>
                      )}
                      
                      {service.duration && (
                        <div className="flex items-center text-gray-600 text-sm">
                          <Clock className="h-4 w-4 mr-1" />
                          {service.duration >= 60 
                            ? `${Math.floor(service.duration / 60)}h${service.duration % 60 > 0 ? ` ${service.duration % 60}min` : ''}`
                            : `${service.duration}min`
                          }
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex">
                    <Link href={`/services/${service.slug || service.id}`}>
                      <div className="relative w-32 h-32 flex-shrink-0">
                        <Image
                          src={service.images?.[0]?.url || '/placeholder-image.svg'}
                          alt={service.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Link>
                    <div className="flex-1 p-4 flex justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {service.category.name}
                          </Badge>
                          {/* Badge pour le type de pricing */}
                          {service.pricingType === 'NEGOTIABLE' && (
                            <Badge className="text-xs bg-green-100 text-green-700">
                              Négociable
                            </Badge>
                          )}
                          {service.pricingType === 'RANGE' && (
                            <Badge className="text-xs bg-purple-100 text-purple-700">
                              Plage
                            </Badge>
                          )}
                          {service.pricingType === 'QUOTE_REQUIRED' && (
                            <Badge className="text-xs bg-orange-100 text-orange-700">
                              Devis
                            </Badge>
                          )}
                        </div>
                        <Link href={`/services/${service.slug || service.id}`}>
                          <h3 className="font-medium text-sm mb-2 hover:text-primary transition-colors">
                            {service.name}
                          </h3>
                        </Link>
                        <div className="flex items-center space-x-4">
                          {/* Affichage du prix selon le type */}
                          <div>
                            {service.pricingType === 'FIXED' && (
                              <p className="font-semibold text-base text-primary">
                                <PriceWithConversion price={Number(service.price)} />
                              </p>
                            )}
                            
                            {service.pricingType === 'NEGOTIABLE' && (
                              <div>
                                <p className="font-semibold text-base text-primary">
                                  <PriceWithConversion price={Number(service.price)} />
                                </p>
                                <p className="text-xs text-green-600">Négociable</p>
                              </div>
                            )}
                            
                            {service.pricingType === 'RANGE' && (
                              <div>
                                <p className="font-semibold text-base text-primary">
                                  <PriceWithConversion price={Number(service.minPrice || service.price)} /> - <PriceWithConversion price={Number(service.maxPrice || service.price)} />
                                </p>
                                <p className="text-xs text-purple-600">Plage de prix</p>
                              </div>
                            )}
                            
                            {service.pricingType === 'QUOTE_REQUIRED' && (
                              <div>
                                <p className="font-semibold text-base text-orange-600">
                                  Sur devis
                                </p>
                                <p className="text-xs text-orange-600">Prix personnalisé</p>
                              </div>
                            )}
                          </div>
                          
                          {service.duration && (
                            <div className="flex items-center text-gray-600 text-sm">
                              <Clock className="h-4 w-4 mr-1" />
                              {service.duration >= 60 
                                ? `${Math.floor(service.duration / 60)}h${service.duration % 60 > 0 ? ` ${service.duration % 60}min` : ''}`
                                : `${service.duration}min`
                              }
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 rounded-full hover:bg-gray-100"
                          onClick={() => toggleFavorite(service.id)}
                        >
                          <Heart 
                            className={`h-4 w-4 ${
                              favorites.includes(service.id) 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-gray-600 hover:text-red-500'
                            }`} 
                          />
                        </Button>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 border-gray-200 hover:border-gray-300"
                            asChild
                          >
                            <Link href={`/services/${service.slug || service.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </Link>
                          </Button>
                          <Button 
                            onClick={() => addToCart(service)}
                            size="sm"
                            className="h-9 px-3 shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            {service.pricingType === 'QUOTE_REQUIRED' ? (
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
                  </div>
                </Card>
              )
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={index} className="px-2 py-1 text-gray-500">...</span>
                ) : (
                  <Button
                    key={index}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page as number)}
                    className="min-w-[2.5rem]"
                  >
                    {page}
                  </Button>
                )
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

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

export default function ServicesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ServicesContent />
    </Suspense>
  )
} 