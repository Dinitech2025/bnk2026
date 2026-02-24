'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface SubCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  _count?: {
    products?: number
    services?: number
  }
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  children?: SubCategory[]
  _count?: {
    products?: number
    services?: number
  }
}

interface Platform {
  id: string
  name: string
  slug: string
  description?: string | null
  logo?: string | null
  type: string
  hasProfiles: boolean
  maxProfilesPerAccount?: number | null
  popularity?: number | null
}

interface DropdownMenuNavWithSubcategoriesProps {
  title: string
  href: string
  type: 'products' | 'services' | 'platforms'
}

export function DropdownMenuNavWithSubcategories({ title, href, type }: DropdownMenuNavWithSubcategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (type === 'platforms') {
          const response = await fetch('/api/public/platforms')
          if (response.ok) {
            const data = await response.json()
            setPlatforms(data)
          }
        } else {
          const response = await fetch('/api/public/categories')
          if (response.ok) {
            const data = await response.json()
            setCategories(type === 'products' ? data.products : data.services)
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [type])

  const renderCategoryItem = (category: Category) => {
    const count = type === 'products' ? category._count?.products : category._count?.services
    
    // Si la catégorie n'a pas de produits/services, ne pas l'afficher
    if (!count || count === 0) {
      return null
    }

    return (
      <DropdownMenuItem key={category.id} asChild>
        <Link href={`/categories/${category.id}`} className="flex items-center gap-3 w-full">
          {category.image && (
            <div className="relative h-8 w-8 rounded overflow-hidden flex-shrink-0">
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">{category.name}</div>
            {category.description && (
              <div className="text-xs text-muted-foreground truncate">
                {category.description}
              </div>
            )}
          </div>
          {count !== undefined && (
            <span className="text-xs text-muted-foreground flex-shrink-0 bg-secondary px-2 py-1 rounded-full">
              {count}
            </span>
          )}
        </Link>
      </DropdownMenuItem>
    )
  }

  const renderCategories = () => {
    if (isLoading) {
      return (
        <DropdownMenuItem disabled>
          Chargement...
        </DropdownMenuItem>
      )
    }

    if (categories.length === 0) {
      return (
        <DropdownMenuItem disabled>
          Aucune catégorie disponible
        </DropdownMenuItem>
      )
    }

    // Filtrer les catégories qui n'ont pas de produits/services
    const filteredCategories = categories.filter(category => {
      const count = type === 'products' ? category._count?.products : category._count?.services
      return count && count > 0
    })

    if (filteredCategories.length === 0) {
      return (
        <DropdownMenuItem disabled>
          Aucune catégorie avec des {type === 'products' ? 'produits' : 'services'} disponible
        </DropdownMenuItem>
      )
    }

    return filteredCategories.map((category) => renderCategoryItem(category)).filter(Boolean)
  }

  const renderPlatforms = () => {
    if (isLoading) {
      return (
        <DropdownMenuItem disabled>
          Chargement...
        </DropdownMenuItem>
      )
    }

    if (platforms.length === 0) {
      return (
        <DropdownMenuItem disabled>
          Aucune plateforme disponible
        </DropdownMenuItem>
      )
    }

    // Grouper par type
    const videoplatforms = platforms.filter(p => p.type === 'VIDEO')
    const musicPlatforms = platforms.filter(p => p.type === 'MUSIC')
    const otherPlatforms = platforms.filter(p => !['VIDEO', 'MUSIC'].includes(p.type))

    const renderPlatformGroup = (platformList: Platform[], groupTitle?: string) => (
      <>
        {groupTitle && (
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted rounded-md mx-2 my-1">
            {groupTitle}
          </div>
        )}
        {platformList.map((platform) => (
          <DropdownMenuItem key={platform.id} asChild>
            <Link href={`/subscriptions?platform=${platform.slug}`} className="flex items-center gap-3 w-full">
              {platform.logo && (
                <div className="relative h-8 w-8 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={platform.logo}
                    alt={platform.name}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{platform.name}</div>
                {platform.description && (
                  <div className="text-xs text-muted-foreground truncate">
                    {platform.description}
                  </div>
                )}
              </div>
              {platform.hasProfiles && platform.maxProfilesPerAccount && (
                <span className="text-xs text-muted-foreground flex-shrink-0 bg-secondary px-2 py-1 rounded-full">
                  {platform.maxProfilesPerAccount} profils
                </span>
              )}
            </Link>
          </DropdownMenuItem>
        ))}
      </>
    )

    return (
      <>
        {videoplatforms.length > 0 && renderPlatformGroup(videoplatforms, 'Streaming Vidéo')}
        {musicPlatforms.length > 0 && (
          <>
            {videoplatforms.length > 0 && <DropdownMenuSeparator />}
            {renderPlatformGroup(musicPlatforms, 'Streaming Musical')}
          </>
        )}
        {otherPlatforms.length > 0 && (
          <>
            {(videoplatforms.length > 0 || musicPlatforms.length > 0) && <DropdownMenuSeparator />}
            {renderPlatformGroup(otherPlatforms, 'Autres')}
          </>
        )}
      </>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Link 
          href={href}
          className="flex items-center gap-1 text-base font-medium transition-colors hover:text-primary"
        >
          {title}
          <ChevronDown className="h-4 w-4" />
        </Link>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuItem asChild>
          <Link href={href} className="font-semibold">
            Voir tout - {title}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {type === 'platforms' ? renderPlatforms() : renderCategories()}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 