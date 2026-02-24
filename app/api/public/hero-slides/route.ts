import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Récupérer les slides actifs pour le public
export async function GET() {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })
    
    return NextResponse.json(slides)
  } catch (error) {
    console.error('❌ Erreur slides:', error)
    return NextResponse.json([], { status: 200 })
  }
}
