// Test de validation des codes promo
async function testPromoValidation() {
  const baseUrl = 'http://localhost:3000'
  
  console.log('🧪 Test de validation des codes promo...\n')

  const testCases = [
    {
      code: 'WELCOME10',
      orderAmount: 60000, // 60K Ar
      expected: { valid: true, discountType: 'PERCENTAGE', discountValue: 6000 }
    },
    {
      code: 'WELCOME10',
      orderAmount: 30000, // 30K Ar (en dessous du minimum)
      expected: { valid: false, reason: 'Montant minimum non atteint' }
    },
    {
      code: 'SAVE20K',
      orderAmount: 120000, // 120K Ar
      expected: { valid: true, discountType: 'FIXED_AMOUNT', discountValue: 20000 }
    },
    {
      code: 'FREESHIP',
      orderAmount: 80000, // 80K Ar
      expected: { valid: true, discountType: 'FREE_SHIPPING', discountValue: 0 }
    },
    {
      code: 'INVALID_CODE',
      orderAmount: 100000,
      expected: { valid: false, reason: 'Code inexistant' }
    },
    {
      code: 'VIP25',
      orderAmount: 250000, // 250K Ar
      expected: { valid: true, discountType: 'PERCENTAGE', discountValue: 62500 }
    }
  ]

  for (const testCase of testCases) {
    try {
      console.log(`🔍 Test: ${testCase.code} avec ${testCase.orderAmount.toLocaleString()} Ar`)
      
      const response = await fetch(`${baseUrl}/api/promotions/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: testCase.code,
          cartTotal: testCase.orderAmount
        })
      })

      const result = await response.json()
      
      if (testCase.expected.valid) {
        if (result.valid) {
          console.log(`   ✅ Valide - Réduction: ${result.discountAmount?.toLocaleString() || 0} Ar`)
        } else {
          console.log(`   ❌ Échec - Attendu valide mais reçu: ${result.error}`)
        }
      } else {
        if (!result.valid) {
          console.log(`   ✅ Invalide comme attendu - ${result.error}`)
        } else {
          console.log(`   ❌ Échec - Attendu invalide mais code accepté`)
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Erreur réseau: ${error.message}`)
    }
    
    console.log('')
  }

  console.log('🎯 Tests terminés ! Vous pouvez maintenant tester manuellement dans le checkout.')
  console.log('📍 Allez sur: http://localhost:3000/checkout')
  console.log('💡 Ajoutez des articles au panier puis testez les codes promo.')
}

// Attendre que le serveur soit démarré
setTimeout(testPromoValidation, 3000)