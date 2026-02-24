import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Compter les messages non lus par utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const where: any = {
      status: 'UNREAD',
    }

    if (userId) {
      where.toUserId = userId
    }

    const count = await db.message.count({
      where,
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Erreur lors du comptage des messages non lus:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

