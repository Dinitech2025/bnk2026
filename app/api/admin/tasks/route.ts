import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Récupérer toutes les tâches avec filtres
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')
    const assignedToId = searchParams.get('assignedToId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (status) where.status = status
    if (type) where.type = type
    if (priority) where.priority = priority
    if (assignedToId) where.assignedToId = assignedToId

    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
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
            },
          },
          relatedAccount: {
            select: {
              id: true,
              username: true,
              email: true,
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
        orderBy: [
          { status: 'asc' },
          { priority: 'desc' },
          { dueDate: 'asc' },
        ],
        skip,
        take: limit,
      }),
      db.task.count({ where }),
    ])

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle tâche
export async function POST(request: NextRequest) {
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

    // Validation
    if (!title || !type) {
      return NextResponse.json(
        { error: 'Le titre et le type sont requis' },
        { status: 400 }
      )
    }

    const task = await db.task.create({
      data: {
        title,
        description,
        type,
        priority: priority || 'MEDIUM',
        status: status || 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId,
        createdById: session.user.id,
        relatedUserId,
        relatedSubscriptionId,
        relatedAccountId,
        isRecurring: isRecurring || false,
        recurrenceType,
        recurrenceValue,
        metadata,
        notes,
      },
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

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

