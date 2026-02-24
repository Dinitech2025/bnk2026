const { PrismaClient } = require('@prisma/client')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function cleanupOldQuoteMessages() {
  console.log('🧹 Nettoyage des anciens QuoteMessage...\n')

  try {
    // 1. Vérifier ce qui va être supprimé
    const oldMessages = await prisma.quoteMessage.findMany({
      include: {
        quote: {
          include: {
            service: {
              select: {
                name: true
              }
            }
          }
        },
        sender: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (oldMessages.length === 0) {
      console.log('✅ Aucun ancien QuoteMessage à nettoyer.')
      console.log('Le système est déjà propre!')
      return
    }

    console.log(`⚠️ ${oldMessages.length} anciens QuoteMessage trouvés:\n`)
    oldMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. ${msg.quote.service.name}`)
      console.log(`      De: ${msg.sender.name || msg.sender.email}`)
      console.log(`      Date: ${msg.createdAt.toLocaleString('fr-FR')}`)
      console.log(`      Message: ${msg.message.substring(0, 50)}...`)
      console.log('')
    })

    // 2. Vérifier que tous les messages ont été migrés
    console.log('🔍 Vérification de la migration...')
    const migratedCount = await prisma.message.count({
      where: {
        metadata: {
          path: ['migratedFrom'],
          equals: 'QuoteMessage'
        }
      }
    })

    console.log(`   ✅ ${migratedCount} messages migrés trouvés dans le système unifié`)
    
    if (migratedCount < oldMessages.length) {
      console.log(`   ⚠️ ATTENTION: Seulement ${migratedCount}/${oldMessages.length} messages ont été migrés!`)
      console.log('   ❌ Annulation du nettoyage pour éviter la perte de données.')
      console.log('   💡 Relancez la migration: node scripts/unify-message-systems.js')
      return
    }

    // 3. Demander confirmation
    console.log('\n⚠️ ATTENTION: Cette action est IRRÉVERSIBLE!')
    console.log('Les anciens QuoteMessage seront définitivement supprimés.')
    console.log('Les données sont sauvegardées dans le système Message unifié.\n')

    const answer = await question('Voulez-vous continuer? (oui/non): ')

    if (answer.toLowerCase() !== 'oui') {
      console.log('❌ Nettoyage annulé.')
      return
    }

    // 4. Supprimer les anciens messages
    console.log('\n🗑️ Suppression des anciens QuoteMessage...')
    const deleted = await prisma.quoteMessage.deleteMany({})

    console.log(`✅ ${deleted.count} anciens QuoteMessage supprimés`)

    // 5. Vérification finale
    const remaining = await prisma.quoteMessage.count()
    console.log(`\n📊 Vérification finale:`)
    console.log(`   QuoteMessage restants: ${remaining}`)
    console.log(`   Messages dans système unifié: ${await prisma.message.count()}`)

    if (remaining === 0) {
      console.log('\n✅ NETTOYAGE TERMINÉ AVEC SUCCÈS!')
      console.log('🎉 Le système est maintenant entièrement unifié!')
      console.log('   ✅ Tous les anciens QuoteMessage ont été supprimés')
      console.log('   ✅ Les données sont préservées dans le système Message')
      console.log('   ✅ Le workflow de devis fonctionne avec le système unifié')
    } else {
      console.log('\n⚠️ Attention: Des QuoteMessage restants ont été détectés')
      console.log('Vérifiez manuellement la base de données.')
    }

  } catch (error) {
    console.error('\n❌ ERREUR:', error)
    console.error('Stack:', error.stack)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

cleanupOldQuoteMessages()

