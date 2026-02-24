import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 Début de PATCH /api/admin/orders/[id]/status')
    
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    console.log('🔐 Session:', session ? `${session.user.email} (${session.user.role})` : 'null')
    
    if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      console.log('❌ Authentification échouée')
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('📝 Body reçu:', body)
    
    const { status } = body
    const orderId = params.id
    
    console.log(`🎯 Tentative de changement: orderId=${orderId}, newStatus=${status}`)

    // Valider le statut
    const validStatuses = ['PENDING', 'PARTIALLY_PAID', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'CONFIRMED'] // CONFIRMED maintenu pour compatibilité
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      )
    }

    // Définir l'ordre logique des statuts
    const statusFlow = ['PENDING', 'PARTIALLY_PAID', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']
    
    // Fonction pour valider les transitions
    const isValidTransition = (currentStatus: string, newStatus: string): boolean => {
      // L'annulation est toujours possible (sauf depuis DELIVERED et REFUNDED)
      if (newStatus === 'CANCELLED' && !['DELIVERED', 'REFUNDED'].includes(currentStatus)) {
        return true
      }
      
      // Le remboursement est possible seulement depuis PAID
      if (newStatus === 'REFUNDED' && ['PAID'].includes(currentStatus)) {
        return true
      }
      
      // Réactivation depuis CANCELLED vers PENDING
      if (currentStatus === 'CANCELLED' && newStatus === 'PENDING') {
        return true
      }
      
      // Pas de transition depuis REFUNDED (statut final)
      if (currentStatus === 'REFUNDED') {
        return false
      }
      
      // Compatibilité CONFIRMED → PAID
      if (currentStatus === 'CONFIRMED' && newStatus === 'PAID') {
        return true
      }
      
      // Transitions normales dans l'ordre du flow
      const currentIndex = statusFlow.indexOf(currentStatus)
      const newIndex = statusFlow.indexOf(newStatus)
      
      // Permettre de passer à l'étape suivante
      if (currentIndex >= 0 && newIndex === currentIndex + 1) {
        return true
      }
      
      // Permettre de rester au même statut (pas de changement)
      if (currentStatus === newStatus) {
        return true
      }
      
      return false
    }

    // Vérifier que la commande existe
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    console.log(`🔄 Tentative de changement: ${existingOrder.status} → ${status}`)
    
    // Valider la transition de statut
    if (!isValidTransition(existingOrder.status, status)) {
      console.log(`❌ Transition invalide: ${existingOrder.status} → ${status}`)
      return NextResponse.json(
        { error: `Transition invalide: impossible de passer de "${existingOrder.status}" à "${status}"` },
        { status: 400 }
      )
    }
    
    console.log(`✅ Transition valide: ${existingOrder.status} → ${status}`)

    // Mettre à jour le statut et ajouter l'historique dans une transaction
    console.log('🔄 Début de la transaction...')
    
    const [updatedOrder] = await prisma.$transaction([
      // Mettre à jour le statut
      prisma.order.update({
        where: { id: orderId },
        data: { 
          status,
          updatedAt: new Date()
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          updatedAt: true
        }
      }),
      // Ajouter l'entrée dans l'historique
      prisma.orderHistory.create({
        data: {
          orderId: orderId,
          status: status,
          previousStatus: existingOrder.status,
          action: 'STATUS_CHANGE',
          description: `Statut changé de "${existingOrder.status}" vers "${status}"`,
          userId: session.user?.id || null
        }
      })
    ])
    
    console.log('✅ Transaction terminée avec succès')

    console.log(`✅ Statut de commande mis à jour: ${existingOrder.orderNumber || orderId} → ${status}`)
    console.log(`📝 Historique ajouté: ${existingOrder.status} → ${status}`)

    return NextResponse.json({
      success: true,
      order: {
        ...updatedOrder,
        updatedAt: updatedOrder.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ ERREUR DÉTAILLÉE lors de la mise à jour du statut:')
    console.error('   Type:', typeof error)
    console.error('   Message:', error instanceof Error ? error.message : String(error))
    console.error('   Stack:', error instanceof Error ? error.stack : 'Pas de stack trace')
    console.error('   Erreur complète:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}