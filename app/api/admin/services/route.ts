import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering for authentication routes
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const services = await prisma.service.findMany({
      where: {
        published: true // Seulement les services publiés
      },
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
          },
          take: 1 // Seulement la première image
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des services' },
      { status: 500 }
    )
  }
} 