import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test simple de connexion à la base de données
    const userCount = await prisma.user.count()
    
    // Test si la table HeroSlide existe
    const slideCount = await prisma.heroSlide.count()
    
    return NextResponse.json({
      success: true,
      userCount,
      slideCount,
      message: 'Base de données connectée avec succès'
    })
  } catch (error) {
    console.error('Erreur de connexion DB:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      message: 'Erreur de connexion à la base de données'
    }, { status: 500 })
  }
}
