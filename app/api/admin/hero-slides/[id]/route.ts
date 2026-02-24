import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer un slide spécifique
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slide = await prisma.heroSlide.findUnique({
      where: { id: params.id }
    })

    if (!slide) {
      return NextResponse.json({ error: 'Slide non trouvé' }, { status: 404 })
    }

    return NextResponse.json(slide)
  } catch (error) {
    console.error('Erreur lors de la récupération du slide:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du slide' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un slide
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, image, buttonText, buttonLink, isActive, order } = body

    const slide = await prisma.heroSlide.update({
      where: { id: params.id },
      data: {
        title,
        description,
        image,
        buttonText,
        buttonLink,
        isActive,
        order
      }
    })

    return NextResponse.json(slide)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du slide:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du slide' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un slide
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    await prisma.heroSlide.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Slide supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du slide:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du slide' },
      { status: 500 }
    )
  }
}
