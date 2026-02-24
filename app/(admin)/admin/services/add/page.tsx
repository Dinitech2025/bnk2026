import { prisma } from '@/lib/prisma'
import { EnhancedServiceForm } from '@/components/services/enhanced-service-form'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Service } from '@prisma/client'
import slugify from 'slugify'
import { Metadata } from 'next'

// Force dynamic rendering to avoid useRef SSR issues
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Ajouter un service | Admin',
  description: 'Créez un nouveau service pour votre plateforme',
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

export default async function AddServicePage() {
  const categories = await getCategories()

  async function onSubmit(data: any) {
    'use server'
    
    try {
      // Validation des données
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('Le nom du service est requis')
      }

      const price = parseFloat(data.price)
      const duration = parseInt(data.duration)

      if (isNaN(price) || price <= 0) {
        throw new Error('Le prix doit être un nombre positif')
      }

      if (isNaN(duration) || duration <= 0) {
        throw new Error('La durée doit être un nombre positif')
      }

      // Vérifier l'unicité du slug
      const slug = slugify(data.name, { lower: true, strict: true })
      const existingService = await prisma.service.findUnique({
        where: { slug }
      })

      if (existingService) {
        throw new Error('Un service avec ce nom existe déjà')
      }

      // Créer le service
      const service = await prisma.service.create({
        data: {
          name: data.name.trim(),
          slug,
          description: data.description?.trim() || null,
          price,
          duration,
          categoryId: data.categoryId || null,
          published: Boolean(data.published),
          images: {
            create: data.images?.map((image: { path: string }) => ({
              path: image.path
            })) || []
          }
        },
        include: {
          images: true,
          category: true
        }
      })

      console.log('Service créé avec succès:', service.id)
      
      revalidatePath('/admin/services')
      revalidatePath('/services')
      redirect('/admin/services')
    } catch (error) {
      console.error('Erreur lors de la création du service:', error)
      throw error
    }
  }

  return (
    <div className="container mx-auto py-6">
      <EnhancedServiceForm
        categories={categories}
        onSubmit={onSubmit}
      />
    </div>
  )
} 