import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Récupérer tous les paramètres
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403 }
      )
    }

    const settings = await db.importCalculationSettings.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour les paramètres
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403 }
      )
    }

    const { settings } = await request.json()

    if (!Array.isArray(settings)) {
      return new NextResponse(
        JSON.stringify({ error: 'Format de données invalide' }),
        { status: 400 }
      )
    }

    // Mettre à jour chaque paramètre
    for (const setting of settings) {
      await db.importCalculationSettings.update({
        where: { key: setting.key },
        data: {
          value: setting.value,
          description: setting.description,
          category: setting.category
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
} 