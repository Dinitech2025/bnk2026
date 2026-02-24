const fetch = require('node-fetch');

async function testOrderCreation() {
  console.log('🧪 TEST CRÉATION COMMANDE');
  console.log('========================');
  
  const testOrderData = {
    items: [
      {
        id: 'test-product-1',
        productId: 'test-product-1',
        name: 'Produit Test',
        price: 10000,
        quantity: 1,
        type: 'product'
      }
    ],
    total: 10000,
    currency: 'Ar',
    shippingAddress: {
      street: '123 Rue Test',
      city: 'Antananarivo',
      zipCode: '101',
      country: 'Madagascar',
      phone: '+261 34 12 345 67'
    },
    billingAddress: {
      street: '123 Rue Test',
      city: 'Antananarivo',
      zipCode: '101',
      country: 'Madagascar',
      phone: '+261 34 12 345 67'
    },
    email: 'test@example.com',
    phone: '+261 34 12 345 67',
    firstName: 'Test',
    lastName: 'User',
    paymentData: {
      method: 'paypal',
      status: 'completed',
      transactionId: 'TEST_PAYPAL_' + Date.now(),
      paypalOrderId: 'PAYPAL_ORDER_TEST',
      details: {
        test: true
      }
    },
    notes: 'Commande de test'
  };

  try {
    console.log('📤 Envoi des données de test...');
    console.log('URL:', 'http://localhost:3000/api/orders/create');
    console.log('Données:', JSON.stringify(testOrderData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrderData)
    });

    console.log('📥 Réponse reçue:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseData = await response.json();
    console.log('Data:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('✅ SUCCÈS: Commande créée avec succès!');
      console.log('Order ID:', responseData.order?.id);
      console.log('Order Number:', responseData.order?.orderNumber);
    } else {
      console.log('❌ ERREUR: Échec de création de commande');
      console.log('Erreur:', responseData.error);
      console.log('Détails:', responseData.details);
    }

  } catch (error) {
    console.error('❌ ERREUR RÉSEAU:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Exécuter le test
testOrderCreation();

