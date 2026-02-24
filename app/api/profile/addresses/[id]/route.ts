import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Récupère une adresse spécifique de l'utilisateur connecté
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = params

    // Récupérer l'adresse
    const address = await db.address.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!address) {
      return NextResponse.json(
        { message: 'Adresse non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json(address)
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'adresse:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Met à jour une adresse spécifique de l'utilisateur connecté
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = params
    const data = await request.json()
    const { type, street, city, state, zipCode, country, phoneNumber, isDefault } = data

    // Vérifier si l'adresse existe et appartient à l'utilisateur
    const existingAddress = await db.address.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingAddress) {
      return NextResponse.json(
        { message: 'Adresse non trouvée' },
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
    if (isDefault && !existingAddress.isDefault) {
      await db.address.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
          id: { not: id }
        },
        data: {
          isDefault: false,
        },
      })
    }

    // Mettre à jour l'adresse
    const addressData: any = {
      type,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: isDefault || false,
    }
    
    // Ajouter le numéro de téléphone s'il est fourni
    if (phoneNumber !== undefined) {
      addressData.phoneNumber = phoneNumber
    }
    
    const updatedAddress = await db.address.update({
      where: {
        id,
      },
      data: addressData,
    })

    return NextResponse.json(updatedAddress)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'adresse:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprime une adresse spécifique de l'utilisateur connecté
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = params

    // Vérifier si l'adresse existe et appartient à l'utilisateur
    const existingAddress = await db.address.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingAddress) {
      return NextResponse.json(
        { message: 'Adresse non trouvée' },
        { status: 404 }
      )
    }

    // Supprimer l'adresse
    await db.address.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ message: 'Adresse supprimée avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'adresse:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 