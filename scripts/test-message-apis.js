const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testMessageAPIs() {
  console.log('🧪 Test des APIs de messagerie...\n')

  try {
    // 1. Test de l'API publique (GET)
    console.log('1️⃣ Test API messages publique (GET)...')
    const publicResponse = await fetch('http://localhost:3000/api/public/messages?clientEmail=test@example.com')
    if (publicResponse.ok) {
      const publicData = await publicResponse.json()
      console.log(`✅ Messages publique: ${publicData.messages?.length || 0} messages trouvés`)
    } else {
      console.log(`❌ Messages publique: ${publicResponse.status} ${publicResponse.statusText}`)
    }

    // 2. Test de l'API admin (GET) - sans auth (devrait échouer)
    console.log('\n2️⃣ Test API messages admin (GET)...')
    const adminResponse = await fetch('http://localhost:3000/api/admin/messages')
    if (adminResponse.ok) {
      const adminData = await adminResponse.json()
      console.log(`✅ Messages admin: ${adminData.pagination?.total || 0} messages trouvés`)
    } else {
      console.log(`❌ Messages admin: ${adminResponse.status} ${adminResponse.statusText}`)
    }

    // 3. Test de l'API notifications (GET) - sans auth (devrait échouer)
    console.log('\n3️⃣ Test API notifications (GET)...')
    const notificationsResponse = await fetch('http://localhost:3000/api/admin/notifications')
    if (notificationsResponse.ok) {
      const notificationsData = await notificationsResponse.json()
      console.log(`✅ Notifications: ${notificationsData.unreadCount || 0} notifications`)
    } else {
      console.log(`❌ Notifications: ${notificationsResponse.status} ${notificationsResponse.statusText}`)
    }

    // 4. Test de la création d'un message public
    console.log('\n4️⃣ Test création message public (POST)...')
    const createResponse = await fetch('http://localhost:3000/api/public/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: 'Test message API',
        content: 'Ceci est un test du système de messagerie',
        clientEmail: 'test@example.com',
        clientName: 'Test Client',
        type: 'SUPPORT',
      }),
    })

    if (createResponse.ok) {
      const createData = await createResponse.json()
      console.log(`✅ Message créé: ${createData.message}`)

      // 5. Test de récupération du message créé
      console.log('\n5️⃣ Test récupération du message créé...')
      const getCreatedResponse = await fetch(`http://localhost:3000/api/public/messages?clientEmail=test@example.com`)
      if (getCreatedResponse.ok) {
        const getCreatedData = await getCreatedResponse.json()
        console.log(`✅ Message récupéré: ${getCreatedData.messages?.length || 0} messages trouvés`)
      } else {
        console.log(`❌ Récupération message: ${getCreatedResponse.status} ${getCreatedResponse.statusText}`)
      }
    } else {
      console.log(`❌ Création message: ${createResponse.status} ${createResponse.statusText}`)
    }

    console.log('\n✨ Tests des APIs de messagerie terminés!')

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter les tests si appelé directement
if (require.main === module) {
  testMessageAPIs()
}

module.exports = { testMessageAPIs }
