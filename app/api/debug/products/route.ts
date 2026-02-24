import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany();
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error in debug/products GET:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Créer un produit de test
    const product = await prisma.product.create({
      data: {
        name: "Produit de test",
        description: "Ceci est un produit de test pour le débogage",
        price: 29.99,
        inventory: 100,
        published: true,
        slug: "produit-test-debug"
      }
    });
    
    return NextResponse.json({
      id: product.id,
      message: "Produit de test créé avec succès",
    });
  } catch (error) {
    console.error('Error in debug/products POST:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
} 