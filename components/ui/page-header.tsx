'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, X as XIcon, Plus, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  count?: number
  searchTerm?: string
  onSearchChange?: (value: string) => void
  onClearSearch?: () => void
  onRefresh?: () => void
  isRefreshing?: boolean
  backHref?: string
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ 
  title, 
  count, 
  searchTerm, 
  onSearchChange, 
  onClearSearch,
  onRefresh,
  isRefreshing,
  backHref,
  actions,
  children,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-3 sm:space-y-4", className)}>
      {/* En-tête principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {backHref && (
            <Button 
              variant="ghost" 
              size="sm"
              asChild
              className="p-1 sm:p-2"
            >
              <Link href={backHref}>
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          )}
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">
            {title} {count !== undefined && (
              <span className="text-sm sm:text-base text-muted-foreground">({count})</span>
            )}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          )}
          {actions}
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      {(onSearchChange || children) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          {onSearchChange && (
            <div className="relative flex-1 max-w-full sm:max-w-sm">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-7 sm:pl-8 h-7 sm:h-8 text-xs sm:text-sm"
              />
              {searchTerm && onClearSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-2"
                  onClick={onClearSearch}
                >
                  <XIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  )
} 