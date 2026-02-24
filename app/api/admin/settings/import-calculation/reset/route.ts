import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// POST - Réinitialiser les paramètres aux valeurs par défaut
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403 }
      )
    }

    // Paramètres par défaut
    const defaultSettings = [
      // Transport
      { key: 'transport_air_usa', value: '8.50', description: 'Transport aérien USA → MDG', category: 'transport' },
      { key: 'transport_air_france', value: '7.50', description: 'Transport aérien France → MDG', category: 'transport' },
      { key: 'transport_air_uk', value: '8.00', description: 'Transport aérien UK → MDG', category: 'transport' },
      { key: 'transport_sea_france', value: '2.50', description: 'Transport maritime France → MDG', category: 'transport' },
      { key: 'transport_sea_china', value: '3.00', description: 'Transport maritime Chine → MDG', category: 'transport' },
      
      // Commission
      { key: 'commission_rate_low', value: '15', description: 'Commission produits < 50€', category: 'commission' },
      { key: 'commission_rate_medium', value: '12', description: 'Commission produits 50-200€', category: 'commission' },
      { key: 'commission_rate_high', value: '10', description: 'Commission produits > 200€', category: 'commission' },
      
      // Frais
      { key: 'processing_fee', value: '10000', description: 'Frais de traitement fixes (Ar)', category: 'fees' },
      { key: 'tax_rate', value: '20', description: 'Taux de taxe (%)', category: 'fees' },
      
      // Général
      { key: 'calculation_method', value: 'AUTO', description: 'Méthode de calcul', category: 'general' }
    ]

    // Supprimer tous les paramètres existants
    await db.importCalculationSettings.deleteMany({})

    // Insérer les paramètres par défaut
    await db.importCalculationSettings.createMany({
      data: defaultSettings
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la réinitialisation des paramètres:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
} 