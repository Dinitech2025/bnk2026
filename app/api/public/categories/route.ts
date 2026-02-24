import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Récupérer les catégories de produits avec leurs sous-catégories
    const productCategories = await prisma.productCategory.findMany({
      where: {
        parentId: null, // Seulement les catégories principales
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
            _count: {
              select: {
                products: true
              }
            }
          },
          orderBy: {
            name: 'asc'
          },
          take: 8 // Limiter les sous-catégories
        },
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
      take: 8 // Limiter à 8 catégories principales pour le menu
    })

    // Récupérer les catégories de services avec leurs sous-catégories
    const serviceCategories = await prisma.serviceCategory.findMany({
      where: {
        parentId: null, // Seulement les catégories principales
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
            _count: {
              select: {
                services: true
              }
            }
          },
          orderBy: {
            name: 'asc'
          },
          take: 8 // Limiter les sous-catégories
        },
        _count: {
          select: {
            services: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
      take: 8 // Limiter à 8 catégories principales pour le menu
    })

    return NextResponse.json({
      products: productCategories,
      services: serviceCategories
    })
  } catch (error) {
    console.error('[CATEGORIES_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 