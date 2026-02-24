import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET - Récupère un client spécifique
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

    // Récupérer le client
    const client = await db.user.findUnique({
      where: {
        id,
        role: 'CLIENT',
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        birthDate: true,
        gender: true,
        preferredLanguage: true,
        newsletter: true,
        notes: true,
        customerType: true,
        companyName: true,
        vatNumber: true,
        image: true,
        communicationMethod: true,
        facebookPage: true,
        whatsappNumber: true,
        telegramUsername: true,
        createdAt: true,
        updatedAt: true,
        addresses: true,
      } as any,
    })

    if (!client) {
      return NextResponse.json(
        { message: 'Client non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Met à jour un client spécifique
export async function PUT(
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
    const {
      email,
      password,
      name,
      firstName,
      lastName,
      phone,
      birthDate,
      gender,
      preferredLanguage,
      newsletter,
      notes,
      customerType,
      companyName,
      vatNumber,
      image,
      communicationMethod,
      facebookPage,
      whatsappNumber,
      telegramUsername,
    } = data

    // Vérifier si le client existe
    const existingClient = await db.user.findUnique({
      where: {
        id,
        role: 'CLIENT',
      },
    })

    if (!existingClient) {
      return NextResponse.json(
        { message: 'Client non trouvé' },
        { status: 404 }
      )
    }

    // Si l'email a été modifié, vérifier qu'il n'est pas déjà utilisé
    if (email && email !== existingClient.email) {
      const emailExists = await db.user.findUnique({
        where: { email },
      })

      if (emailExists) {
        return NextResponse.json(
          { message: 'Cet email est déjà utilisé' },
          { status: 400 }
        )
      }
    }

    // Préparer les données à mettre à jour
    const updateData: any = {
      email: email || undefined,
      name: name || `${firstName || ''} ${lastName || ''}`.trim() || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phone: phone || undefined,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      gender: gender || undefined,
      preferredLanguage: preferredLanguage || undefined,
      newsletter: newsletter !== undefined ? newsletter : undefined,
      notes: notes || undefined,
      customerType: customerType || undefined,
      companyName: companyName || undefined,
      vatNumber: vatNumber || undefined,
      image: image || undefined,
      communicationMethod: communicationMethod || undefined,
      facebookPage: facebookPage || undefined,
      whatsappNumber: whatsappNumber || undefined,
      telegramUsername: telegramUsername || undefined,
    }

    // Si un nouveau mot de passe est fourni, le hacher
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Mettre à jour le client
    const updatedClient = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        birthDate: true,
        gender: true,
        preferredLanguage: true,
        newsletter: true,
        notes: true,
        customerType: true,
        companyName: true,
        vatNumber: true,
        image: true,
        communicationMethod: true,
        facebookPage: true,
        whatsappNumber: true,
        telegramUsername: true,
        createdAt: true,
        updatedAt: true,
      } as any,
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du client:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprime un client spécifique
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Vérifier l'authentification et les autorisations
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = params

    // Vérifier si le client existe
    const existingClient = await db.user.findUnique({
      where: {
        id,
        role: 'CLIENT',
      },
    })

    if (!existingClient) {
      return NextResponse.json(
        { message: 'Client non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer le client
    await db.user.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Client supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression du client:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 