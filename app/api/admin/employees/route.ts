import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// Vérifier si l'utilisateur est admin
async function checkAdminPermission() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return false
  }
  return true
}

// GET - Récupérer tous les employés (utilisateurs ADMIN et STAFF)
export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403 }
      )
    }

    // Récupérer tous les utilisateurs avec rôle ADMIN ou STAFF
    const employees = await db.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'STAFF']
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        image: true,
        role: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Formater les données pour correspondre au format attendu
    const formattedEmployees = employees.map(employee => ({
      id: employee.id,
      firstName: employee.firstName || employee.name?.split(' ')[0] || '',
      lastName: employee.lastName || employee.name?.split(' ')[1] || '',
      email: employee.email,
      role: employee.role,
      avatar: employee.image,
      permissions: employee.notes || 'read',
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt
    }))

    return NextResponse.json(formattedEmployees)
  } catch (error) {
    console.error('Erreur lors de la récupération des employés:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
}

// POST - Créer un nouvel employé (utilisateur avec rôle ADMIN ou STAFF)
export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validation basique
    if (!body.firstName || !body.lastName || !body.email) {
      return new NextResponse(
        JSON.stringify({ error: 'Informations incomplètes' }),
        { status: 400 }
      )
    }

    // Vérifier si l'email existe déjà
    const existingUser = await db.user.findUnique({
      where: { email: body.email }
    })

    if (existingUser) {
      return new NextResponse(
        JSON.stringify({ error: 'Cet email est déjà utilisé' }),
        { status: 400 }
      )
    }

    // Créer l'utilisateur avec rôle ADMIN ou STAFF
    const employee = await db.user.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        name: `${body.firstName} ${body.lastName}`,
        email: body.email,
        role: body.role || 'STAFF',
        image: body.avatar || null,
        notes: body.permissions || 'read',
        password: Math.random().toString(36).slice(-8), // Mot de passe temporaire
        customerType: 'EMPLOYEE'
      }
    })

    // Retourner l'employé avec le format adapté
    return NextResponse.json({
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      role: employee.role,
      avatar: employee.image,
      permissions: employee.notes,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt
    }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de l\'employé:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
} 