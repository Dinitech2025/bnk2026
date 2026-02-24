import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ProductVariationsManager from '@/components/products/product-variations-manager-client'

interface VariationsPageProps {
  params: {
    id: string
  }
}

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variations: {
        include: {
          attributes: true,
          images: true
        }
      },
      attributes: true
    }
  })

  if (!product) {
    notFound()
  }

  return product
}

export default async function VariationsPage({ params }: VariationsPageProps) {
  const product = await getProduct(params.id)

  if (!product) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href={`/admin/products/${params.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Variations de {product.name}</h1>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <ProductVariationsManager 
          productId={product.id} 
          initialVariations={product.variations} 
          productAttributes={product.attributes}
        />
      </div>
    </div>
  )
} 
 