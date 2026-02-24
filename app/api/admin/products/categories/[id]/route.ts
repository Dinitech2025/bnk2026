import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary'
import slugify from 'slugify'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = params

    const category = await prisma.productCategory.findUnique({
      where: { id },
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
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Catégorie de produit non trouvée' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie de produit:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la catégorie de produit' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    // Récupérer la catégorie existante pour l'image
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id: params.id },
      select: { image: true }
    })

    const formData = await request.formData()
    
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const parentId = formData.get('parentId') as string || null
    const isVisible = formData.get('isVisible') === 'true'
    const imageFile = formData.get('image') as File | null
    const removeImage = formData.get('removeImage') === 'true'

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
      // Supprimer l'ancienne image si elle existe
      if (existingCategory?.image) {
        const publicId = existingCategory.image.split('/').pop()?.split('.')[0]
        if (publicId) {
          await deleteFromCloudinary(publicId)
        }
      }
      const imageUrl = await uploadToCloudinary(imageFile)
      data.image = imageUrl
    } else if (removeImage) {
      // Supprimer l'image existante de Cloudinary
      if (existingCategory?.image) {
        const publicId = existingCategory.image.split('/').pop()?.split('.')[0]
        if (publicId) {
          await deleteFromCloudinary(publicId)
        }
      }
      data.image = null
    }

    // Mettre à jour la catégorie
    const category = await prisma.productCategory.update({
      where: { id: params.id },
      data
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating product category:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour de la catégorie de produit' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = params

    // Vérifier si la catégorie existe
    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        children: true,
        products: true
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Catégorie de produit non trouvée' }, { status: 404 })
    }

    // Vérifier s'il y a des sous-catégories
    if (category.children.length > 0) {
      return NextResponse.json({ 
        error: 'Impossible de supprimer une catégorie qui contient des sous-catégories' 
      }, { status: 400 })
    }

    // Supprimer la catégorie (les produits perdront leur catégorie)
    await prisma.productCategory.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Catégorie de produit supprimée avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie de produit:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la catégorie de produit' },
      { status: 500 }
    )
  }
} 