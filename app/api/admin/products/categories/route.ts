import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary } from '@/lib/cloudinary'
import slugify from 'slugify'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const parentId = formData.get('parentId') as string || null
    const isVisible = formData.get('isVisible') === 'true'
    const imageFile = formData.get('image') as File | null

    // Créer le slug à partir du nom
    const slug = slugify(name, { lower: true, strict: true })

    // Préparer les données de base
    const data: any = {
      name,
      description,
      parentId,
      slug,
      isVisible
    }

    // Gérer l'upload d'image si présente
    if (imageFile) {
      const imageUrl = await uploadToCloudinary(imageFile)
      data.image = imageUrl
    }

    // Créer la catégorie de produit
    const category = await prisma.productCategory.create({
      data
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error creating product category:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création de la catégorie de produit' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const categories = await prisma.productCategory.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        children: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories de produits:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des catégories de produits' },
      { status: 500 }
    )
  }
} 