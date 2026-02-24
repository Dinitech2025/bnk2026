import { prisma } from '@/lib/prisma'
import { ProductFormEnhanced } from '@/components/products/product-form-enhanced'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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

export default async function AddProductEnhancedPage() {
  const categories = await getCategories()

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
          <h1 className="text-3xl font-bold tracking-tight">Nouveau produit</h1>
          <p className="text-muted-foreground">
            Créez un nouveau produit avec toutes ses caractéristiques
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <ProductFormEnhanced categories={categories} />
    </div>
  )
}




