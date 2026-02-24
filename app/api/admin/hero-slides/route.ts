import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer tous les slides
export async function GET() {
  try {
    console.log('🔍 API admin/hero-slides - début')
    
    // Test de connexion Prisma
    console.log('📊 Test de connexion à la base...')
    await prisma.$connect()
    console.log('✅ Connexion Prisma réussie')
    
    const slides = await prisma.heroSlide.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    console.log(`✅ ${slides.length} slides récupérés`)
    return NextResponse.json(slides)
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des slides:', error)
    console.error('Stack trace:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des slides',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : null
      },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau slide
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, image, buttonText, buttonLink, isActive, order } = body

    if (!title || !image || !buttonLink) {
      return NextResponse.json(
        { error: 'Titre, image et lien du bouton sont requis' },
        { status: 400 }
      )
    }

    const slide = await prisma.heroSlide.create({
      data: {
        title,
        description,
        image,
        buttonText: buttonText || 'Découvrir',
        buttonLink,
        isActive: isActive ?? true,
        order: order ?? 0
      }
    })

    return NextResponse.json(slide, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du slide:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du slide' },
      { status: 500 }
    )
  }
}
