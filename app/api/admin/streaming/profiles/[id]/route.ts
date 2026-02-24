import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireStaff } from '@/lib/auth'
import { AccountProfileUpdateData } from '@/app/types/prisma'
import { prisma } from '@/lib/prisma'

// GET - Récupérer un profil spécifique
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await prisma.accountProfile.findUnique({
      where: {
        id: params.id,
      },
      include: {
        account: {
          include: {
            platform: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour toutes les informations d'un profil
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestData = await request.json()
    
    // Créer un objet de mise à jour valide pour Prisma
    const data: AccountProfileUpdateData = {
      isAssigned: requestData.isAssigned,
      pin: requestData.pin
    }
    
    // Vérifier si le profil existe
    const existingProfile = await db.accountProfile.findUnique({
      where: { id: params.id },
      include: {
        account: true
      }
    })

    if (!existingProfile) {
      return NextResponse.json(
        { message: 'Profil non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour le profil
    const updatedProfile = await db.accountProfile.update({
      where: { id: params.id },
      data,
      include: {
        account: {
          include: {
            platform: true
          }
        }
      }
    })

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error)
    return NextResponse.json(
      { message: 'Erreur serveur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour partiellement un profil
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestData = await request.json()
    
    // Créer un objet de mise à jour avec uniquement les champs valides
    const updateData: any = {}
    
    if (typeof requestData.name === 'string' || requestData.name === null) {
      updateData.name = requestData.name
    }
    
    if (typeof requestData.pin === 'string' || requestData.pin === null) {
      updateData.pin = requestData.pin
    }
    
    if (typeof requestData.isAssigned === 'boolean') {
      updateData.isAssigned = requestData.isAssigned
    }

    // Vérifier si le profil existe
    const existingProfile = await prisma.accountProfile.findUnique({
      where: { id: params.id }
    })

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour le profil
    const updatedProfile = await prisma.accountProfile.update({
      where: { id: params.id },
      data: updateData,
      include: {
        account: {
          include: {
            platform: true
          }
        }
      }
    })

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un profil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // En production: const user = await requireStaff()
    
    // Vérifier si le profil existe
    const existingProfile = await db.accountProfile.findUnique({
      where: { id: params.id },
      include: {
        account: {
          include: {
            accountProfiles: true,
            platform: true
          }
        }
      }
    })

    if (!existingProfile) {
      return NextResponse.json(
        { message: 'Profil non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si c'est le dernier profil du compte
    if (existingProfile.account.accountProfiles.length <= 1) {
      return NextResponse.json(
        { message: 'Impossible de supprimer le dernier profil d\'un compte' },
        { status: 400 }
      )
    }

    // Supprimer le profil
    await db.accountProfile.delete({
      where: { id: params.id }
    })

    return NextResponse.json(
      { message: 'Profil supprimé avec succès' }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression du profil:', error)
    return NextResponse.json(
      { message: 'Erreur serveur lors de la suppression du profil' },
      { status: 500 }
    )
  }
} 