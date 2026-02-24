const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testMessageSystem() {
  console.log('🧪 Test du système de messagerie client\n')

  try {
    // 1. Vérifier que la table Message existe
    console.log('1️⃣ Vérification de la table Message...')
    const messageCount = await prisma.message.count()
    console.log(`✅ Table Message accessible. ${messageCount} messages existants.\n`)

    // 2. Créer un message de test
    console.log('2️⃣ Création d\'un message de test...')
    const testMessage = await prisma.message.create({
      data: {
        subject: 'Message de test système',
        content: 'Ceci est un message de test pour vérifier le bon fonctionnement du système de messagerie.',
        type: 'SUPPORT',
        priority: 'NORMAL',
        status: 'UNREAD',
        fromUserId: 'cmguocx4z0003mefn4x42g9gq', // Admin
        toUserId: 'cmguocx4z0003mefn4x42g9gq', // Même utilisateur pour le test
        metadata: {
          test: true,
          createdBy: 'test-script'
        }
      }
    })
    console.log(`✅ Message créé avec succès: ${testMessage.id}\n`)

    // 3. Lire le message
    console.log('3️⃣ Lecture du message...')
    const readMessage = await prisma.message.findUnique({
      where: { id: testMessage.id },
      include: {
        fromUser: true,
        toUser: true
      }
    })
    console.log(`✅ Message lu: ${readMessage.subject}\n`)

    // 4. Mettre à jour le statut du message
    console.log('4️⃣ Marquage comme lu...')
    const updatedMessage = await prisma.message.update({
      where: { id: testMessage.id },
      data: {
        status: 'READ',
        readAt: new Date()
      }
    })
    console.log(`✅ Statut mis à jour: ${updatedMessage.status}\n`)

    // 5. Tester les filtres
    console.log('5️⃣ Test des filtres...')
    const unreadMessages = await prisma.message.findMany({
      where: { status: 'UNREAD' },
      take: 5
    })
    console.log(`✅ ${unreadMessages.length} messages non lus trouvés\n`)

    const urgentMessages = await prisma.message.findMany({
      where: {
        priority: 'URGENT',
        status: { in: ['UNREAD', 'READ'] }
      },
      take: 5
    })
    console.log(`✅ ${urgentMessages.length} messages urgents trouvés\n`)

    // 6. Supprimer le message de test
    console.log('6️⃣ Nettoyage...')
    await prisma.message.delete({
      where: { id: testMessage.id }
    })
    console.log(`✅ Message de test supprimé\n`)

    // 7. Statistiques globales
    console.log('7️⃣ Statistiques globales:')
    const stats = await prisma.message.groupBy({
      by: ['status'],
      _count: true
    })
    console.log('\nRépartition par statut:')
    stats.forEach(stat => {
      console.log(`  - ${stat.status}: ${stat._count} messages`)
    })

    const priorityStats = await prisma.message.groupBy({
      by: ['priority'],
      _count: true
    })
    console.log('\nRépartition par priorité:')
    priorityStats.forEach(stat => {
      console.log(`  - ${stat.priority}: ${stat._count} messages`)
    })

    const typeStats = await prisma.message.groupBy({
      by: ['type'],
      _count: true
    })
    console.log('\nRépartition par type:')
    typeStats.forEach(stat => {
      console.log(`  - ${stat.type}: ${stat._count} messages`)
    })

    console.log('\n✨ Tous les tests sont passés avec succès!')
    console.log('🎉 Le système de messagerie fonctionne correctement.\n')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    console.error('\n⚠️  Le système de messages n\'est pas correctement configuré.')
    console.error('💡 Assurez-vous d\'avoir exécuté: npx prisma db push\n')
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter les tests
testMessageSystem()

