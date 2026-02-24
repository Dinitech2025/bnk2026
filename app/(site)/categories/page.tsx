'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Search, Package, Wrench, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'

interface Category {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  productCount?: number;
  serviceCount?: number;
  type: 'product' | 'service';
}

async function getCategories(): Promise<{products: Category[], services: Category[]}> {
  const res = await fetch('/api/public/categories', { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch categories')
  }
  const data = await res.json()
  
  // Ajouter le type et compter les éléments
  const products = (data.products || []).map((cat: any) => ({
    ...cat,
    type: 'product' as const,
    productCount: cat._count?.products || 0
  }))
  
  const services = (data.services || []).map((cat: any) => ({
    ...cat,
    type: 'service' as const,
    serviceCount: cat._count?.services || 0
  }))
  
  return { products, services }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { products, services } = await getCategories()
        const allCategories = [...products, ...services]
        setCategories(allCategories)
        setFilteredCategories(allCategories)
      } catch (error) {
        console.error(error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les catégories.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filtrer les catégories
  useEffect(() => {
    let filtered = categories.filter(category => {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
      
      return matchesSearch
    })

    setFilteredCategories(filtered)
    setCurrentPage(1) // Reset page when filters change
  }, [categories, searchTerm])

  // Calculer les éléments pour la page actuelle
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCategories = filteredCategories.slice(startIndex, endIndex)

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
      <Breadcrumb 
        items={[
          { label: 'Catégories', current: true }
        ]} 
        className="mb-8"
      />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Toutes les Catégories</h1>
          <p className="text-gray-600">Explorez nos différentes catégories de produits et services</p>
        </div>
      </div>

      {/* Recherche */}
      <div className="mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher des catégories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Résultats et pagination info */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {filteredCategories.length} catégorie(s)
                </Badge>
                {totalPages > 1 && (
                  <span className="text-sm text-gray-500">
                    Page {currentPage} sur {totalPages}
                  </span>
                )}
              </div>
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                >
                  Effacer la recherche
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucune catégorie trouvée</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Essayez avec d\'autres mots-clés' : 'Aucune catégorie disponible pour le moment'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
            {currentCategories.map((category) => (
              <Card key={category.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="p-0 relative">
                  <Link href={`/categories/${category.id}`}>
                    <div className="relative w-full h-48 overflow-hidden">
                      <Image
                        src={category.image || '/placeholder-image.svg'}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>
                  </Link>
                  <div className="absolute top-2 right-2">
                    <Badge variant={category.type === 'product' ? 'default' : 'secondary'}>
                      {category.type === 'product' ? (
                        <>
                          <Package className="h-3 w-3 mr-1" />
                          Produits
                        </>
                      ) : (
                        <>
                          <Wrench className="h-3 w-3 mr-1" />
                          Services
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <Link href={`/categories/${category.id}`}>
                    <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                      {category.name}
                    </CardTitle>
                  </Link>
                  {category.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      {category.type === 'product' 
                        ? `${category.productCount || 0} produit(s)`
                        : `${category.serviceCount || 0} service(s)`
                      }
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/categories/${category.id}`}>
                        Voir tout →
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
      </div>
    </div>
  )
} 