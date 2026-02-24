import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const deliveryMethods = await prisma.deliveryMethod.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        pricingRules: {
          include: {
            deliveryZone: true
          }
        }
      }
    })

    return NextResponse.json(deliveryMethods)
  } catch (error) {
    console.error('Erreur lors de la récupération des méthodes de livraison:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des méthodes de livraison' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const data = await request.json()
    
    const deliveryMethod = await prisma.deliveryMethod.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        isActive: data.isActive,
        apiConfig: data.apiConfig,
        estimatedDays: data.estimatedDays,
        icon: data.icon || 'truck'
      }
    })

    return NextResponse.json(deliveryMethod)
  } catch (error) {
    console.error('Erreur lors de la création de la méthode de livraison:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la méthode de livraison' },
      { status: 500 }
    )
  }
}