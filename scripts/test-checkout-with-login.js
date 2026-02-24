const { PrismaClient } = require('@prisma/client')
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

const prisma = new PrismaClient()

async function testCheckoutWithLogin() {
  console.log('🧪 Test du checkout avec connexion/création de compte')
  
  try {
    // Test 1: Création de compte avec mot de passe
    console.log('\n📝 Test 1: Création de compte avec mot de passe')
    
    const testEmail = `test-checkout-${Date.now()}@example.com`
    const testPassword = 'motdepasse123'
    
    const orderData = {
      customer: {
        email: testEmail,
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '+261 34 12 34 56',
        password: testPassword,
        hasAccount: false, // Création de compte
        createAccount: true,
        newsletter: true
      },
      billingAddress: {
        street: '123 Rue de la Paix',
        city: 'Antananarivo',
        zipCode: '101',
        country: 'Madagascar'
      },
      shippingAddress: {
        street: '123 Rue de la Paix',
        city: 'Antananarivo',
        zipCode: '101',
        country: 'Madagascar'
      },
      items: [
        {
          id: 'cmcdhbbuc0086jv0u6wtq76x5', // Souris sans fil
          name: 'Souris sans fil',
          price: 45000,
          quantity: 1,
          type: 'product'
        }
      ],
      total: 45000,
      currency: 'Ar',
      paymentMethod: 'mobile_money', // Paiement instantané
      notes: 'Test de création de compte avec mot de passe',
      timestamp: new Date().toISOString()
    }

    console.log('Envoi de la commande avec création de compte...')
    const response = await fetch('http://localhost:3000/api/public/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Commande créée:', result.orderNumber)
      console.log('✅ Compte créé:', result.accountCreated)
      
      // Vérifier que le compte a été créé avec mot de passe
      const user = await prisma.user.findUnique({
        where: { email: testEmail }
      })
      
      if (user && user.password) {
        console.log('✅ Utilisateur créé avec mot de passe hashé')
      } else {
        console.log('❌ Problème avec la création du mot de passe')
      }
      
      // Test 2: Connexion avec le compte créé
      console.log('\n🔐 Test 2: Connexion avec le compte créé')
      
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      })

      const loginResult = await loginResponse.json()
      
      if (loginResult.success) {
        console.log('✅ Connexion réussie:', loginResult.user.email)
        
        // Test 3: Nouvelle commande avec compte existant
        console.log('\n🛒 Test 3: Nouvelle commande avec compte existant')
        
        const orderData2 = {
          ...orderData,
          customer: {
            ...orderData.customer,
            hasAccount: true, // Connexion à un compte existant
            createAccount: false
          },
          items: [
            {
              id: 'cmcdhidd100a3jv0ua0u0xafy', // Création logo professionnel
              name: 'Création logo professionnel',
              price: 50000,
              quantity: 1,
              type: 'service'
            }
          ],
          total: 50000,
          notes: 'Test de commande avec compte existant'
        }

        const response2 = await fetch('http://localhost:3000/api/public/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData2)
        })

        const result2 = await response2.json()
        
        if (result2.success) {
          console.log('✅ Deuxième commande créée:', result2.orderNumber)
          console.log('✅ Compte existant utilisé:', !result2.accountCreated)
        } else {
          console.log('❌ Erreur deuxième commande:', result2.message)
        }
        
      } else {
        console.log('❌ Erreur de connexion:', loginResult.message)
      }
      
      // Nettoyage
      console.log('\n🧹 Nettoyage des données de test...')
      
      // Supprimer les commandes de test
      await prisma.order.deleteMany({
        where: {
          userId: user.id
        }
      })
      
      // Supprimer les adresses de test
      await prisma.address.deleteMany({
        where: {
          userId: user.id
        }
      })
      
      // Supprimer l'utilisateur de test
      await prisma.user.delete({
        where: {
          id: user.id
        }
      })
      
      console.log('✅ Nettoyage terminé')
      
    } else {
      console.log('❌ Erreur lors de la création de la commande:', result.message)
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Lancer le test
testCheckoutWithLogin() 