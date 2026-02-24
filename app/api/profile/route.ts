import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Récupérer les informations de l'utilisateur
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        addresses: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer les données du corps de la requête
    const data = await request.json()
    
    // Formater la date de naissance si elle est fournie
    let birthDateFormatted = undefined
    if (data.birthDate) {
      birthDateFormatted = new Date(data.birthDate)
    }
    
    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        email: data.email,
        phone: data.phone || null,
        birthDate: birthDateFormatted,
        gender: data.gender || null,
        preferredLanguage: data.preferredLanguage,
        newsletter: data.newsletter,
        customerType: data.customerType,
        companyName: data.customerType === 'BUSINESS' ? data.companyName : null,
        vatNumber: data.customerType === 'BUSINESS' ? data.vatNumber : null,
      },
    })

    return NextResponse.json({
      message: 'Profil mis à jour avec succès',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        updatedAt: updatedUser.updatedAt
      }
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 