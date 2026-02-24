const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function createMessageTables() {
  console.log('🔧 Création des tables de messagerie...\n')

  try {
    // Créer la table Message de base
    console.log('📝 Création de la table Message...')
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Message" (
        "id" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'GENERAL',
        "priority" TEXT NOT NULL DEFAULT 'NORMAL',
        "status" TEXT NOT NULL DEFAULT 'UNREAD',
        "fromUserId" TEXT,
        "toUserId" TEXT,
        "parentMessageId" TEXT,
        "relatedOrderId" TEXT,
        "relatedSubscriptionId" TEXT,
        "relatedQuoteId" TEXT,
        "metadata" JSONB,
        "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "readAt" TIMESTAMP(3),
        "repliedAt" TIMESTAMP(3),
        "isPublic" BOOLEAN DEFAULT false,
        "clientEmail" TEXT,
        "clientName" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
      )
    `
    console.log('✅ Table Message créée')

    // Créer la table Conversation de base
    console.log('📝 Création de la table Conversation...')
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Conversation" (
        "id" TEXT NOT NULL,
        "title" TEXT,
        "participants" TEXT[],
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
      )
    `
    console.log('✅ Table Conversation créée')

    // Créer les index
    console.log('📝 Création des index...')
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Message_status_idx" ON "Message"("status");
      CREATE INDEX IF NOT EXISTS "Message_type_idx" ON "Message"("type");
      CREATE INDEX IF NOT EXISTS "Message_priority_idx" ON "Message"("priority");
      CREATE INDEX IF NOT EXISTS "Message_fromUserId_idx" ON "Message"("fromUserId");
      CREATE INDEX IF NOT EXISTS "Message_toUserId_idx" ON "Message"("toUserId");
      CREATE INDEX IF NOT EXISTS "Message_isPublic_idx" ON "Message"("isPublic");
      CREATE INDEX IF NOT EXISTS "Message_relatedOrderId_idx" ON "Message"("relatedOrderId");
      CREATE INDEX IF NOT EXISTS "Message_relatedSubscriptionId_idx" ON "Message"("relatedSubscriptionId");
      CREATE INDEX IF NOT EXISTS "Conversation_isActive_idx" ON "Conversation"("isActive");
      CREATE INDEX IF NOT EXISTS "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");
    `
    console.log('✅ Index créés')

    // Ajouter les clés étrangères de base
    console.log('📝 Ajout des clés étrangères...')
    await prisma.$executeRaw`
      ALTER TABLE "Message" ADD CONSTRAINT "Message_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      ALTER TABLE "Message" ADD CONSTRAINT "Message_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      ALTER TABLE "Message" ADD CONSTRAINT "Message_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      ALTER TABLE "Message" ADD CONSTRAINT "Message_relatedOrderId_fkey" FOREIGN KEY ("relatedOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      ALTER TABLE "Message" ADD CONSTRAINT "Message_relatedSubscriptionId_fkey" FOREIGN KEY ("relatedSubscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      ALTER TABLE "Message" ADD CONSTRAINT "Message_relatedQuoteId_fkey" FOREIGN KEY ("relatedQuoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `
    console.log('✅ Clés étrangères ajoutées')

    // Tester la table
    console.log('🧪 Test de la table Message...')
    const count = await prisma.message.count()
    console.log(`✅ Table Message accessible. ${count} messages existants.`)

    console.log('\n🎉 Tables de messagerie créées avec succès!')
    console.log('\n💡 Prochaines étapes:')
    console.log('   1. Redémarrez votre serveur de développement')
    console.log('   2. Testez les APIs de messagerie')
    console.log('   3. Vérifiez l\'interface admin et publique\n')

  } catch (error) {
    console.error('\n❌ Erreur lors de la création des tables:', error.message)
    console.error('\n💡 Solutions possibles:')
    console.error('   1. Vérifiez que DATABASE_URL est correctement configuré')
    console.error('   2. Vérifiez que vous avez les permissions sur la base de données')
    console.error('   3. Les tables existent peut-être déjà\n')
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la création
createMessageTables()

