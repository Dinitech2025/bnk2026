import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const data = await request.json()
    
    const deliveryMethod = await prisma.deliveryMethod.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        isActive: data.isActive,
        apiConfig: data.apiConfig,
        estimatedDays: data.estimatedDays,
        icon: data.icon
      }
    })

    return NextResponse.json(deliveryMethod)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la méthode de livraison:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la méthode de livraison' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    await prisma.deliveryMethod.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression de la méthode de livraison:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la méthode de livraison' },
      { status: 500 }
    )
  }
}
