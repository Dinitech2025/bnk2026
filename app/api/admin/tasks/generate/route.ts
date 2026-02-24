import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateAllAutomaticTasks } from '@/lib/task-generator'

// POST - Générer toutes les tâches automatiques
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    console.log('🔄 Génération automatique des tâches...')
    
    const results = await generateAllAutomaticTasks()
    
    const totalCreated = 
      results.subscriptionExpiry.created +
      results.accountRecharge.created +
      results.paymentReminder.created +
      results.prospection.created +
      results.removeExpiredClients.created

    const allErrors = [
      ...results.subscriptionExpiry.errors,
      ...results.accountRecharge.errors,
      ...results.paymentReminder.errors,
      ...results.prospection.errors,
      ...results.removeExpiredClients.errors,
    ]

    console.log(`✅ ${totalCreated} tâches créées`)
    if (allErrors.length > 0) {
      console.error(`❌ ${allErrors.length} erreurs:`, allErrors)
    }

    return NextResponse.json({
      success: true,
      totalCreated,
      details: {
        subscriptionExpiry: results.subscriptionExpiry.created,
        accountRecharge: results.accountRecharge.created,
        paymentReminder: results.paymentReminder.created,
        prospection: results.prospection.created,
        removeExpiredClients: results.removeExpiredClients.created,
      },
      errors: allErrors,
    })
  } catch (error) {
    console.error('Erreur lors de la génération des tâches:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

