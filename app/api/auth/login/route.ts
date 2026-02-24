import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email, phone, password } = await request.json()

    // Valider qu'au moins email ou téléphone est fourni
    if ((!email && !phone) || !password) {
      return NextResponse.json(
        { success: false, message: 'Email ou téléphone et mot de passe requis' },
        { status: 400 }
      )
    }

    // Rechercher l'utilisateur par email ou téléphone
    let user = null
    
    if (email) {
      user = await prisma.user.findUnique({
        where: { email }
      })
    } else if (phone) {
      user = await prisma.user.findFirst({
        where: { phone }
      })
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Identifiants incorrects' },
        { status: 401 }
      )
    }

    // Vérifier le mot de passe
    if (!user.password) {
      return NextResponse.json(
        { success: false, message: 'Compte sans mot de passe. Veuillez utiliser la connexion sociale.' },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Identifiants incorrects' },
        { status: 401 }
      )
    }

    // Connexion réussie
    return NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName
      }
    })

  } catch (error) {
    console.error('Erreur lors de la connexion:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 