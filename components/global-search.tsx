'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Package, Wrench, Monitor } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { PriceWithConversion } from '@/components/ui/currency-selector'

interface SearchResult {
  id: string
  name: string
  description?: string
  price?: number
  image?: string
  type: 'product' | 'service' | 'offer'
  category?: string
}

interface GlobalSearchProps {
  onClose?: () => void
}

export function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false)
        if (onClose) onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        performSearch(searchTerm.trim())
      } else {
        setResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [searchTerm])

  const performSearch = async (query: string) => {
    setIsLoading(true)
    try {
      const [productsRes, servicesRes, offersRes] = await Promise.all([
        fetch(`/api/public/products?search=${encodeURIComponent(query)}`),
        fetch(`/api/public/services?search=${encodeURIComponent(query)}`),
        fetch(`/api/public/offers?search=${encodeURIComponent(query)}`)
      ])

      const [products, services, offers] = await Promise.all([
        productsRes.ok ? productsRes.json() : [],
        servicesRes.ok ? servicesRes.json() : [],
        offersRes.ok ? offersRes.json() : []
      ])

      const searchResults: SearchResult[] = [
        ...products.slice(0, 3).map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.images?.[0]?.url,
          type: 'product' as const,
          category: product.category?.name
        })),
        ...services.slice(0, 3).map((service: any) => ({
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price,
          type: 'service' as const,
          category: service.category?.name
        })),
        ...offers.slice(0, 3).map((offer: any) => ({
          id: offer.id,
          name: offer.name,
          description: offer.description,
          price: offer.price,
          type: 'offer' as const
        }))
      ]

      setResults(searchResults)
      setShowResults(true)
    } catch (error) {
      console.error('Erreur de recherche:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <Package className="h-4 w-4" />
      case 'service':
        return <Wrench className="h-4 w-4" />
      case 'offer':
        return <Monitor className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'product':
        return 'Produit'
      case 'service':
        return 'Service'
      case 'offer':
        return 'Offre'
      default:
        return type
    }
  }

  const getTypeUrl = (type: string, id: string) => {
    switch (type) {
      case 'product':
        return `/products/${id}`
      case 'service':
        return `/services/${id}`
      case 'offer':
        return `/subscriptions#${id}`
      default:
        return '#'
    }
  }

  const handleResultClick = () => {
    setShowResults(false)
    if (onClose) onClose()
  }

  const handleViewAll = () => {
    if (searchTerm.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchTerm.trim())}`
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Rechercher produits, services, offres..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true)
            }
          }}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => {
              setSearchTerm('')
              setResults([])
              setShowResults(false)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Résultats de recherche */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 shadow-lg border z-50 max-h-96 overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Recherche en cours...
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Aucun résultat trouvé
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {results.map((result) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={getTypeUrl(result.type, result.id)}
                    onClick={handleResultClick}
                  >
                    <div className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                      {result.image ? (
                        <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 mr-3">
                          <Image
                            src={result.image}
                            alt={result.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 mr-3">
                          {getTypeIcon(result.type)}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{result.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(result.type)}
                          </Badge>
                        </div>
                        
                        {result.description && (
                          <p className="text-xs text-gray-600 truncate">
                            {result.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-1">
                          {result.category && (
                            <span className="text-xs text-gray-500">{result.category}</span>
                          )}
                          {result.price && (
                            <span className="text-sm font-semibold text-primary">
                              <PriceWithConversion price={Number(result.price)} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                
                {results.length > 0 && (
                  <div className="p-3 border-t bg-gray-50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-primary"
                      onClick={handleViewAll}
                    >
                      Voir tous les résultats pour "{searchTerm}"
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 