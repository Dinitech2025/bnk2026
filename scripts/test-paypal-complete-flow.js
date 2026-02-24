const fetch = require('node-fetch');

async function testCompletePayPalFlow() {
  console.log('🧪 TEST FLUX PAYPAL COMPLET');
  console.log('===========================');
  
  try {
    // 1. Créer une commande PayPal
    console.log('1️⃣ Création commande PayPal...');
    
    const orderData = {
      items: [
        {
          id: 'test-flow-complete',
          name: 'Test Flux Complet PayPal',
          price: 15000,
          quantity: 1,
          type: 'product'
        }
      ],
      total: 15000,
      currency: 'Ar'
    };

    const createResponse = await fetch('http://localhost:3000/api/paypal/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: '3.00', // 15000 Ar = 3 EUR
        currency: 'EUR',
        orderData
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.log('❌ Erreur création commande:', errorData);
      return;
    }

    const createData = await createResponse.json();
    console.log('✅ Commande PayPal créée:', createData.id);
    
    // 2. Simuler la capture du paiement (comme si l'utilisateur avait payé)
    console.log('');
    console.log('2️⃣ Simulation capture paiement...');
    
    const captureResponse = await fetch('http://localhost:3000/api/paypal/capture-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderID: createData.id,
        orderData
      }),
    });

    console.log(`Status capture: ${captureResponse.status}`);
    const captureData = await captureResponse.json();
    
    if (captureResponse.ok && captureData.status === 'COMPLETED') {
      console.log('✅ Paiement capturé avec succès:', captureData.id);
      
      // 3. Créer la commande finale
      console.log('');
      console.log('3️⃣ Création commande finale...');
      
      const finalOrderResponse = await fetch('http://localhost:3000/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: orderData.items,
          total: orderData.total,
          currency: orderData.currency,
          shippingAddress: {
            street: '123 Test Flow Street',
            city: 'Antananarivo',
            zipCode: '101',
            country: 'Madagascar',
            phone: '+261 34 12 345 67'
          },
          billingAddress: {
            street: '123 Test Flow Street',
            city: 'Antananarivo',
            zipCode: '101',
            country: 'Madagascar',
            phone: '+261 34 12 345 67'
          },
          email: 'test-flow@paypal.com',
          phone: '+261 34 12 345 67',
          firstName: 'Test',
          lastName: 'Flow Complete',
          paymentData: {
            method: 'paypal',
            status: 'completed',
            transactionId: captureData.captureId || captureData.id,
            paypalOrderId: createData.id,
            amount: captureData.amount
          },
          notes: 'Test flux PayPal complet'
        })
      });

      if (finalOrderResponse.ok) {
        const finalOrder = await finalOrderResponse.json();
        console.log('✅ Commande finale créée:', finalOrder.order.orderNumber);
        console.log(`   Total: ${finalOrder.order.total} ${finalOrder.order.currency}`);
        console.log(`   Paiement: ${finalOrder.order.paymentMethod} (${finalOrder.order.paymentStatus})`);
        
        console.log('');
        console.log('🎉 FLUX PAYPAL COMPLET RÉUSSI !');
        console.log('================================');
        console.log('✅ Création commande PayPal');
        console.log('✅ Capture paiement PayPal');
        console.log('✅ Création commande finale');
        console.log('✅ Enregistrement paiement');
        
      } else {
        const errorData = await finalOrderResponse.json();
        console.log('❌ Erreur création commande finale:', errorData);
      }
      
    } else {
      console.log('❌ Erreur capture paiement:', captureData);
    }

  } catch (error) {
    console.error('❌ Erreur test flux complet:', error);
  }
}

testCompletePayPalFlow();

