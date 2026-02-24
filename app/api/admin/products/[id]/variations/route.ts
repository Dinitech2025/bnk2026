import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convertDecimalToNumber } from '@/lib/utils'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { variations } = await request.json()

    // Vérifier si le produit existe
    const product = await prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer les variations existantes
    await prisma.$queryRaw`DELETE FROM "ProductVariation" WHERE "productId" = ${id}`

    // Si pas de variations, on s'arrête là
    if (!variations || variations.length === 0) {
      return NextResponse.json({ success: true, variations: [] });
    }

    // Normaliser les variations pour éviter les doublons
    const normalizedVariations = variations.map((variation: any) => ({
      ...variation,
      // Normaliser les attributs (convertir les noms et valeurs en minuscules et les trimmer)
      attributes: variation.attributes.map((attr: any) => ({
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
        .map((attr: any) => `${attr.name}:${attr.value}`)
        .sort()
        .join('|');
        
      // Si cette combinaison n'existe pas encore, on l'ajoute
      if (!attributeSets.has(attributeSignature)) {
        attributeSets.add(attributeSignature);
        uniqueVariations.push(variation);
      }
    }

    // Ajouter les nouvelles variations uniques
    const variationPromises = uniqueVariations.map((variation: any) => {
      return prisma.$queryRaw`
        INSERT INTO "ProductVariation" ("id", "sku", "price", "inventory", "productId", "createdAt", "updatedAt") 
        VALUES (
          ${crypto.randomUUID()}, 
          ${variation.sku || null}, 
          ${variation.price}::numeric, 
          ${variation.inventory}::integer, 
          ${id}, 
          ${new Date()}, 
          ${new Date()}
        )
        RETURNING id
      `
      .then((result: any) => {
        const variationId = Array.isArray(result) && result.length > 0 ? result[0].id : null;
        
        if (variationId && variation.attributes && variation.attributes.length > 0) {
          // Créer les attributs pour cette variation
          const attributePromises = variation.attributes.map((attr: any) => 
            prisma.$queryRaw`
              INSERT INTO "ProductAttribute" ("id", "name", "value", "variationId") 
              VALUES (
                ${crypto.randomUUID()}, 
                ${attr.name}, 
                ${attr.value}, 
                ${variationId}
              )
            `
          );
          return Promise.all(attributePromises);
        }
        return null;
      });
    });

    await Promise.all(variationPromises);

    // Récupérer et retourner le produit mis à jour avec ses variations
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
    });
    
    // Récupérer les variations séparément avec une requête SQL directe
    const variationsResult = await prisma.$queryRaw`
      SELECT v.*, 
        (
          SELECT json_agg(a.*) 
          FROM "ProductAttribute" a 
          WHERE a."variationId" = v.id
        ) as attributes
      FROM "ProductVariation" v
      WHERE v."productId" = ${id}
    `;
    
    const productVariations = Array.isArray(variationsResult) ? variationsResult : [];

    return NextResponse.json(convertDecimalToNumber({
      ...updatedProduct,
      variations: productVariations
    }))
  } catch (error) {
    console.error('Erreur lors de la mise à jour des variations:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des variations: ' + (error as Error).message },
      { status: 500 }
    )
  }
} 
 
 
 
 
 
 