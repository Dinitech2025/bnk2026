import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer tous les employés (ADMIN et STAFF) sauf l'utilisateur actuel
    const employees = await prisma.user.findMany({
      where: {
        AND: [
          {
            role: { in: ['ADMIN', 'STAFF'] }
          },
          {
            id: { not: session.user.id }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true
      },
      orderBy: [
        { role: 'asc' }, // ADMIN en premier
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      employees
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des employés:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}


