import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

interface CreateProductFromQuoteRequest {
  productInfo: {
    name: string
    url?: string
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
    const data: CreateProductFromQuoteRequest = await request.json()

    // Validation des données
    if (!data.productInfo?.name || !data.costs?.total || data.costs.total <= 0) {
      return NextResponse.json(
        { error: 'Données du produit invalides' },
        { status: 400 }
      )
    }

    // Générer un SKU unique basé sur le nom du produit
    const generateSKU = (name: string): string => {
      const cleanName = name
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(' ')
        .map(word => word.substring(0, 3).toUpperCase())
        .join('')
        .substring(0, 8)
      
      const timestamp = Date.now().toString().slice(-4)
      return `IMP${cleanName}${timestamp}`
    }

    // Générer un slug unique basé sur le nom du produit
    const generateSlug = (name: string): string => {
      const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      
      const timestamp = Date.now().toString().slice(-6)
      return `${baseSlug}-${timestamp}`
    }

    const sku = generateSKU(data.productInfo.name)
    const slug = generateSlug(data.productInfo.name)

    // Fonction pour arrondir les prix en Ariary à l'ordre de 100 Ar
    const roundToHundred = (amount: number): number => {
      return Math.round(amount / 100) * 100
    }

    // Arrondir le prix total
    const roundedTotalPrice = roundToHundred(data.costs.total)

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

    // Créer une description détaillée
    const description = `Produit importé via ${data.productInfo.mode === 'air' ? 'transport aérien' : 'transport maritime'} depuis ${data.productInfo.warehouse}.

**Détails du produit:**
- Poids: ${data.productInfo.weight} kg
${data.productInfo.volume ? `- Volume: ${data.productInfo.volume} m³` : ''}
${data.productInfo.url ? `- Lien produit: ${data.productInfo.url}` : ''}

**Coûts d'importation:**
- Prix fournisseur: ${data.costs.supplierPrice.amount.toLocaleString('fr-FR')} ${data.costs.supplierPrice.currency}
- Transport: ${Math.round(data.costs.transport.amountInMGA).toLocaleString('fr-FR')} Ar
- Commission (${data.costs.commission.rate}%): ${Math.round(data.costs.commission.amountInMGA).toLocaleString('fr-FR')} Ar
- Frais de traitement: ${Math.round(data.costs.fees.processing.amountInMGA).toLocaleString('fr-FR')} Ar
- Taxes (${data.costs.fees.tax.rate}%): ${Math.round(data.costs.fees.tax.amountInMGA).toLocaleString('fr-FR')} Ar

**Délai de livraison:** ${data.transitTime}

*Produit créé automatiquement depuis un devis d'importation.*`

    // Créer le produit
    const product = await prisma.product.create({
      data: {
        name: data.productInfo.name,
        slug: slug,
        description: description,
        price: new Decimal(roundedTotalPrice),
        sku: sku,
        inventory: 1, // Stock de 1 pour les produits sur devis
        weight: new Decimal(data.productInfo.weight),
        published: true, // Publié directement car c'est un devis client
        featured: false,
        categoryId: category.id,
        attributes: {
          create: [
            // Informations fournisseur
            {
              name: 'Prix fournisseur',
              value: `${data.costs.supplierPrice.amount} ${data.costs.supplierPrice.currency}`
            },
            {
              name: 'Entrepôt',
              value: data.productInfo.warehouse
            },
            {
              name: 'Mode de transport',
              value: data.productInfo.mode === 'air' ? 'Aérien' : 'Maritime'
            },
            {
              name: 'Poids',
              value: `${data.productInfo.weight} kg`
            },
            ...(data.productInfo.volume ? [{
              name: 'Volume',
              value: `${data.productInfo.volume} m³`
            }] : []),
            {
              name: 'Délai de livraison',
              value: data.transitTime
            },
            {
              name: 'Coût transport',
              value: `${Math.round(data.costs.transport.amountInMGA).toLocaleString('fr-FR')} Ar`
            },
            {
              name: 'Commission',
              value: `${data.costs.commission.rate}% (${Math.round(data.costs.commission.amountInMGA).toLocaleString('fr-FR')} Ar)`
            },
            {
              name: 'Type de produit',
              value: 'Produit importé sur devis'
            },
            ...(data.productInfo.url ? [{
              name: 'Lien fournisseur',
              value: data.productInfo.url
            }] : [])
          ]
        }
      },
      include: {
        category: true,
        attributes: true
      }
    })

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        price: product.price.toString(),
        description: product.description,
        weight: product.weight?.toString(),
        category: product.category?.name,
        attributes: product.attributes.map(attr => ({
          name: attr.name,
          value: attr.value
        }))
      }
    })
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du produit' },
      { status: 500 }
    )
  }
} 