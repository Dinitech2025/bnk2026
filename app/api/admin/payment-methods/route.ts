import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensurePayPalExists } from '@/lib/ensure-paypal'

/**
 * Récupérer toutes les méthodes de paiement
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 })
    }

    // S'assurer que PayPal existe toujours
    await ensurePayPalExists()

    const paymentMethods = await prisma.paymentMethod.findMany({
      include: {
        providers: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { payments: true }
        }
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(paymentMethods)
  } catch (error) {
    console.error('Erreur lors de la récupération des méthodes de paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des méthodes de paiement' },
      { status: 500 }
    )
  }
}

/**
 * Créer une nouvelle méthode de paiement
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 })
    }

    const data = await request.json()

    // Validation des données
    if (!data.code || !data.name) {
      return NextResponse.json(
        { error: 'Le code et le nom sont obligatoires' },
        { status: 400 }
      )
    }

    // Vérifier que le code n'existe pas déjà
    const existingMethod = await prisma.paymentMethod.findUnique({
      where: { code: data.code }
    })

    if (existingMethod) {
      return NextResponse.json(
        { error: 'Une méthode de paiement avec ce code existe déjà' },
        { status: 409 }
      )
    }

    // Créer la méthode de paiement
    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
        icon: data.icon || null,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
        minAmount: data.minAmount ? parseFloat(data.minAmount) : null,
        maxAmount: data.maxAmount ? parseFloat(data.maxAmount) : null,
        feeType: data.feeType || null,
        feeValue: data.feeValue ? parseFloat(data.feeValue) : null,
        processingTime: data.processingTime || null,
        requiresReference: data.requiresReference ?? false,
        requiresTransactionId: data.requiresTransactionId ?? false,
        allowPartialPayments: data.allowPartialPayments ?? true,
        settings: data.settings || null
      },
      include: {
        providers: true,
        _count: {
          select: { payments: true }
        }
      }
    })

    return NextResponse.json(paymentMethod, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la méthode de paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la méthode de paiement' },
      { status: 500 }
    )
  }
}
