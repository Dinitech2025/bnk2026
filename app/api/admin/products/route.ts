import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for authentication routes
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403 }
      )
    }

    // Trouver l'ID de la catégorie "Produits importés"
    const importedCategory = await prisma.productCategory.findFirst({
      where: { 
        OR: [
          { name: 'Produits importés' },
          { slug: 'produits-importes' }
        ]
      },
      select: { id: true }
    })

    const products = await prisma.product.findMany({
      where: {
        // Exclure les produits de la catégorie "Produits importés"
        categoryId: {
          not: importedCategory?.id
        }
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        images: {
          select: {
            id: true,
            path: true,
            alt: true
          }
        },
        variations: {
          include: {
            attributes: {
              select: {
                id: true,
                name: true,
                value: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculer l'inventaire total pour chaque produit et convertir les Decimals
    const productsWithTotalInventory = products.map((product) => {
      // Inventaire du produit principal
      const baseInventory = Number(product.inventory || 0)
      
      // Inventaire des variations
      const variationsInventory = product.variations.reduce((sum, variation) => {
        return sum + Number(variation.inventory || 0)
      }, 0)

      // Inventaire total
      const totalInventory = baseInventory + variationsInventory

      return {
        ...product,
        // Convertir les Decimals en nombres pour éviter les warnings React
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        weight: product.weight ? Number(product.weight) : null,
        totalInventory,
        variations: product.variations.map(variation => ({
          ...variation,
          price: Number(variation.price)
        }))
      }
    })

    return NextResponse.json(productsWithTotalInventory)

  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
} 