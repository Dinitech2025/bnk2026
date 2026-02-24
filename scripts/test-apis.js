const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAPIs() {
  console.log('🧪 Test des APIs admin...\n')

  try {
    // 1. Test de l'API messages (GET)
    console.log('1️⃣ Test API messages (GET)...')
    const messagesResponse = await fetch('http://localhost:3000/api/admin/messages')
    if (messagesResponse.ok) {
      const messagesData = await messagesResponse.json()
      console.log(`✅ Messages API: ${messagesData.pagination?.total || 0} messages trouvés`)
    } else {
      console.log(`❌ Messages API: ${messagesResponse.status} ${messagesResponse.statusText}`)
    }

    // 2. Test de l'API tasks (GET)
    console.log('\n2️⃣ Test API tasks (GET)...')
    const tasksResponse = await fetch('http://localhost:3000/api/admin/tasks')
    if (tasksResponse.ok) {
      const tasksData = await tasksResponse.json()
      console.log(`✅ Tasks API: ${tasksData.pagination?.total || 0} tâches trouvées`)
    } else {
      console.log(`❌ Tasks API: ${tasksResponse.status} ${tasksResponse.statusText}`)
    }

    // 3. Test de l'API notifications (GET)
    console.log('\n3️⃣ Test API notifications (GET)...')
    const notificationsResponse = await fetch('http://localhost:3000/api/admin/notifications')
    if (notificationsResponse.ok) {
      const notificationsData = await notificationsResponse.json()
      console.log(`✅ Notifications API: ${notificationsData.unreadCount || 0} notifications`)
    } else {
      console.log(`❌ Notifications API: ${notificationsResponse.status} ${notificationsResponse.statusText}`)
    }

    // 4. Test de l'API carts cleanup (GET)
    console.log('\n4️⃣ Test API carts cleanup (GET)...')
    const cleanupResponse = await fetch('http://localhost:3000/api/admin/carts/cleanup')
    if (cleanupResponse.ok) {
      const cleanupData = await cleanupResponse.json()
      console.log(`✅ Cleanup API: ${cleanupData.statistics?.expired?.totalCarts || 0} paniers à nettoyer`)
    } else {
      console.log(`❌ Cleanup API: ${cleanupResponse.status} ${cleanupResponse.statusText}`)
    }

    // 5. Test de l'API carts cleanup (POST)
    console.log('\n5️⃣ Test API carts cleanup (POST)...')
    const cleanupPostResponse = await fetch('http://localhost:3000/api/admin/carts/cleanup', {
      method: 'POST'
    })
    if (cleanupPostResponse.ok) {
      const cleanupPostData = await cleanupPostResponse.json()
      console.log(`✅ Cleanup POST: ${cleanupPostData.deletedCount || 0} paniers supprimés`)
    } else {
      console.log(`❌ Cleanup POST: ${cleanupPostResponse.status} ${cleanupPostResponse.statusText}`)
    }

    console.log('\n✨ Tests des APIs terminés!')

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter les tests si appelé directement
if (require.main === module) {
  testAPIs()
}

module.exports = { testAPIs }
