import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Decimal } from '@prisma/client/runtime/library'

interface CreateProductFromSimulationRequest {
  productInfo: {
    name: string
    url?: string
    specifications?: string
    weight: number
    volume?: number
    mode: string
    warehouse: string
  }
  costs: {
    supplierPrice: {
      amount: number
      currency: string
      amountInMGA: number
    }
    transport: {
      amount: number
      currency: string
      amountInMGA: number
      details: string
    }
    commission: {
      amount: number
      currency: string
      amountInMGA: number
      rate: number
      details: string
    }
    fees: {
      processing: {
        amount: number
        currency: string
        amountInMGA: number
      }
      tax: {
        amount: number
        currency: string
        amountInMGA: number
        rate: number
      }
    }
    total: number
  }
  calculationMethod: string
  transitTime: string
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const data: CreateProductFromSimulationRequest = await request.json()

    // Générer un SKU unique basé sur le nom du produit
    const generateSKU = (name: string): string => {
      const cleanName = name
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(' ')
        .map(word => word.substring(0, 3).toUpperCase())
        .join('')
        .substring(0, 8)
      
      const timestamp = Date.now().toString().slice(-4)
      return `${cleanName}${timestamp}`
    }

    // Générer un slug unique basé sur le nom du produit
    const generateSlug = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    }

    const sku = generateSKU(data.productInfo.name)
    const slug = generateSlug(data.productInfo.name)

    // Fonction pour arrondir les prix en Ariary à l'ordre de 100 Ar
    const roundToHundred = (amount: number): number => {
      return Math.round(amount / 100) * 100
    }

    // Arrondir le prix total
    const roundedTotalPrice = roundToHundred(data.costs.total)

    // Vérifier l'unicité du SKU et du slug
    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: sku },
          { slug: slug }
        ]
      }
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Un produit avec ce nom ou SKU existe déjà' },
        { status: 400 }
      )
    }

    // Trouver ou créer la catégorie "Produits importés"
    let category = await prisma.productCategory.findFirst({
      where: { name: 'Produits importés' }
    })

    if (!category) {
      category = await prisma.productCategory.create({
        data: {
          name: 'Produits importés',
          slug: 'produits-importes',
          description: 'Produits importés depuis l\'étranger'
        }
      })
    }

    // Créer le produit
    const product = await prisma.product.create({
      data: {
        name: data.productInfo.name,
        slug: slug,
        description: `Produit importé via ${data.productInfo.mode === 'air' ? 'transport aérien' : 'transport maritime'} depuis ${data.productInfo.warehouse}.\n\n${data.productInfo.specifications ? `Spécifications:\n${data.productInfo.specifications}\n\n` : ''}Coût d'importation calculé: ${roundedTotalPrice.toLocaleString('fr-FR')} Ar\nDélai de livraison: ${data.transitTime}`,
        price: new Decimal(roundedTotalPrice),
        sku: sku,
        inventory: 0,
        weight: new Decimal(data.productInfo.weight),
        published: false, // Créé en brouillon par défaut
        featured: false,
        categoryId: category.id,
        attributes: {
          create: [
            // Informations fournisseur
            {
              name: 'supplierPrice',
              value: data.costs.supplierPrice.amount.toString()
            },
            {
              name: 'supplierCurrency',
              value: data.costs.supplierPrice.currency
            },
            // Informations d'importation
            {
              name: 'warehouse',
              value: data.productInfo.warehouse
            },
            {
              name: 'transportMode',
              value: data.productInfo.mode
            },
            {
              name: 'weight',
              value: data.productInfo.weight.toString()
            },
            {
              name: 'importCost',
              value: roundedTotalPrice.toString()
            },
            {
              name: 'transitTime',
              value: data.transitTime
            },
            // Détails des coûts
            {
              name: 'transportCost',
              value: data.costs.transport.amountInMGA.toString()
            },
            {
              name: 'commissionRate',
              value: data.costs.commission.rate.toString()
            },
            {
              name: 'commissionAmount',
              value: data.costs.commission.amountInMGA.toString()
            },
            {
              name: 'processingFees',
              value: data.costs.fees.processing.amountInMGA.toString()
            },
            {
              name: 'taxRate',
              value: data.costs.fees.tax.rate.toString()
            },
            {
              name: 'taxAmount',
              value: data.costs.fees.tax.amountInMGA.toString()
            },
            {
              name: 'calculationMethod',
              value: data.calculationMethod
            },
            // URL du produit si fournie
            ...(data.productInfo.url ? [{
              name: 'productUrl',
              value: data.productInfo.url
            }] : []),
            // Spécifications si fournies
            ...(data.productInfo.specifications ? [{
              name: 'specifications',
              value: data.productInfo.specifications
            }] : []),
            // Volume si fourni (transport maritime)
            ...(data.productInfo.volume ? [{
              name: 'volume',
              value: data.productInfo.volume.toString()
            }] : [])
          ]
        }
      },
      include: {
        attributes: true,
        category: true
      }
    })

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        slug: product.slug,
        price: roundedTotalPrice,
        published: product.published
      },
      message: 'Produit créé avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la création du produit:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du produit' },
      { status: 500 }
    )
  }
} 