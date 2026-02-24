import { prisma } from '@/lib/prisma'
import { ProductFormEnhanced } from '@/components/products/product-form-enhanced'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface EditProductPageProps {
  params: {
    id: string
  }
}

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: {
          createdAt: 'asc'
        }
      },
      attributes: true,
      variations: {
        include: {
          attributes: true,
          images: true
        }
      }
    }
  })

  if (!product) {
    notFound()
  }

  return product
}

async function getCategories() {
  return await prisma.productCategory.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  })
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const [product, categories] = await Promise.all([
    getProduct(params.id),
    getCategories()
  ])

  return (
    <div className="space-y-6 pb-16">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modifier le produit</h1>
          <p className="text-muted-foreground">{product.name}</p>
        </div>
      </div>

      {/* Formulaire Amélioré */}
      <ProductFormEnhanced 
        categories={categories} 
        initialData={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          sku: product.sku,
          price: Number(product.price),
          compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
          inventory: product.inventory,
          categoryId: product.categoryId,
          published: product.published,
          featured: product.featured,
          barcode: product.barcode,
          weight: product.weight ? Number(product.weight) : null,
          dimensions: product.dimensions,
          pricingType: product.pricingType as 'FIXED' | 'RANGE' | 'NEGOTIABLE' | 'QUOTE_REQUIRED',
          minPrice: product.minPrice ? Number(product.minPrice) : null,
          maxPrice: product.maxPrice ? Number(product.maxPrice) : null,
          requiresQuote: product.requiresQuote,
          autoAcceptNegotiation: product.autoAcceptNegotiation,
          images: product.images.map(img => ({
            id: img.id,
            path: img.path,
            alt: img.alt || undefined
          })),
          variations: product.variations.map(variation => ({
            id: variation.id,
            sku: variation.sku || undefined,
            price: Number(variation.price),
            inventory: variation.inventory,
            attributes: variation.attributes,
            images: variation.images.map(img => ({
              id: img.id,
              path: img.path,
              alt: img.alt || undefined
            }))
          })),
          attributes: product.attributes
        }}
      />
    </div>
  )
} 