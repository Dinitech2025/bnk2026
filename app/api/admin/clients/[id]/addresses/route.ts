import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET - Liste toutes les adresses d'un client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Vérifier l'authentification et les autorisations
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = params

    // Vérifier si le client existe
    const client = await db.user.findUnique({
      where: {
        id,
        role: 'CLIENT',
      },
    })

    if (!client) {
      return NextResponse.json(
        { message: 'Client non trouvé' },
        { status: 404 }
      )
    }

    // Récupérer les adresses du client
    const addresses = await db.address.findMany({
      where: {
        userId: id,
      },
      orderBy: {
        isDefault: 'desc',
      },
    })

    return NextResponse.json(addresses)
  } catch (error) {
    console.error('Erreur lors de la récupération des adresses:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Ajoute une nouvelle adresse pour un client
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Vérifier l'authentification et les autorisations
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = params
    const data = await request.json()
    const { type, street, city, state, zipCode, country, phoneNumber, isDefault } = data

    // Vérifier si le client existe
    const client = await db.user.findUnique({
      where: {
        id,
        role: 'CLIENT',
      },
    })

    if (!client) {
      return NextResponse.json(
        { message: 'Client non trouvé' },
        { status: 404 }
      )
    }

    // Validation de base
    if (!type || !street || !city || !zipCode || !country) {
      return NextResponse.json(
        { message: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    // Si l'adresse est définie par défaut, mettre à jour les autres adresses
    if (isDefault) {
      await db.address.updateMany({
        where: {
          userId: id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    // Créer la nouvelle adresse
    const addressData: any = {
      userId: id,
      type,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: isDefault || false,
    }
    
    // Ajouter le numéro de téléphone s'il est fourni
    if (phoneNumber) {
      addressData.phoneNumber = phoneNumber
    }
    
    const newAddress = await db.address.create({
      data: addressData,
    })

    return NextResponse.json(newAddress, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de l\'adresse:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 