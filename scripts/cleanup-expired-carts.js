#!/usr/bin/env node

/**
 * Script de nettoyage automatique des paniers expirés
 * 
 * Usage:
 * - node scripts/cleanup-expired-carts.js
 * - npm run cleanup:carts
 * 
 * Ce script peut être exécuté via cron job pour un nettoyage périodique:
 * # Tous les jours à 2h du matin
 * 0 2 * * * cd /path/to/project && node scripts/cleanup-expired-carts.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupExpiredCarts() {
  console.log('🧹 Démarrage du nettoyage des paniers expirés...')
  console.log('📅 Date:', new Date().toLocaleString('fr-FR'))
  
  try {
    const now = new Date()
    
    // Statistiques avant nettoyage
    console.log('\n📊 Analyse des paniers...')
    
    const expiredCartsCount = await prisma.cart.count({
      where: {
        expiresAt: {
          lt: now
        }
      }
    })
    
    const expiredGuestCarts = await prisma.cart.count({
      where: {
        userId: null,
        expiresAt: {
          lt: now
        }
      }
    })
    
    const expiredUserCarts = await prisma.cart.count({
      where: {
        userId: { not: null },
        expiresAt: {
          lt: now
        }
      }
    })
    
    const expiredItemsCount = await prisma.cartItem.count({
      where: {
        cart: {
          expiresAt: {
            lt: now
          }
        }
      }
    })

    console.log(`📈 Paniers expirés trouvés: ${expiredCartsCount}`)
    console.log(`   👤 Paniers invités: ${expiredGuestCarts}`)
    console.log(`   🔐 Paniers utilisateurs: ${expiredUserCarts}`)
    console.log(`   📦 Articles dans paniers expirés: ${expiredItemsCount}`)

    if (expiredCartsCount === 0) {
      console.log('✅ Aucun panier expiré à nettoyer')
      return {
        success: true,
        cleaned: { carts: 0, items: 0 },
        message: 'Aucun nettoyage nécessaire'
      }
    }

    // Nettoyage
    console.log('\n🗑️ Suppression des paniers expirés...')
    
    const result = await prisma.cart.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    })

    console.log(`✅ Nettoyage terminé avec succès!`)
    console.log(`   🗑️ Paniers supprimés: ${result.count}`)
    console.log(`   📦 Articles supprimés: ${expiredItemsCount}`)
    
    // Statistiques après nettoyage
    const remainingCarts = await prisma.cart.count()
    const remainingGuestCarts = await prisma.cart.count({
      where: { userId: null }
    })
    const remainingUserCarts = await prisma.cart.count({
      where: { userId: { not: null } }
    })
    
    console.log(`\n📊 Paniers restants: ${remainingCarts}`)
    console.log(`   👤 Paniers invités actifs: ${remainingGuestCarts}`)
    console.log(`   🔐 Paniers utilisateurs actifs: ${remainingUserCarts}`)

    return {
      success: true,
      cleaned: {
        carts: result.count,
        items: expiredItemsCount
      },
      remaining: {
        totalCarts: remainingCarts,
        guestCarts: remainingGuestCarts,
        userCarts: remainingUserCarts
      },
      message: `${result.count} paniers expirés supprimés`
    }

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
    throw error
  }
}

async function main() {
  try {
    const result = await cleanupExpiredCarts()
    
    console.log('\n🎉 Script terminé avec succès!')
    console.log('📋 Résumé:', result.message)
    
    process.exit(0)
  } catch (error) {
    console.error('\n💥 Échec du script de nettoyage:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main()
}

module.exports = { cleanupExpiredCarts }




