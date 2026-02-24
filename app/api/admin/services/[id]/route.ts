import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    // Vérifier si le service existe
    const service = await prisma.service.findUnique({
      where: { id }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service non trouvé' }, { status: 404 })
    }

    // Supprimer le service
    await prisma.service.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Service supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du service:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du service' },
      { status: 500 }
    )
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

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        images: {
          select: {
            id: true,
            path: true,
            alt: true
          }
        },
        _count: {
          select: {
            orderItems: true
          }
        }
      }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service non trouvé' }, { status: 404 })
    }

    // Transformer les images pour avoir un format cohérent
    const transformedImages = service.images.map((image) => ({
      id: image.id,
      url: image.path, // Utiliser path comme url
      alt: image.alt
    }))

    // Retourner le service avec les images transformées et les comptages
    const serviceWithTransformedData = {
      ...service,
      images: transformedImages,
      _count: {
        orders: service._count.orderItems // Renommer pour correspondre à l'interface
      }
    }

    return NextResponse.json(serviceWithTransformedData)
  } catch (error) {
    console.error('Erreur lors de la récupération du service:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du service' },
      { status: 500 }
    )
  }
} 