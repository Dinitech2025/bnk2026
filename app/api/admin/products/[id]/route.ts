import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadImage } from '@/lib/upload'
import { convertDecimalToNumber } from '@/lib/utils'

interface RouteParams {
  params: {
    id: string
  }
}

interface ProductAttribute {
  name: string;
  value: string;
}

interface ProductVariation {
  sku?: string;
  price: number;
  inventory: number;
  attributes: ProductAttribute[];
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          select: {
            id: true,
            path: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(convertDecimalToNumber(product))
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération du produit' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const formData = await request.formData()
    
    // Récupérer les données du produit
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const sku = formData.get('sku') as string
    const price = parseFloat(formData.get('price') as string)
    const compareAtPrice = formData.get('compareAtPrice') ? parseFloat(formData.get('compareAtPrice') as string) : null
    const inventory = parseInt(formData.get('inventory') as string)
    const categoryId = formData.get('categoryId') as string || null
    const published = formData.get('published') === 'true'
    const featured = formData.get('featured') === 'true'
    const barcode = formData.get('barcode') as string || null
    const weight = formData.get('weight') ? parseFloat(formData.get('weight') as string) : null
    const dimensions = formData.get('dimensions') as string || null
    
    // Vérifier les variations
    const variationsJson = formData.get('variations')
    const productVariations = variationsJson ? JSON.parse(variationsJson as string) : []

    // Mettre à jour le produit
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        description,
        sku,
        price,
        compareAtPrice,
        inventory,
        categoryId,
        published,
        featured,
        barcode,
        weight,
        dimensions
      },
    })

    // Gérer les images existantes
    const existingImageIds = JSON.parse(formData.get('existingImages') as string || '[]') as string[]
    
    if (existingImageIds.length > 0) {
      // Supprimer les images qui ne sont plus présentes
      await prisma.media.deleteMany({
        where: {
          AND: [
            { products: { some: { id: params.id } } },
            { id: { notIn: existingImageIds } }
          ]
        }
      })
    }

    // Gérer les nouvelles images
    const images = formData.getAll('images') as File[]
    if (images.length > 0) {
      const uploadPromises = images.map(async (image) => {
        const path = await uploadImage(image, 'product')
        return prisma.media.create({
          data: {
            name: image.name,
            fileName: image.name,
            path,
            size: image.size,
            mimeType: image.type,
            products: {
              connect: [{ id: params.id }]
            }
          },
        })
      })

      await Promise.all(uploadPromises)
    }

    // Gérer les variations si présentes
    if (productVariations.length > 0) {
      // Supprimer d'abord toutes les variations existantes
      await prisma.$queryRaw`DELETE FROM "ProductVariation" WHERE "productId" = ${params.id}`
      
      // Normaliser les variations pour éviter les doublons
      const normalizedVariations = productVariations.map((variation: ProductVariation) => ({
        ...variation,
        // Normaliser les attributs (convertir les noms et valeurs en minuscules et les trimmer)
        attributes: variation.attributes.map((attr: ProductAttribute) => ({
          ...attr,
          name: attr.name.trim().toLowerCase(),
          value: attr.value.trim()
        }))
      }));
      
      // Filtrer les variations dupliquées basées sur les attributs normalisés
      const uniqueVariations = [];
      const attributeSets = new Set();
      
      for (const variation of normalizedVariations) {
        // Créer une signature unique pour cette combinaison d'attributs
        const attributeSignature = variation.attributes
          .map((attr: ProductAttribute) => `${attr.name}:${attr.value}`)
          .sort()
          .join('|');
          
        // Si cette combinaison n'existe pas encore, on l'ajoute
        if (!attributeSets.has(attributeSignature)) {
          attributeSets.add(attributeSignature);
          uniqueVariations.push(variation);
        }
      }
      
      // Puis créer les nouvelles variations uniques
      for (const variation of uniqueVariations) {
        await prisma.$queryRaw`
          INSERT INTO "ProductVariation" ("id", "sku", "price", "inventory", "productId", "createdAt", "updatedAt") 
          VALUES (
            ${crypto.randomUUID()}, 
            ${variation.sku || null}, 
            ${variation.price}::numeric, 
            ${variation.inventory}::integer, 
            ${params.id}, 
            ${new Date()}, 
            ${new Date()}
          )
        `
        
        // Créer les attributs
        if (variation.attributes && variation.attributes.length > 0) {
          for (const attr of variation.attributes) {
            await prisma.$queryRaw`
              INSERT INTO "ProductAttribute" ("id", "name", "value", "variationId") 
              VALUES (
                ${crypto.randomUUID()}, 
                ${attr.name}, 
                ${attr.value}, 
                (SELECT "id" FROM "ProductVariation" WHERE "productId" = ${params.id} AND "sku" = ${variation.sku || null} LIMIT 1)
              )
            `
          }
        }
      }
    }

    // Récupérer le produit mis à jour avec les informations de base
    const updatedProduct = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        images: true,
      }
    })

    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Produit non trouvé après mise à jour' },
        { status: 404 }
      )
    }

    // Récupérer les attributs du produit
    const attributesResult = await prisma.$queryRaw`
      SELECT * FROM "ProductAttribute" 
      WHERE "productId" = ${params.id}
    `
    const productAttributes = Array.isArray(attributesResult) ? attributesResult : []

    // Récupérer les variations du produit avec leurs attributs
    const variationsResult = await prisma.$queryRaw`
      SELECT v.*, 
        (
          SELECT json_agg(a.*) 
          FROM "ProductAttribute" a 
          WHERE a."variationId" = v.id
        ) as attributes
      FROM "ProductVariation" v
      WHERE v."productId" = ${params.id}
    `
    const productVariationsList = Array.isArray(variationsResult) ? variationsResult : []

    // Construire la réponse complète
    const completeProduct = {
      ...updatedProduct,
      variations: productVariationsList,
      attributes: productAttributes
    }

    return NextResponse.json(convertDecimalToNumber(completeProduct))
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour du produit: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Supprimer le produit (les relations seront supprimées automatiquement grâce aux contraintes CASCADE)
    await prisma.product.delete({
      where: { id: params.id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la suppression du produit' },
      { status: 500 }
    )
  }
} 