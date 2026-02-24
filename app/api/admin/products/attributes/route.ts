import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Récupérer tous les noms d'attributs uniques
    const attributesResult = await prisma.$queryRaw`
      SELECT DISTINCT LOWER(TRIM(name)) as name
      FROM "ProductAttribute"
      ORDER BY name ASC
    `
    
    const attributes = Array.isArray(attributesResult) ? attributesResult : []
    
    // Récupérer également les valeurs les plus courantes pour chaque attribut
    const attributesWithValues = await Promise.all(
      attributes.map(async (attr: any) => {
        const valuesResult = await prisma.$queryRaw`
          SELECT DISTINCT value, COUNT(*) as count
          FROM "ProductAttribute" 
          WHERE LOWER(TRIM(name)) = ${attr.name}
          GROUP BY value
          ORDER BY count DESC
          LIMIT 10
        `
        
        const values = Array.isArray(valuesResult) 
          ? valuesResult.map((v: any) => v.value)
          : []
          
        return {
          name: attr.name,
          values
        }
      })
    )
    
    return NextResponse.json(attributesWithValues)
  } catch (error) {
    console.error('Erreur lors de la récupération des attributs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des attributs' },
      { status: 500 }
    )
  }
} 
 
 
 
 
 
 