import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Eye, 
  Pencil, 
  Trash2,
  Clock,
  DollarSign,
  Tag,
  Image as ImageIcon
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatPrice } from '@/lib/utils'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  slug: string
}

interface Service {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  duration: number
  published: boolean
  category: Category | null
  images: {
    id: string
    path: string
    alt: string | null
  }[]
  pricingType?: 'FIXED' | 'NEGOTIABLE' | 'RANGE' | 'QUOTE_REQUIRED'
}

interface ServiceCardProps {
  service: Service
  onDelete: (id: string) => void
  isActionLoading: string | null
}

export function ServiceCard({ service, onDelete, isActionLoading }: ServiceCardProps) {
  const getStatusBadge = (published: boolean) => {
    return published ? (
      <Badge variant="success">Publié</Badge>
    ) : (
      <Badge variant="secondary">Brouillon</Badge>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
          {service.images[0]?.path ? (
            <Image 
              src={service.images[0].path} 
              alt={service.name}
              width={48}
              height={48}
              className="object-cover"
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-gray-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{service.name}</h3>
              {service.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {service.description}
                </p>
              )}
            </div>
            <div className="ml-2 flex-shrink-0">
              {getStatusBadge(service.published)}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <DollarSign className="h-4 w-4 mr-1" />
                {service.pricingType === 'QUOTE_REQUIRED' ? (
                  <span className="font-medium text-orange-600">Sur devis</span>
                ) : (
                  <span className="font-medium"><PriceWithConversion price={Number(service.price)} /></span>
                )}
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                <span>{service.duration} min</span>
              </div>
            </div>

            {service.category && (
              <div className="flex items-center text-sm text-gray-600">
                <Tag className="h-4 w-4 mr-1" />
                <span>{service.category.name}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-end space-x-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 px-2"
            >
              <Link href={`/admin/services/${service.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 px-2"
            >
              <Link href={`/admin/services/${service.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(service.id)}
              disabled={isActionLoading === service.id}
              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 