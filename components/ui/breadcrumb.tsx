import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center space-x-2 text-sm", className)} aria-label="Breadcrumb">
      <Link 
        href="/" 
        className="flex items-center text-gray-600 hover:text-primary transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {item.href && !item.current ? (
            <Link 
              href={item.href} 
              className="text-gray-600 hover:text-primary transition-colors font-medium"
            >
              {item.label}
            </Link>
          ) : (
            <span className={cn(
              "font-medium",
              item.current ? "text-gray-900" : "text-gray-600"
            )}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}

interface BreadcrumbHeaderProps {
  items: BreadcrumbItem[]
  title: string
  description?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function BreadcrumbHeader({ 
  items, 
  title, 
  description, 
  icon, 
  actions, 
  className 
}: BreadcrumbHeaderProps) {
  return (
    <div className={cn("bg-white border-b border-gray-200 shadow-sm", className)}>
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={items} className="mb-4" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="flex items-center">
              {icon && (
                <div className="mr-4">
                  {icon}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {title}
                </h1>
                {description && (
                  <p className="text-gray-600 mt-2 text-lg">{description}</p>
                )}
              </div>
            </div>
          </div>
          
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 