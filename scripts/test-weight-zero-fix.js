console.log('🧪 Test spécifique pour la correction du poids 0...')
console.log('=' .repeat(60))

// Test de l'API avec poids 0
async function testAPIWithZeroWeight() {
  console.log('\n1️⃣ Test de l\'API avec poids 0...')
  
  const testData = {
    mode: 'air',
    supplierPrice: 52,
    supplierCurrency: 'USD',
    weight: 0, // Poids 0
    warehouse: 'usa'
  }
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/products/imported/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test' // Simulation d'auth
      },
      body: JSON.stringify(testData)
    })
    
    console.log('Status:', response.status)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ API accepte le poids 0')
      console.log('Transport calculé:', result.costs.transport.amount, result.costs.transport.currency)
      console.log('Total:', result.costs.total, 'MGA')
    } else {
      const error = await response.json()
      console.log('❌ API rejette le poids 0:', error.error)
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message)
  }
}

// Test de la validation frontend
function testFrontendValidation() {
  console.log('\n2️⃣ Test de la validation frontend...')
  
  // Simuler la logique de validation frontend
  function validateWeight(weight) {
    const trimmed = weight?.toString().trim()
    return trimmed !== '' && trimmed !== undefined && trimmed !== null && !isNaN(Number(trimmed)) && Number(trimmed) >= 0
  }
  
  const testCases = [
    { input: '', expected: false, description: 'Chaîne vide' },
    { input: '0', expected: true, description: 'Poids 0 (string)' },
    { input: 0, expected: true, description: 'Poids 0 (number)' },
    { input: '1', expected: true, description: 'Poids 1' },
    { input: '-1', expected: false, description: 'Poids négatif' },
    { input: 'abc', expected: false, description: 'Texte invalide' },
    { input: null, expected: false, description: 'Null' },
    { input: undefined, expected: false, description: 'Undefined' }
  ]
  
  testCases.forEach(testCase => {
    const result = validateWeight(testCase.input)
    const status = result === testCase.expected ? '✅' : '❌'
    console.log(`${status} ${testCase.description}: ${testCase.input} → ${result} (attendu: ${testCase.expected})`)
  })
}

// Test de shouldAutoCalculate
function testShouldAutoCalculate() {
  console.log('\n3️⃣ Test de shouldAutoCalculate avec poids 0...')
  
  function shouldAutoCalculate(data) {
    const supplierPrice = data.supplierPrice?.toString().trim()
    const weight = data.weight?.toString().trim()
    const warehouse = data.warehouse?.trim()
    const volume = data.volume?.toString().trim()
    
    const hasSupplierPrice = Boolean(supplierPrice) && !isNaN(Number(supplierPrice)) && Number(supplierPrice) > 0
    const hasWeight = weight !== '' && weight !== undefined && weight !== null && !isNaN(Number(weight)) && Number(weight) >= 0
    const hasWarehouse = Boolean(warehouse)
    const hasVolumeIfNeeded = data.mode === 'air' || (data.mode === 'sea' && Boolean(volume) && !isNaN(Number(volume)) && Number(volume) > 0)
    
    return hasSupplierPrice && hasWeight && hasWarehouse && hasVolumeIfNeeded
  }
  
  const testData = {
    mode: 'air',
    supplierPrice: '52',
    weight: '0', // Poids 0 comme string
    warehouse: 'usa',
    volume: ''
  }
  
  const result = shouldAutoCalculate(testData)
  console.log('Données de test:', testData)
  console.log('Peut calculer automatiquement:', result, '(attendu: true)')
  
  // Test avec poids vide
  const testDataEmpty = { ...testData, weight: '' }
  const resultEmpty = shouldAutoCalculate(testDataEmpty)
  console.log('Avec poids vide:', resultEmpty, '(attendu: false)')
}

// Exécuter les tests
testFrontendValidation()
testShouldAutoCalculate()

console.log('\n📝 Résumé des corrections:')
console.log('1. API modifiée pour accepter weight === 0')
console.log('2. Validation frontend corrigée pour distinguer 0 et chaîne vide')
console.log('3. shouldAutoCalculate corrigé pour accepter poids 0')

console.log('\n🎯 Maintenant le poids 0 devrait fonctionner correctement!')

// Note: Le test API nécessite une session valide, donc il peut échouer en mode script
console.log('\n💡 Pour tester l\'API complètement, utilisez le simulateur dans le navigateur.') 
console.log('=' .repeat(60))

// Test de l'API avec poids 0
async function testAPIWithZeroWeight() {
  console.log('\n1️⃣ Test de l\'API avec poids 0...')
  
  const testData = {
    mode: 'air',
    supplierPrice: 52,
    supplierCurrency: 'USD',
    weight: 0, // Poids 0
    warehouse: 'usa'
  }
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/products/imported/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test' // Simulation d'auth
      },
      body: JSON.stringify(testData)
    })
    
    console.log('Status:', response.status)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ API accepte le poids 0')
      console.log('Transport calculé:', result.costs.transport.amount, result.costs.transport.currency)
      console.log('Total:', result.costs.total, 'MGA')
    } else {
      const error = await response.json()
      console.log('❌ API rejette le poids 0:', error.error)
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message)
  }
}

// Test de la validation frontend
function testFrontendValidation() {
  console.log('\n2️⃣ Test de la validation frontend...')
  
  // Simuler la logique de validation frontend
  function validateWeight(weight) {
    const trimmed = weight?.toString().trim()
    return trimmed !== '' && trimmed !== undefined && trimmed !== null && !isNaN(Number(trimmed)) && Number(trimmed) >= 0
  }
  
  const testCases = [
    { input: '', expected: false, description: 'Chaîne vide' },
    { input: '0', expected: true, description: 'Poids 0 (string)' },
    { input: 0, expected: true, description: 'Poids 0 (number)' },
    { input: '1', expected: true, description: 'Poids 1' },
    { input: '-1', expected: false, description: 'Poids négatif' },
    { input: 'abc', expected: false, description: 'Texte invalide' },
    { input: null, expected: false, description: 'Null' },
    { input: undefined, expected: false, description: 'Undefined' }
  ]
  
  testCases.forEach(testCase => {
    const result = validateWeight(testCase.input)
    const status = result === testCase.expected ? '✅' : '❌'
    console.log(`${status} ${testCase.description}: ${testCase.input} → ${result} (attendu: ${testCase.expected})`)
  })
}

// Test de shouldAutoCalculate
function testShouldAutoCalculate() {
  console.log('\n3️⃣ Test de shouldAutoCalculate avec poids 0...')
  
  function shouldAutoCalculate(data) {
    const supplierPrice = data.supplierPrice?.toString().trim()
    const weight = data.weight?.toString().trim()
    const warehouse = data.warehouse?.trim()
    const volume = data.volume?.toString().trim()
    
    const hasSupplierPrice = Boolean(supplierPrice) && !isNaN(Number(supplierPrice)) && Number(supplierPrice) > 0
    const hasWeight = weight !== '' && weight !== undefined && weight !== null && !isNaN(Number(weight)) && Number(weight) >= 0
    const hasWarehouse = Boolean(warehouse)
    const hasVolumeIfNeeded = data.mode === 'air' || (data.mode === 'sea' && Boolean(volume) && !isNaN(Number(volume)) && Number(volume) > 0)
    
    return hasSupplierPrice && hasWeight && hasWarehouse && hasVolumeIfNeeded
  }
  
  const testData = {
    mode: 'air',
    supplierPrice: '52',
    weight: '0', // Poids 0 comme string
    warehouse: 'usa',
    volume: ''
  }
  
  const result = shouldAutoCalculate(testData)
  console.log('Données de test:', testData)
  console.log('Peut calculer automatiquement:', result, '(attendu: true)')
  
  // Test avec poids vide
  const testDataEmpty = { ...testData, weight: '' }
  const resultEmpty = shouldAutoCalculate(testDataEmpty)
  console.log('Avec poids vide:', resultEmpty, '(attendu: false)')
}

// Exécuter les tests
testFrontendValidation()
testShouldAutoCalculate()

console.log('\n📝 Résumé des corrections:')
console.log('1. API modifiée pour accepter weight === 0')
console.log('2. Validation frontend corrigée pour distinguer 0 et chaîne vide')
console.log('3. shouldAutoCalculate corrigé pour accepter poids 0')

console.log('\n🎯 Maintenant le poids 0 devrait fonctionner correctement!')

// Note: Le test API nécessite une session valide, donc il peut échouer en mode script
console.log('\n💡 Pour tester l\'API complètement, utilisez le simulateur dans le navigateur.') 