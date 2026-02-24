import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Récupère toutes les adresses de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer les adresses de l'utilisateur
    const addresses = await db.address.findMany({
      where: {
        userId: session.user.id,
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

// POST - Ajoute une nouvelle adresse pour l'utilisateur connecté
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { type, street, city, state, zipCode, country, phoneNumber, isDefault } = data

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
          userId: session.user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    // Créer la nouvelle adresse
    const addressData: any = {
      userId: session.user.id,
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