import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Vérifier si l'utilisateur est admin
async function checkAdminPermission() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return false
  }
  return true
}

// GET - Récupérer un employé spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier que l'utilisateur est admin
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403 }
      )
    }

    const id = params.id
    const user = await db.user.findFirst({
      where: { 
        id,
        role: {
          in: ['ADMIN', 'STAFF']
        }
      }
    })

    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'Employé non trouvé' }),
        { status: 404 }
      )
    }

    // Formater la réponse pour correspondre au format attendu
    const employee = {
      id: user.id,
      firstName: user.firstName || user.name?.split(' ')[0] || '',
      lastName: user.lastName || user.name?.split(' ')[1] || '',
      email: user.email,
      role: user.role,
      avatar: user.image,
      permissions: user.notes || 'read',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'employé:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un employé
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier que l'utilisateur est admin
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403 }
      )
    }

    const id = params.id
    const body = await request.json()

    // Vérifier si l'utilisateur existe et est un employé (ADMIN ou STAFF)
    const existingUser = await db.user.findFirst({
      where: { 
        id,
        role: {
          in: ['ADMIN', 'STAFF']
        }
      }
    })

    if (!existingUser) {
      return new NextResponse(
        JSON.stringify({ error: 'Employé non trouvé' }),
        { status: 404 }
      )
    }

    // Si l'email est modifié, vérifier qu'il n'est pas déjà utilisé
    if (body.email && body.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: body.email }
      })

      if (emailExists) {
        return new NextResponse(
          JSON.stringify({ error: 'Cet email est déjà utilisé' }),
          { status: 400 }
        )
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        name: `${body.firstName} ${body.lastName}`,
        email: body.email,
        role: body.role,
        image: body.avatar,
        notes: body.permissions
      }
    })

    // Formater la réponse
    const updatedEmployee = {
      id: updatedUser.id,
      firstName: updatedUser.firstName || updatedUser.name?.split(' ')[0] || '',
      lastName: updatedUser.lastName || updatedUser.name?.split(' ')[1] || '',
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.image,
      permissions: updatedUser.notes || 'read',
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    }

    return NextResponse.json(updatedEmployee)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'employé:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un employé (désactiver le compte utilisateur)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier que l'utilisateur est admin
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403 }
      )
    }

    const id = params.id

    // Vérifier si l'utilisateur existe et est un employé (ADMIN ou STAFF)
    const existingUser = await db.user.findFirst({
      where: { 
        id,
        role: {
          in: ['ADMIN', 'STAFF']
        }
      }
    })

    if (!existingUser) {
      return new NextResponse(
        JSON.stringify({ error: 'Employé non trouvé' }),
        { status: 404 }
      )
    }

    // Plutôt que de supprimer, on change le rôle en CLIENT
    await db.user.update({
      where: { id },
      data: {
        role: 'CLIENT',
        notes: `Ancien ${existingUser.role}: ${existingUser.notes || ''}`,
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'employé:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
} 