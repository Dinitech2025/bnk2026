import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for authentication routes
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const search = searchParams.get('search')
    const category = searchParams.get('category')

    // Si un ID spécifique est demandé
    if (id) {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          images: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          variations: {
            select: {
              inventory: true,
            },
          },
        },
      })
      
      if (product) {
        const variationsStock = product.variations.reduce((sum, variation) => sum + variation.inventory, 0)
        const totalStock = product.inventory + variationsStock
        
        // Transformer les images pour l'API publique
        const transformedImages = product.images.map((image: any) => ({
          url: image.path,
          alt: image.alt || null,
          type: image.type || 'image',
          thumbnail: image.thumbnail || null,
          duration: image.duration || null,
        }))
        
        const productWithTotalStock = {
          ...product,
          stock: totalStock,
          images: transformedImages,
          // Inclure tous les champs de tarification pour les enchères et autres types
          pricingType: product.pricingType || 'FIXED',
          minPrice: product.minPrice,
          maxPrice: product.maxPrice,
          requiresQuote: product.requiresQuote,
          autoAcceptNegotiation: product.autoAcceptNegotiation,
          auctionEndDate: product.auctionEndDate,
          minimumBid: product.minimumBid,
          currentHighestBid: product.currentHighestBid,
          variations: undefined, // Supprimer les variations de la réponse publique
        }
        
        return NextResponse.json([productWithTotalStock])
      }
      
      return NextResponse.json([])
    }

    // Construction de la requête de base
    const whereClause: any = {
      published: true,
      OR: [
        {
          categoryId: null, // Produits sans catégorie
        },
        {
          category: {
            isVisible: true, // Produits des catégories visibles
          },
        },
      ],
    }

    // Ajout des filtres de recherche
    if (search) {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
      ]
    }

    // Filtre par catégorie
    if (category && category !== 'all') {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          categoryId: category,
        },
      ]
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        images: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        variations: {
          select: {
            inventory: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculer le stock total pour chaque produit
    const productsWithTotalStock = products.map(product => {
      const variationsStock = product.variations.reduce((sum, variation) => sum + variation.inventory, 0)
      const totalStock = product.inventory + variationsStock
      
      // Transformer les images pour l'API publique
      const transformedImages = product.images.map((image: any) => ({
        url: image.path,
        alt: image.alt || null,
        type: image.type || 'image',
        thumbnail: image.thumbnail || null,
        duration: image.duration || null,
      }))
      
      return {
        ...product,
        stock: totalStock, // Ajouter le stock total calculé
        images: transformedImages,
        // Inclure tous les champs de tarification
        pricingType: product.pricingType || 'FIXED',
        minPrice: product.minPrice,
        maxPrice: product.maxPrice,
        requiresQuote: product.requiresQuote,
        autoAcceptNegotiation: product.autoAcceptNegotiation,
        auctionEndDate: product.auctionEndDate,
        minimumBid: product.minimumBid,
        currentHighestBid: product.currentHighestBid,
        // Garder aussi inventory pour compatibilité
        variations: undefined, // Supprimer les variations de la réponse publique
      }
    })

    return NextResponse.json(productsWithTotalStock)
  } catch (error) {
    console.error('[PRODUCTS_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 