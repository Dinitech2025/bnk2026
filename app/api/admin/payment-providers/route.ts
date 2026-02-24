import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Récupérer tous les fournisseurs de paiement
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const methodId = searchParams.get('methodId')

    const where = methodId ? { paymentMethodId: methodId } : {}

    const paymentProviders = await prisma.paymentProvider.findMany({
      where,
      include: {
        paymentMethod: true,
        _count: {
          select: { payments: true }
        }
      },
      orderBy: [
        { paymentMethod: { order: 'asc' } },
        { order: 'asc' }
      ]
    })

    return NextResponse.json(paymentProviders)
  } catch (error) {
    console.error('Erreur lors de la récupération des fournisseurs de paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des fournisseurs de paiement' },
      { status: 500 }
    )
  }
}

/**
 * Créer un nouveau fournisseur de paiement
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 })
    }

    const data = await request.json()

    // Validation des données
    if (!data.paymentMethodId || !data.code || !data.name) {
      return NextResponse.json(
        { error: 'La méthode de paiement, le code et le nom sont obligatoires' },
        { status: 400 }
      )
    }

    // Vérifier que la méthode de paiement existe
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: data.paymentMethodId }
    })

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Méthode de paiement non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier que le code n'existe pas déjà pour cette méthode
    const existingProvider = await prisma.paymentProvider.findFirst({
      where: {
        paymentMethodId: data.paymentMethodId,
        code: data.code
      }
    })

    if (existingProvider) {
      return NextResponse.json(
        { error: 'Un fournisseur avec ce code existe déjà pour cette méthode' },
        { status: 409 }
      )
    }

    // Créer le fournisseur de paiement
    const paymentProvider = await prisma.paymentProvider.create({
      data: {
        paymentMethodId: data.paymentMethodId,
        code: data.code,
        name: data.name,
        description: data.description || null,
        logo: data.logo || null,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
        apiEndpoint: data.apiEndpoint || null,
        publicKey: data.publicKey || null,
        merchantId: data.merchantId || null,
        feeType: data.feeType || null,
        feeValue: data.feeValue ? parseFloat(data.feeValue) : null,
        minAmount: data.minAmount ? parseFloat(data.minAmount) : null,
        maxAmount: data.maxAmount ? parseFloat(data.maxAmount) : null,
        dailyLimit: data.dailyLimit ? parseFloat(data.dailyLimit) : null,
        settings: data.settings || null
      },
      include: {
        paymentMethod: true,
        _count: {
          select: { payments: true }
        }
      }
    })

    return NextResponse.json(paymentProvider, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du fournisseur de paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du fournisseur de paiement' },
      { status: 500 }
    )
  }
}
