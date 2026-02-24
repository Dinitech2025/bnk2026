import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Version de test sans authentification
export async function GET() {
  try {
    console.log('🔍 Test API slides - début')
    
    // Test de connexion Prisma
    console.log('📊 Test de connexion à la base...')
    await prisma.$connect()
    console.log('✅ Connexion Prisma réussie')
    
    // Test si la table existe
    console.log('📋 Test d\'existence de la table HeroSlide...')
    const slides = await prisma.heroSlide.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })
    
    console.log(`✅ ${slides.length} slides trouvés`)
    
    return NextResponse.json({
      success: true,
      count: slides.length,
      slides: slides,
      message: 'Test API slides réussi'
    })
  } catch (error) {
    console.error('❌ Erreur test API slides:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : null,
      message: 'Erreur lors du test API slides'
    }, { status: 500 })
  }
}
