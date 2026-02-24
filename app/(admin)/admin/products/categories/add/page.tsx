import { prisma } from '@/lib/prisma'
import { CategoryForm } from '@/components/categories/category-form'

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

export default async function AddCategoryPage() {
  const categories = await getCategories()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ajouter une catégorie</h1>
        <p className="text-sm text-gray-500">Créez une nouvelle catégorie pour organiser vos produits.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <CategoryForm categories={categories} />
      </div>
    </div>
  )
} 