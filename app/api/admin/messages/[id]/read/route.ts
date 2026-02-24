import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Marquer un message comme lu
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const message = await prisma.message.update({
      where: { id: params.id },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        readAt: true,
      },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du message:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

