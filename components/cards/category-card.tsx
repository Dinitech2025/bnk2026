import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Eye, 
  Pencil, 
  Trash2,
  Folder,
  FolderOpen,
  Hash,
  Image as ImageIcon
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  image: string | null
  parent: {
    id: string
    name: string
  } | null
  children: {
    id: string
    name: string
  }[]
  _count: {
    services: number
    products: number
  }
}

interface CategoryCardProps {
  category: Category
  onDelete: (id: string) => void
  isActionLoading: string | null
}

export function CategoryCard({ category, onDelete, isActionLoading }: CategoryCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
          {category.image ? (
            <Image 
              src={category.image} 
              alt={category.name}
              width={48}
              height={48}
              className="object-cover"
            />
          ) : (
            <Folder className="h-6 w-6 text-gray-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {category.description}
                </p>
              )}
            </div>
            <div className="ml-2 flex-shrink-0">
              {category.parent ? (
                <Badge variant="secondary">Sous-catégorie</Badge>
              ) : (
                <Badge variant="outline">Principale</Badge>
              )}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {category.parent && (
              <div className="flex items-center text-sm text-gray-600">
                <FolderOpen className="h-4 w-4 mr-1" />
                <span>Parent: {category.parent.name}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <Hash className="h-4 w-4 mr-1" />
                <span>{category._count.services} services</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Hash className="h-4 w-4 mr-1" />
                <span>{category._count.products} produits</span>
              </div>
            </div>

            {category.children.length > 0 && (
              <div className="flex items-center text-sm text-gray-600">
                <Folder className="h-4 w-4 mr-1" />
                <span>{category.children.length} sous-catégories</span>
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
              <Link href={`/admin/services/categories/${category.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 px-2"
            >
              <Link href={`/admin/services/categories/${category.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(category.id)}
              disabled={isActionLoading === category.id}
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