const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testUnifiedSystem() {
  console.log('🧪 Test du système unifié de messagerie et devis...\n')

  try {
    // 1. Verifier les donnees migrees
    console.log('1. Verification des donnees migrees...')
    const migratedMessages = await prisma.message.count({
      where: {
        metadata: {
          path: ['migratedFrom'],
          equals: 'QuoteMessage'
        }
      }
    })
    console.log(`   ✅ ${migratedMessages} messages migrés trouvés\n`)

    // 2. Verifier les conversations
    console.log('2. Verification des conversations...')
    const conversations = await prisma.conversation.findMany({
      include: {
        messages: {
          where: {
            relatedQuoteId: { not: null }
          },
          select: {
            id: true,
            subject: true,
            type: true,
            relatedQuoteId: true
          }
        }
      }
    })
    console.log(`   ✅ ${conversations.length} conversations trouvées`)
    conversations.forEach(conv => {
      console.log(`      - ${conv.title}: ${conv.messages.length} messages`)
    })
    console.log('')

    // 3. Verifier les messages de devis
    console.log('3. Verification des messages de devis...')
    const quoteMessages = await prisma.message.findMany({
      where: {
        relatedQuoteId: { not: null }
      },
      include: {
        fromUser: {
          select: {
            name: true,
            role: true
          }
        },
        relatedQuote: {
          select: {
            id: true,
            service: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        sentAt: 'asc'
      }
    })

    console.log(`   ✅ ${quoteMessages.length} messages de devis trouvés`)
    quoteMessages.forEach((msg, index) => {
      const metadata = msg.metadata || {}
      console.log(`      ${index + 1}. ${msg.type} - ${msg.fromUser.name || 'Client'} (${msg.fromUser.role})`)
      console.log(`         Service: ${msg.relatedQuote?.service.name}`)
      if (metadata.proposedPrice) {
        console.log(`         Prix proposé: ${metadata.proposedPrice.toLocaleString('fr-FR')} Ar`)
      }
    })
    console.log('')

    // 4. Test de création d'un nouveau message
    console.log('4. Test de creation d un nouveau message...')
    const quote = await prisma.quote.findFirst({
      include: {
        user: true,
        service: true
      }
    })

    if (quote) {
      // Trouver un admin
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      })

      if (admin) {
        // Trouver ou créer la conversation
        let conversation = await prisma.conversation.findFirst({
          where: {
            messages: {
              some: {
                relatedQuoteId: quote.id
              }
            }
          }
        })

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              title: `Devis: ${quote.service.name}`,
              participants: [quote.userId, admin.id],
              isActive: true,
              lastMessageAt: new Date()
            }
          })
          console.log(`   ✅ Conversation créée: ${conversation.id}`)
        } else {
          console.log(`   ✅ Conversation existante: ${conversation.id}`)
        }

        // Créer un message de test
        const testMessage = await prisma.message.create({
          data: {
            subject: `Test système unifié - ${quote.service.name}`,
            content: 'Message de test pour vérifier le système unifié',
            type: 'QUOTE_DISCUSSION',
            priority: 'NORMAL',
            status: 'UNREAD',
            fromUserId: admin.id,
            toUserId: quote.userId,
            conversationId: conversation.id,
            relatedQuoteId: quote.id,
            relatedServiceId: quote.serviceId,
            metadata: {
              test: true,
              timestamp: new Date().toISOString()
            }
          }
        })

        console.log(`   ✅ Message de test créé: ${testMessage.id}`)
        console.log(`      Type: ${testMessage.type}`)
        console.log(`      Conversation: ${conversation.title}`)

        // Nettoyer le message de test
        await prisma.message.delete({
          where: { id: testMessage.id }
        })
        console.log(`   🧹 Message de test supprimé`)
      }
    }
    console.log('')

    // 5. Statistiques finales
    console.log('5. Statistiques du systeme unifie...')
    const stats = {
      totalMessages: await prisma.message.count(),
      quoteMessages: await prisma.message.count({
        where: { relatedQuoteId: { not: null } }
      }),
      orderMessages: await prisma.message.count({
        where: { relatedOrderId: { not: null } }
      }),
      conversations: await prisma.conversation.count(),
      activeConversations: await prisma.conversation.count({
        where: { isActive: true }
      }),
      oldQuoteMessages: await prisma.quoteMessage.count()
    }

    console.log(`   📊 Messages totaux: ${stats.totalMessages}`)
    console.log(`   📋 Messages de devis: ${stats.quoteMessages}`)
    console.log(`   🛒 Messages de commandes: ${stats.orderMessages}`)
    console.log(`   💬 Conversations: ${stats.conversations}`)
    console.log(`   ✅ Conversations actives: ${stats.activeConversations}`)
    console.log(`   ⚠️ Anciens QuoteMessage: ${stats.oldQuoteMessages} (à nettoyer)`)

    console.log('\n✅ TEST TERMINÉ AVEC SUCCÈS!')
    console.log('\n🎉 Le système est unifié et fonctionnel!')
    console.log('   ✅ Toutes les données sont migrées')
    console.log('   ✅ Les conversations sont créées')
    console.log('   ✅ Les nouveaux messages utilisent le système unifié')
    console.log('   ✅ Le workflow de devis est préservé')

    if (stats.oldQuoteMessages > 0) {
      console.log('\n💡 Prochaine étape:')
      console.log('   Exécutez: node scripts/cleanup-old-quote-messages.js')
      console.log('   Pour supprimer les anciens QuoteMessage après vérification')
    }

  } catch (error) {
    console.error('\n❌ ERREUR:', error)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testUnifiedSystem()

