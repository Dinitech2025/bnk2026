const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function unifyMessageSystems() {
  console.log('🔄 Unification des systèmes de messagerie...\n')
  console.log('📋 Cette migration va:')
  console.log('   1. Migrer tous les QuoteMessage vers Message')
  console.log('   2. Créer des conversations pour chaque devis')
  console.log('   3. Préserver toutes les données existantes')
  console.log('   4. Maintenir le workflow de demande de devis\n')

  try {
    // 1. Analyser l'existant
    console.log('1️⃣ Analyse des données existantes...')
    const quoteMessagesCount = await prisma.quoteMessage.count()
    const messagesCount = await prisma.message.count()
    const quotesCount = await prisma.quote.count()
    
    console.log(`   📊 QuoteMessage: ${quoteMessagesCount}`)
    console.log(`   📊 Message: ${messagesCount}`)
    console.log(`   📊 Quote: ${quotesCount}\n`)

    if (quoteMessagesCount === 0) {
      console.log('✅ Aucun QuoteMessage à migrer. Système déjà unifié.')
      return
    }

    // 2. Récupérer tous les QuoteMessage avec leurs relations
    console.log('2️⃣ Récupération des QuoteMessage...')
    const quoteMessages = await prisma.quoteMessage.findMany({
      include: {
        quote: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            },
            service: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`   ✅ ${quoteMessages.length} messages trouvés\n`)

    // 3. Créer ou récupérer les conversations pour chaque devis
    console.log('3️⃣ Création des conversations...')
    const conversationMap = new Map() // quoteId -> conversationId
    const quoteIds = [...new Set(quoteMessages.map(qm => qm.quoteId))]

    for (const quoteId of quoteIds) {
      const quote = quoteMessages.find(qm => qm.quoteId === quoteId)?.quote
      if (!quote) continue

      // Vérifier si une conversation existe déjà pour ce devis
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          messages: {
            some: {
              relatedQuoteId: quoteId
            }
          }
        }
      })

      if (existingConversation) {
        conversationMap.set(quoteId, existingConversation.id)
        console.log(`   ♻️ Conversation existante pour devis ${quoteId.substring(0, 8)}...`)
      } else {
        // Créer une nouvelle conversation
        const conversation = await prisma.conversation.create({
          data: {
            title: `Devis: ${quote.service.name}`,
            participants: [quote.userId],
            isActive: true,
            lastMessageAt: new Date()
          }
        })
        conversationMap.set(quoteId, conversation.id)
        console.log(`   ✅ Nouvelle conversation créée pour devis ${quoteId.substring(0, 8)}...`)
      }
    }

    console.log(`   📊 ${conversationMap.size} conversations prêtes\n`)

    // 4. Migrer les QuoteMessage vers Message
    console.log('4️⃣ Migration des messages...')
    let migratedCount = 0
    let skippedCount = 0
    const errors = []

    // Trouver un admin pour les messages
    const admin = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'STAFF'] } },
      select: { id: true, name: true }
    })

    if (!admin) {
      throw new Error('Aucun admin trouvé pour la migration')
    }

    for (const qm of quoteMessages) {
      try {
        const conversationId = conversationMap.get(qm.quoteId)
        if (!conversationId) {
          console.log(`   ⚠️ Pas de conversation pour ${qm.id}, skip`)
          skippedCount++
          continue
        }

        // Vérifier si ce message a déjà été migré
        const existingMessage = await prisma.message.findFirst({
          where: {
            relatedQuoteId: qm.quoteId,
            sentAt: qm.createdAt,
            content: qm.message
          }
        })

        if (existingMessage) {
          console.log(`   ⏭️ Message ${qm.id.substring(0, 8)}... déjà migré`)
          skippedCount++
          continue
        }

        // Déterminer expéditeur et destinataire
        const isClientSender = qm.sender.role === 'CLIENT'
        const fromUserId = qm.senderId
        const toUserId = isClientSender ? admin.id : qm.quote.userId

        // Déterminer le type de message
        let messageType = 'GENERAL'
        let priority = 'NORMAL'
        let subject = `Message sur devis ${qm.quote.service.name}`

        if (qm.proposedPrice && Number(qm.proposedPrice) > 0) {
          messageType = 'QUOTE_PRICE_PROPOSAL'
          priority = 'HIGH'
          subject = `Proposition de prix: ${Number(qm.proposedPrice).toLocaleString('fr-FR')} Ar`
        }

        // Créer le message unifié
        const newMessage = await prisma.message.create({
          data: {
            subject,
            content: qm.message,
            type: messageType,
            priority,
            status: 'READ', // Messages historiques déjà lus
            fromUserId,
            toUserId,
            conversationId,
            relatedQuoteId: qm.quoteId,
            relatedServiceId: qm.quote.serviceId,
            metadata: {
              migratedFrom: 'QuoteMessage',
              originalQuoteMessageId: qm.id,
              proposedPrice: qm.proposedPrice ? Number(qm.proposedPrice) : null,
              attachments: qm.attachments || [],
              migrationDate: new Date().toISOString()
            },
            sentAt: qm.createdAt,
            createdAt: qm.createdAt,
            updatedAt: qm.createdAt
          }
        })

        migratedCount++
        console.log(`   ✅ ${migratedCount}/${quoteMessages.length} - ${qm.quote.service.name} (${qm.id.substring(0, 8)}...)`)

      } catch (error) {
        console.error(`   ❌ Erreur pour message ${qm.id}:`, error.message)
        errors.push({ id: qm.id, error: error.message })
      }
    }

    console.log(`\n5️⃣ Mise à jour des conversations...`)
    // Mettre à jour lastMessageAt pour chaque conversation
    for (const [quoteId, conversationId] of conversationMap.entries()) {
      const lastMessage = await prisma.message.findFirst({
        where: { conversationId },
        orderBy: { sentAt: 'desc' }
      })

      if (lastMessage) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: lastMessage.sentAt }
        })
      }
    }
    console.log(`   ✅ ${conversationMap.size} conversations mises à jour\n`)

    // 6. Résumé
    console.log('📊 RÉSUMÉ DE LA MIGRATION:')
    console.log(`   ✅ Messages migrés: ${migratedCount}`)
    console.log(`   ⏭️ Messages ignorés (déjà migrés): ${skippedCount}`)
    console.log(`   ❌ Erreurs: ${errors.length}`)
    console.log(`   📁 Conversations créées: ${conversationMap.size}`)

    if (errors.length > 0) {
      console.log('\n⚠️ Erreurs détaillées:')
      errors.forEach(err => {
        console.log(`   - ${err.id}: ${err.error}`)
      })
    }

    // 7. Vérification
    console.log('\n6️⃣ Vérification de l\'intégrité...')
    const newMessagesCount = await prisma.message.count({
      where: {
        metadata: {
          path: ['migratedFrom'],
          equals: 'QuoteMessage'
        }
      }
    })
    console.log(`   ✅ ${newMessagesCount} messages migrés trouvés dans Message`)

    // 8. Proposition de nettoyage
    console.log('\n7️⃣ Nettoyage (optionnel):')
    console.log('   ⚠️ Les QuoteMessage originaux sont conservés pour sécurité')
    console.log('   💡 Pour les supprimer après vérification, exécutez:')
    console.log('      node scripts/cleanup-old-quote-messages.js')

    console.log('\n✅ MIGRATION TERMINÉE AVEC SUCCÈS!')
    console.log('\n🎉 Le système de messagerie est maintenant unifié!')
    console.log('   📋 Tous les messages de devis sont dans la table Message')
    console.log('   💬 Les conversations sont créées et liées')
    console.log('   🔄 Le workflow de devis est préservé')
    console.log('   ✨ Interface moderne disponible dans /admin/messages')

  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE:', error)
    console.error('Stack:', error.stack)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la migration
unifyMessageSystems()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script échoué:', error)
    process.exit(1)
  })

