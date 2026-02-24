import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { preventPayPalDeletion } from '@/lib/ensure-paypal'

/**
 * Récupérer une méthode de paiement spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 })
    }

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: params.id },
      include: {
        providers: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { payments: true }
        }
      }
    })

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Méthode de paiement non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json(paymentMethod)
  } catch (error) {
    console.error('Erreur lors de la récupération de la méthode de paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la méthode de paiement' },
      { status: 500 }
    )
  }
}

/**
 * Mettre à jour une méthode de paiement
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 })
    }

    const data = await request.json()

    // Vérifier que la méthode existe
    const existingMethod = await prisma.paymentMethod.findUnique({
      where: { id: params.id }
    })

    if (!existingMethod) {
      return NextResponse.json(
        { error: 'Méthode de paiement non trouvée' },
        { status: 404 }
      )
    }

    // Si le code est modifié, vérifier qu'il n'existe pas déjà
    if (data.code && data.code !== existingMethod.code) {
      const duplicateMethod = await prisma.paymentMethod.findFirst({
        where: {
          code: data.code,
          id: { not: params.id }
        }
      })

      if (duplicateMethod) {
        return NextResponse.json(
          { error: 'Une méthode de paiement avec ce code existe déjà' },
          { status: 409 }
        )
      }
    }

    // Mettre à jour la méthode de paiement
    const updatedMethod = await prisma.paymentMethod.update({
      where: { id: params.id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.minAmount !== undefined && { minAmount: data.minAmount ? parseFloat(data.minAmount) : null }),
        ...(data.maxAmount !== undefined && { maxAmount: data.maxAmount ? parseFloat(data.maxAmount) : null }),
        ...(data.feeType !== undefined && { feeType: data.feeType }),
        ...(data.feeValue !== undefined && { feeValue: data.feeValue ? parseFloat(data.feeValue) : null }),
        ...(data.processingTime !== undefined && { processingTime: data.processingTime }),
        ...(data.requiresReference !== undefined && { requiresReference: data.requiresReference }),
        ...(data.requiresTransactionId !== undefined && { requiresTransactionId: data.requiresTransactionId }),
        ...(data.allowPartialPayments !== undefined && { allowPartialPayments: data.allowPartialPayments }),
        ...(data.settings !== undefined && { settings: data.settings })
      },
      include: {
        providers: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { payments: true }
        }
      }
    })

    return NextResponse.json(updatedMethod)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la méthode de paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la méthode de paiement' },
      { status: 500 }
    )
  }
}

/**
 * Supprimer une méthode de paiement
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 })
    }

    // Vérifier que la méthode existe
    const existingMethod = await prisma.paymentMethod.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { payments: true }
        }
      }
    })

    if (!existingMethod) {
      return NextResponse.json(
        { error: 'Méthode de paiement non trouvée' },
        { status: 404 }
      )
    }

    // Empêcher la suppression de PayPal "Paiement en ligne"
    if (existingMethod.code === 'online_payment') {
      return NextResponse.json(
        { error: 'La méthode "Paiement en ligne" ne peut pas être supprimée car elle est essentielle au système' },
        { status: 403 }
      )
    }

    // Vérifier s'il y a des paiements associés
    if (existingMethod._count.payments > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer une méthode de paiement avec des paiements associés' },
        { status: 409 }
      )
    }

    // Supprimer la méthode de paiement (les fournisseurs seront supprimés automatiquement via CASCADE)
    await prisma.paymentMethod.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Méthode de paiement supprimée avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de la méthode de paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la méthode de paiement' },
      { status: 500 }
    )
  }
}
