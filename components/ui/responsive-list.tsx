'use client'

import { cn } from '@/lib/utils'

interface ResponsiveListProps {
  children: React.ReactNode
  gridChildren: React.ReactNode
  className?: string
}

export function ResponsiveList({ children, gridChildren, className }: ResponsiveListProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Table pour desktop */}
      <div className="hidden lg:block rounded-lg border">
        {children}
      </div>
      
      {/* Grille pour tablette et mobile */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {gridChildren}
        </div>
      </div>
    </div>
  )
} 