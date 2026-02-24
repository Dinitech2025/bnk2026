import { prisma } from '@/lib/prisma'
import { CategoryForm } from '@/components/categories/category-form'
import { notFound } from 'next/navigation'

interface EditCategoryPageProps {
  params: {
    id: string
  }
}

async function getCategory(id: string) {
  const category = await prisma.productCategory.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      parentId: true,
      image: true
    }
  })

  if (!category) {
    notFound()
  }

  return category
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

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const [category, categories] = await Promise.all([
    getCategory(params.id),
    getCategories()
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modifier la catégorie</h1>
        <p className="text-sm text-gray-500">Modifiez les informations de la catégorie.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <CategoryForm 
          categories={categories} 
          initialData={category}
        />
      </div>
    </div>
  )
} 