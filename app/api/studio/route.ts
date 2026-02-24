import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { spawn } from 'child_process'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    // Vérifier si l'utilisateur est admin
    if (!user || user.role !== 'ADMIN') {
      return new NextResponse('Non autorisé', { status: 403 })
    }

    // Lancer Prisma Studio
    const studio = spawn('npx', ['prisma', 'studio'])
    
    return new NextResponse('Prisma Studio lancé sur http://localhost:5555', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error('Erreur lors du lancement de Prisma Studio:', error)
    return new NextResponse('Erreur interne du serveur', { status: 500 })
  }
}