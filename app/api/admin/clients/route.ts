import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET - Liste tous les clients
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Vérifier l'authentification et les autorisations
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer tous les clients avec leurs relations
    const clients = await prisma.user.findMany({
      where: {
        role: 'CLIENT'
      },
      include: {
        addresses: true,
        orders: {
          select: {
            id: true,
            total: true,
            status: true
          }
        },
        subscriptions: {
          where: {
            status: 'ACTIVE',
            endDate: {
              gte: new Date()
            }
          },
          include: {
            offer: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculer le montant total dépensé par client et convertir les Decimal
    const clientsWithTotalSpent = clients.map(client => {
      const totalSpent = client.orders
        .filter(order => order.status !== 'CANCELLED')
        .reduce((sum, order) => {
          // Convertir le Decimal en nombre (les montants sont déjà en Ariary)
          const orderTotal = order.total ? Number(order.total.toString()) : 0
          return sum + orderTotal
        }, 0)
      
      // Convertir tous les Decimal dans les orders
      const ordersWithConvertedDecimals = client.orders.map(order => ({
        ...order,
        total: order.total ? Number(order.total.toString()) : 0
      }))
      
      return {
        ...client,
        orders: ordersWithConvertedDecimals,
        totalSpent
      }
    })

    return NextResponse.json(clientsWithTotalSpent)
  } catch (error) {
    console.error('[CLIENTS_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

// POST - Crée un nouveau client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Vérifier l'authentification et les autorisations
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer les données du corps de la requête
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
      telegramUsername
    } = data

    // Validation de base - au moins un email ou un téléphone
    if (!email && !phone) {
      return NextResponse.json(
        { message: 'Email ou numéro de téléphone requis' },
        { status: 400 }
      )
    }

    // Vérifier si l'email existe déjà (seulement si fourni)
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json(
          { message: 'Cet email est déjà utilisé' },
          { status: 400 }
        )
      }
    }

    // Hacher le mot de passe (seulement si fourni)
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null

    // Créer le client
    const newClient = await prisma.user.create({
      data: {
        email: email || null,
        password: hashedPassword,
        name: name || `${firstName || ''} ${lastName || ''}`.trim() || null,
        firstName,
        lastName,
        phone,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        preferredLanguage,
        newsletter: newsletter || false,
        notes,
        customerType,
        companyName,
        vatNumber,
        image,
        communicationMethod,
        facebookPage,
        whatsappNumber,
        telegramUsername,
        role: 'CLIENT',
      } as any,
    })

    // Exclure le mot de passe de la réponse
    const { password: _, ...clientWithoutPassword } = newClient

    return NextResponse.json(clientWithoutPassword, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du client:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 