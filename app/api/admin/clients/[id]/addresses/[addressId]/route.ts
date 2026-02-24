import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET - Récupère une adresse spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; addressId: string } }
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

    const { id, addressId } = params

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

    // Récupérer l'adresse
    const address = await db.address.findUnique({
      where: {
        id: addressId,
        userId: id,
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

// PUT - Met à jour une adresse spécifique
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; addressId: string } }
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

    const { id, addressId } = params
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

    // Vérifier si l'adresse existe
    const existingAddress = await db.address.findUnique({
      where: {
        id: addressId,
        userId: id,
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
          userId: id,
          isDefault: true,
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
        id: addressId,
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

// DELETE - Supprime une adresse spécifique
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; addressId: string } }
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

    const { id, addressId } = params

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

    // Vérifier si l'adresse existe
    const existingAddress = await db.address.findUnique({
      where: {
        id: addressId,
        userId: id,
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
        id: addressId,
      },
    })

    return NextResponse.json(
      { message: 'Adresse supprimée avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'adresse:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 