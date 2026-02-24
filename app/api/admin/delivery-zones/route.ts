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

    const deliveryZones = await prisma.deliveryZone.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        pricingRules: {
          include: {
            deliveryMethod: true
          }
        }
      }
    })

    return NextResponse.json(deliveryZones)
  } catch (error) {
    console.error('Erreur lors de la récupération des zones de livraison:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des zones de livraison' },
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
    
    const deliveryZone = await prisma.deliveryZone.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        areas: data.areas,
        isActive: data.isActive
      }
    })

    return NextResponse.json(deliveryZone)
  } catch (error) {
    console.error('Erreur lors de la création de la zone de livraison:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la zone de livraison' },
      { status: 500 }
    )
  }
}