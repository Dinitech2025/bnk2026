import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Récupérer une tâche spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const task = await db.task.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
        relatedUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        relatedSubscription: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            offer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        relatedAccount: {
          select: {
            id: true,
            username: true,
            email: true,
            expiresAt: true,
            status: true,
            platform: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Erreur lors de la récupération de la tâche:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour une tâche
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      type,
      priority,
      status,
      dueDate,
      completedAt,
      assignedToId,
      relatedUserId,
      relatedSubscriptionId,
      relatedAccountId,
      isRecurring,
      recurrenceType,
      recurrenceValue,
      metadata,
      notes,
    } = body

    // Si le statut passe à COMPLETED, définir completedAt
    const updateData: any = {
      title,
      description,
      type,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedToId,
      relatedUserId,
      relatedSubscriptionId,
      relatedAccountId,
      isRecurring,
      recurrenceType,
      recurrenceValue,
      metadata,
      notes,
    }

    if (status === 'COMPLETED' && !completedAt) {
      updateData.completedAt = new Date()
    } else if (status !== 'COMPLETED') {
      updateData.completedAt = null
    }

    // Supprimer les valeurs undefined
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    )

    const task = await db.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        relatedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une tâche
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await db.task.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Tâche supprimée avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

