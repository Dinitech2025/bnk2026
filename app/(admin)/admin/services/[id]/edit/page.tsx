import { prisma } from '@/lib/prisma'
import { ServiceForm } from '@/components/services/service-form'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import slugify from 'slugify'

interface EditServicePageProps {
  params: {
    id: string
  }
}

async function getCategories() {
  return await prisma.serviceCategory.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      parentId: true,
      image: true
    },
    orderBy: {
      name: 'asc'
    }
  })
}

async function getService(id: string) {
  return await prisma.service.findUnique({
    where: { id },
    include: {
      images: {
        select: {
          path: true
        }
      }
    }
  })
}

export default async function EditServicePage({ params }: EditServicePageProps) {
  const [service, categories] = await Promise.all([
    getService(params.id),
    getCategories()
  ])

  if (!service) {
    notFound()
  }

  async function onSubmit(data: any) {
    'use server'
    
    const updatedService = await prisma.service.update({
      where: { id: params.id },
      data: {
        name: data.name,
        slug: slugify(data.name, { lower: true }),
        description: data.description,
        price: parseFloat(data.price),
        duration: parseInt(data.duration),
        categoryId: data.categoryId,
        published: data.published,
        images: {
          deleteMany: {},
          create: data.images?.map((image: { path: string }) => ({
            path: image.path
          })) || []
        }
      }
    })

    revalidatePath('/admin/services')
    redirect('/admin/services')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modifier le service</h1>
        <p className="text-sm text-gray-500">
          Modifiez les informations de votre service
        </p>
      </div>
      <ServiceForm
        initialData={service}
        categories={categories}
        onSubmit={onSubmit}
      />
    </div>
  )
} 