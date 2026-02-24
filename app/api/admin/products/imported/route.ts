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

    // Trouver la catégorie "Produits importés"
    const importedCategory = await prisma.productCategory.findFirst({
      where: { 
        OR: [
          { name: 'Produits importés' },
          { slug: 'produits-importes' }
        ]
      },
      select: { id: true }
    })

    if (!importedCategory) {
      return NextResponse.json([])
    }

    // Récupérer tous les produits de la catégorie "Produits importés"
    const products = await prisma.product.findMany({
      where: {
        categoryId: importedCategory.id
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
        attributes: {
          select: {
            id: true,
            name: true,
            value: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Traiter les produits importés
    const importedProducts = products
      .map(product => {
        // Extraire les attributs spécifiques aux produits importés
        const getAttributeValue = (name: string) => {
          const attr = product.attributes.find(a => a.name === name)
          return attr?.value
        }

        return {
          ...product,
          // Convertir les Decimals en nombres
          price: Number(product.price),
          compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
          weight: product.weight ? Number(product.weight) : null,
          inventory: Number(product.inventory),
          // Attributs spécifiques aux produits importés
          supplierPrice: getAttributeValue('supplierPrice') ? Number(getAttributeValue('supplierPrice')) : null,
          supplierCurrency: getAttributeValue('supplierCurrency'),
          warehouse: getAttributeValue('warehouse'),
          transportMode: getAttributeValue('transportMode'),
          importCost: getAttributeValue('importCost') ? Number(getAttributeValue('importCost')) : null,
          transitTime: getAttributeValue('transitTime')
        }
      })

    return NextResponse.json(importedProducts)

  } catch (error) {
    console.error('Erreur lors de la récupération des produits importés:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
} 