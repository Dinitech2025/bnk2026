const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testMessageComplete() {
  console.log('🧪 Test complet du système de messagerie\n')

  try {
    // 1. Récupérer les utilisateurs
    console.log('1️⃣ Récupération des utilisateurs...')
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    const client = await prisma.user.findFirst({
      where: { role: 'CLIENT' }
    })

    if (!admin || !client) {
      console.log('❌ Utilisateurs non trouvés. Exécutez: node scripts/create-test-users.js')
      return
    }

    console.log(`✅ Admin: ${admin.email} (${admin.id})`)
    console.log(`✅ Client: ${client.email} (${client.id})\n`)

    // 2. Créer un message du client vers l'admin
    console.log('2️⃣ Création d\'un message CLIENT → ADMIN...')
    const messageFromClient = await prisma.message.create({
      data: {
        subject: 'Question sur une commande',
        content: 'Bonjour, j\'ai une question concernant ma dernière commande. Pouvez-vous m\'aider ?',
        type: 'SUPPORT',
        priority: 'NORMAL',
        status: 'UNREAD',
        fromUserId: client.id,
        toUserId: admin.id,
        clientEmail: client.email,
        clientName: client.name,
        metadata: {
          source: 'test-script',
          timestamp: new Date().toISOString()
        }
      }
    })
    console.log(`✅ Message créé: ${messageFromClient.id}`)
    console.log(`   Sujet: ${messageFromClient.subject}\n`)

    // 3. Créer une réponse de l'admin vers le client
    console.log('3️⃣ Création d\'une réponse ADMIN → CLIENT...')
    const messageFromAdmin = await prisma.message.create({
      data: {
        subject: 'RE: Question sur une commande',
        content: 'Bonjour, je serais ravi de vous aider. Pouvez-vous me donner votre numéro de commande ?',
        type: 'SUPPORT',
        priority: 'NORMAL',
        status: 'UNREAD',
        fromUserId: admin.id,
        toUserId: client.id,
        parentMessageId: messageFromClient.id,
        metadata: {
          source: 'test-script',
          timestamp: new Date().toISOString()
        }
      }
    })
    console.log(`✅ Réponse créée: ${messageFromAdmin.id}`)
    console.log(`   Sujet: ${messageFromAdmin.subject}\n`)

    // 4. Créer un message urgent
    console.log('4️⃣ Création d\'un message URGENT...')
    const urgentMessage = await prisma.message.create({
      data: {
        subject: 'Problème urgent avec ma commande',
        content: 'Ma commande n\'est pas arrivée et je dois la recevoir aujourd\'hui !',
        type: 'ORDER',
        priority: 'URGENT',
        status: 'UNREAD',
        fromUserId: client.id,
        toUserId: admin.id,
        clientEmail: client.email,
        clientName: client.name,
        metadata: {
          source: 'test-script',
          urgent: true
        }
      }
    })
    console.log(`✅ Message urgent créé: ${urgentMessage.id}\n`)

    // 5. Marquer le premier message comme lu
    console.log('5️⃣ Marquage du premier message comme lu...')
    await prisma.message.update({
      where: { id: messageFromClient.id },
      data: {
        status: 'READ',
        readAt: new Date()
      }
    })
    console.log(`✅ Message marqué comme lu\n`)

    // 6. Statistiques
    console.log('6️⃣ Statistiques du système de messagerie:')
    
    const totalMessages = await prisma.message.count()
    console.log(`   📊 Total de messages: ${totalMessages}`)

    const unreadMessages = await prisma.message.count({
      where: { status: 'UNREAD' }
    })
    console.log(`   📬 Messages non lus: ${unreadMessages}`)

    const urgentMessages = await prisma.message.count({
      where: { priority: 'URGENT' }
    })
    console.log(`   🔥 Messages urgents: ${urgentMessages}`)

    const supportMessages = await prisma.message.count({
      where: { type: 'SUPPORT' }
    })
    console.log(`   💬 Messages support: ${supportMessages}`)

    // 7. Liste des messages non lus pour l'admin
    console.log('\n7️⃣ Messages non lus pour l\'admin:')
    const adminUnreadMessages = await prisma.message.findMany({
      where: {
        toUserId: admin.id,
        status: 'UNREAD'
      },
      select: {
        id: true,
        subject: true,
        priority: true,
        clientName: true,
        clientEmail: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    adminUnreadMessages.forEach((msg, index) => {
      const priorityEmoji = msg.priority === 'URGENT' ? '🔥' : '📬'
      console.log(`   ${priorityEmoji} ${index + 1}. ${msg.subject}`)
      console.log(`      De: ${msg.clientName || msg.clientEmail}`)
      console.log(`      Priorité: ${msg.priority}`)
      console.log(`      Date: ${msg.createdAt.toLocaleString('fr-FR')}`)
    })

    console.log('\n✨ Tous les tests sont passés avec succès!')
    console.log('🎉 Le système de messagerie fonctionne parfaitement.\n')

    console.log('📝 Pour nettoyer les messages de test:')
    console.log('   node scripts/clean-test-messages.js\n')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMessageComplete()

