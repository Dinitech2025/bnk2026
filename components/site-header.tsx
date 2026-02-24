'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSettings } from '@/lib/contexts/settings-context'
import { getSetting } from '@/lib/hooks/use-site-settings'
import { CurrencySelector } from '@/components/ui/currency-selector'
import { RefreshCw, ShoppingCart, Search, ChevronDown, X, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { UserMenu } from '@/components/user-menu'
import { DropdownMenuNavWithSubcategories } from '@/components/ui/dropdown-menu-nav-with-subcategories'
import { GlobalSearch } from '@/components/global-search'
import { useCart } from '@/lib/hooks/use-cart'

interface Category {
  id: string
  name: string
  _count?: {
    products?: number
    services?: number
  }
}

interface Platform {
  id: string
  name: string
  slug: string
  type: string
}

export function SiteHeader() {
  const { settings, isLoading, reloadSettings } = useSettings()
  const { cart } = useCart()
  const [isMounted, setIsMounted] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [openSubMenus, setOpenSubMenus] = useState<string[]>([])
  const [categories, setCategories] = useState<{ products: Category[], services: Category[] }>({ products: [], services: [] })
  const [platforms, setPlatforms] = useState<Platform[]>([])
  
  const siteName = getSetting(settings, 'siteName', 'Boutik\'nakà')
  const logoUrl = getSetting(settings, 'logoUrl', '')
  const useSiteLogo = getSetting(settings, 'useSiteLogo', 'false') === 'true'

  // Marquer le composant comme monté
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Charger les catégories et plateformes pour le menu mobile (avec cache)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, platformsRes] = await Promise.all([
          fetch('/api/public/categories', { 
            cache: 'force-cache',
            next: { revalidate: 300 } // 5 minutes
          }),
          fetch('/api/public/platforms', { 
            cache: 'force-cache',
            next: { revalidate: 300 } // 5 minutes
          })
        ])
        
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData)
        }
        
        if (platformsRes.ok) {
          const platformsData = await platformsRes.json()
          setPlatforms(platformsData)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      }
    }

    // Charger seulement si pas déjà chargé
    if (categories.products.length === 0 && categories.services.length === 0) {
      fetchData()
    }
  }, [])

  // Reduced logging during build to avoid spam
  if (process.env.NODE_ENV === 'development') {
    console.log('SiteHeader - Settings:', { siteName, logoUrl, useSiteLogo, settings })
  }



  // Toggle sous-menu
  const toggleSubMenu = (menuName: string) => {
    setOpenSubMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    )
  }

  // Ne pas rendre le composant côté serveur pour éviter l'hydratation mismatch
  if (!isMounted) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background shadow-md">
      <div className="container flex h-16 md:h-20 items-center justify-between px-4">
        {/* Logo à gauche */}
        <Link href="/" className="flex items-center space-x-2 flex-shrink-0 -ml-2 md:-ml-3 lg:-ml-4">
          {useSiteLogo && logoUrl ? (
            <div className="relative h-10 w-32 md:h-12 md:w-40 lg:h-14 lg:w-48">
              <Image
                src={logoUrl}
                alt={siteName}
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          ) : (
            <span className="text-lg md:text-xl font-bold truncate">{siteName}</span>
          )}
        </Link>

        {/* Menu centré - Caché sur mobile */}
        <nav className="hidden lg:flex items-center space-x-6">
          <Link
            href="/devis"
            className="text-sm xl:text-base font-medium transition-colors hover:text-primary whitespace-nowrap"
          >
            Faire un devis
          </Link>
          <DropdownMenuNavWithSubcategories
            title="Produits"
            href="/products"
            type="products"
          />
          <DropdownMenuNavWithSubcategories
            title="Services"
            href="/services"
            type="services"
          />
          <DropdownMenuNavWithSubcategories
            title="Abonnements"
            href="/subscriptions"
            type="platforms"
          />
        </nav>

        {/* Actions à droite */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Recherche - Visible sur tous les écrans */}
          <div className="relative">
            {showSearch ? (
              <GlobalSearch onClose={() => setShowSearch(false)} />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearch(true)}
                title="Rechercher"
                className="h-8 w-8 md:h-10 md:w-10 p-0"
              >
                <Search className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            )}
          </div>

          {/* Panier */}
          <Link href="/cart" className="relative">
            <Button variant="ghost" size="sm" className="relative h-8 w-8 md:h-10 md:w-10 p-0">
              <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
              {(cart?.itemCount || 0) > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 md:-top-2 md:-right-2 h-4 w-4 md:h-5 md:w-5 flex items-center justify-center p-0 text-xs"
                >
                  {(cart?.itemCount || 0) > 9 ? '9+' : (cart?.itemCount || 0)}
                </Badge>
              )}
            </Button>
          </Link>
          
          {/* Sélecteur de devise - Caché sur très petits écrans */}
          <div className="relative group hidden sm:block">
            <CurrencySelector className="w-16 md:w-20 lg:w-24" />
            <div className="absolute right-0 mt-1 w-40 md:w-48 p-2 bg-white shadow-lg rounded-md border hidden group-hover:block text-xs text-gray-500 z-50">
              Sélectionnez une devise pour voir les prix convertis
            </div>
          </div>
          
          <UserMenu />
          
          {/* Menu hamburger pour mobile */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Menu mobile - Navigation complète avec sous-menus */}
      <div className={`lg:hidden border-t bg-background/95 backdrop-blur-sm transition-all duration-300 ${showMobileMenu ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="container px-4 py-4 space-y-4">
          {/* Devis */}
          <Link 
            href="/devis" 
            className="block px-3 py-2 font-medium transition-colors hover:text-primary hover:bg-primary/10 rounded-md"
            onClick={() => setShowMobileMenu(false)}
          >
            Faire un devis
          </Link>
          
          {/* Produits avec sous-catégories */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSubMenu('products')}
              className="flex items-center justify-between w-full px-3 py-2 font-medium transition-colors hover:text-primary hover:bg-primary/10 rounded-md"
            >
              <span>Produits</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSubMenus.includes('products') ? 'rotate-180' : ''}`} />
            </button>
            <div className={`ml-4 space-y-2 transition-all duration-300 ${openSubMenus.includes('products') ? 'block' : 'hidden'}`}>
              <Link 
                href="/products" 
                className="block px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-primary/10 rounded-md"
                onClick={() => setShowMobileMenu(false)}
              >
                Tous les produits
              </Link>
              {categories.products.filter(cat => cat._count?.products && cat._count.products > 0).map((category) => (
                <Link 
                  key={category.id}
                  href={`/categories/${category.id}`} 
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-primary/10 rounded-md"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {category.name} ({category._count?.products})
                </Link>
              ))}
            </div>
          </div>
          
          {/* Services avec sous-catégories */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSubMenu('services')}
              className="flex items-center justify-between w-full px-3 py-2 font-medium transition-colors hover:text-primary hover:bg-primary/10 rounded-md"
            >
              <span>Services</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSubMenus.includes('services') ? 'rotate-180' : ''}`} />
            </button>
            <div className={`ml-4 space-y-2 transition-all duration-300 ${openSubMenus.includes('services') ? 'block' : 'hidden'}`}>
              <Link 
                href="/services" 
                className="block px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-primary/10 rounded-md"
                onClick={() => setShowMobileMenu(false)}
              >
                Tous les services
              </Link>
              {categories.services.filter(cat => cat._count?.services && cat._count.services > 0).map((category) => (
                <Link 
                  key={category.id}
                  href={`/categories/${category.id}`} 
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-primary/10 rounded-md"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {category.name} ({category._count?.services})
                </Link>
              ))}
            </div>
          </div>
          
          {/* Abonnements avec plateformes */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSubMenu('subscriptions')}
              className="flex items-center justify-between w-full px-3 py-2 font-medium transition-colors hover:text-primary hover:bg-primary/10 rounded-md"
            >
              <span>Abonnements</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSubMenus.includes('subscriptions') ? 'rotate-180' : ''}`} />
            </button>
            <div className={`ml-4 space-y-2 transition-all duration-300 ${openSubMenus.includes('subscriptions') ? 'block' : 'hidden'}`}>
              <Link 
                href="/subscriptions" 
                className="block px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-primary/10 rounded-md"
                onClick={() => setShowMobileMenu(false)}
              >
                Toutes les plateformes
              </Link>
              {platforms.slice(0, 6).map((platform) => (
                <Link 
                  key={platform.id}
                  href={`/subscriptions?platform=${platform.slug}`} 
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-primary/10 rounded-md"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {platform.name}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Sélecteur de devise mobile */}
          <div className="px-3 py-2 sm:hidden">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Devise :</span>
              <CurrencySelector className="w-20" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 
