console.log('🧪 Test de la suppression de la contrainte de poids...')
console.log('=' .repeat(60))

// Test de la validation frontend sans contrainte de poids
function testFrontendValidationNoConstraint() {
  console.log('\n1️⃣ Test de la validation frontend sans contrainte de poids...')
  
  // Simuler la nouvelle logique de validation
  function validateFormWithoutWeight(formData) {
    const supplierPrice = formData.supplierPrice?.trim()
    const warehouse = formData.warehouse?.trim()
    const volume = formData.volume?.trim()
    
    // Validation du prix
    if (!supplierPrice || isNaN(Number(supplierPrice)) || Number(supplierPrice) <= 0) {
      return { valid: false, error: 'Prix invalide' }
    }
    
    // Validation de l'entrepôt
    if (!warehouse) {
      return { valid: false, error: 'Entrepôt manquant' }
    }
    
    // Validation du volume pour transport maritime
    if (formData.mode === 'sea') {
      if (!volume || isNaN(Number(volume)) || Number(volume) <= 0) {
        return { valid: false, error: 'Volume requis pour maritime' }
      }
    }
    
    // Pas de validation du poids !
    return { valid: true, error: null }
  }
  
  const testCases = [
    { 
      data: { mode: 'air', supplierPrice: '52', weight: '', warehouse: 'usa', volume: '' },
      expected: true, 
      description: 'Poids vide' 
    },
    { 
      data: { mode: 'air', supplierPrice: '52', weight: '0', warehouse: 'usa', volume: '' },
      expected: true, 
      description: 'Poids 0' 
    },
    { 
      data: { mode: 'air', supplierPrice: '52', weight: 'abc', warehouse: 'usa', volume: '' },
      expected: true, 
      description: 'Poids texte invalide (ignoré)' 
    },
    { 
      data: { mode: 'air', supplierPrice: '52', weight: '-5', warehouse: 'usa', volume: '' },
      expected: true, 
      description: 'Poids négatif (ignoré)' 
    },
    { 
      data: { mode: 'air', supplierPrice: '', weight: '1', warehouse: 'usa', volume: '' },
      expected: false, 
      description: 'Prix manquant (doit échouer)' 
    },
    { 
      data: { mode: 'air', supplierPrice: '52', weight: '1', warehouse: '', volume: '' },
      expected: false, 
      description: 'Entrepôt manquant (doit échouer)' 
    }
  ]
  
  testCases.forEach(testCase => {
    const result = validateFormWithoutWeight(testCase.data)
    const status = result.valid === testCase.expected ? '✅' : '❌'
    console.log(`${status} ${testCase.description}: ${result.valid} (attendu: ${testCase.expected})`)
    if (!result.valid) {
      console.log(`    Erreur: ${result.error}`)
    }
  })
}

// Test de shouldAutoCalculate sans contrainte de poids
function testShouldAutoCalculateNoConstraint() {
  console.log('\n2️⃣ Test de shouldAutoCalculate sans contrainte de poids...')
  
  function shouldAutoCalculate(data) {
    const supplierPrice = data.supplierPrice?.toString().trim()
    const warehouse = data.warehouse?.trim()
    const volume = data.volume?.toString().trim()
    
    const hasSupplierPrice = Boolean(supplierPrice) && !isNaN(Number(supplierPrice)) && Number(supplierPrice) > 0
    const hasWeight = true // Poids toujours considéré comme valide
    const hasWarehouse = Boolean(warehouse)
    const hasVolumeIfNeeded = data.mode === 'air' || (data.mode === 'sea' && Boolean(volume) && !isNaN(Number(volume)) && Number(volume) > 0)
    
    return hasSupplierPrice && hasWeight && hasWarehouse && hasVolumeIfNeeded
  }
  
  const testCases = [
    {
      data: { mode: 'air', supplierPrice: '52', weight: '', warehouse: 'usa', volume: '' },
      expected: true,
      description: 'Poids vide - devrait calculer'
    },
    {
      data: { mode: 'air', supplierPrice: '52', weight: 'abc', warehouse: 'usa', volume: '' },
      expected: true,
      description: 'Poids invalide - devrait calculer quand même'
    },
    {
      data: { mode: 'air', supplierPrice: '', weight: '1', warehouse: 'usa', volume: '' },
      expected: false,
      description: 'Prix manquant - ne devrait pas calculer'
    }
  ]
  
  testCases.forEach(testCase => {
    const result = shouldAutoCalculate(testCase.data)
    const status = result === testCase.expected ? '✅' : '❌'
    console.log(`${status} ${testCase.description}: ${result} (attendu: ${testCase.expected})`)
  })
}

// Test de normalisation du poids côté API
function testWeightNormalization() {
  console.log('\n3️⃣ Test de normalisation du poids côté API...')
  
  function normalizeWeight(weight) {
    let normalizedWeight = 0
    if (weight !== undefined && weight !== null && String(weight) !== '' && !isNaN(Number(weight)) && Number(weight) >= 0) {
      normalizedWeight = Number(weight)
    }
    return normalizedWeight
  }
  
  const testCases = [
    { input: undefined, expected: 0, description: 'Undefined' },
    { input: null, expected: 0, description: 'Null' },
    { input: '', expected: 0, description: 'Chaîne vide' },
    { input: '0', expected: 0, description: 'Zéro string' },
    { input: 0, expected: 0, description: 'Zéro number' },
    { input: '5', expected: 5, description: 'Nombre valide string' },
    { input: 5, expected: 5, description: 'Nombre valide number' },
    { input: '-1', expected: 0, description: 'Nombre négatif' },
    { input: 'abc', expected: 0, description: 'Texte invalide' }
  ]
  
  testCases.forEach(testCase => {
    const result = normalizeWeight(testCase.input)
    const status = result === testCase.expected ? '✅' : '❌'
    console.log(`${status} ${testCase.description}: ${testCase.input} → ${result} (attendu: ${testCase.expected})`)
  })
}

// Exécuter les tests
testFrontendValidationNoConstraint()
testShouldAutoCalculateNoConstraint()
testWeightNormalization()

console.log('\n📝 Résumé des modifications:')
console.log('1. ❌ Validation du poids supprimée du formulaire frontend')
console.log('2. ✅ shouldAutoCalculate ne dépend plus du poids')
console.log('3. 🔄 API normalise automatiquement le poids (défaut: 0)')
console.log('4. 🎯 Le calcul peut se faire même sans poids spécifié')

console.log('\n🎉 Le simulateur accepte maintenant:')
console.log('- Poids vide (utilisera 0 par défaut)')
console.log('- Poids invalide (utilisera 0 par défaut)')
console.log('- Poids négatif (utilisera 0 par défaut)')
console.log('- Toute valeur de poids valide')

console.log('\n💡 Seuls le prix et l\'entrepôt sont maintenant requis pour le calcul!') 
console.log('=' .repeat(60))

// Test de la validation frontend sans contrainte de poids
function testFrontendValidationNoConstraint() {
  console.log('\n1️⃣ Test de la validation frontend sans contrainte de poids...')
  
  // Simuler la nouvelle logique de validation
  function validateFormWithoutWeight(formData) {
    const supplierPrice = formData.supplierPrice?.trim()
    const warehouse = formData.warehouse?.trim()
    const volume = formData.volume?.trim()
    
    // Validation du prix
    if (!supplierPrice || isNaN(Number(supplierPrice)) || Number(supplierPrice) <= 0) {
      return { valid: false, error: 'Prix invalide' }
    }
    
    // Validation de l'entrepôt
    if (!warehouse) {
      return { valid: false, error: 'Entrepôt manquant' }
    }
    
    // Validation du volume pour transport maritime
    if (formData.mode === 'sea') {
      if (!volume || isNaN(Number(volume)) || Number(volume) <= 0) {
        return { valid: false, error: 'Volume requis pour maritime' }
      }
    }
    
    // Pas de validation du poids !
    return { valid: true, error: null }
  }
  
  const testCases = [
    { 
      data: { mode: 'air', supplierPrice: '52', weight: '', warehouse: 'usa', volume: '' },
      expected: true, 
      description: 'Poids vide' 
    },
    { 
      data: { mode: 'air', supplierPrice: '52', weight: '0', warehouse: 'usa', volume: '' },
      expected: true, 
      description: 'Poids 0' 
    },
    { 
      data: { mode: 'air', supplierPrice: '52', weight: 'abc', warehouse: 'usa', volume: '' },
      expected: true, 
      description: 'Poids texte invalide (ignoré)' 
    },
    { 
      data: { mode: 'air', supplierPrice: '52', weight: '-5', warehouse: 'usa', volume: '' },
      expected: true, 
      description: 'Poids négatif (ignoré)' 
    },
    { 
      data: { mode: 'air', supplierPrice: '', weight: '1', warehouse: 'usa', volume: '' },
      expected: false, 
      description: 'Prix manquant (doit échouer)' 
    },
    { 
      data: { mode: 'air', supplierPrice: '52', weight: '1', warehouse: '', volume: '' },
      expected: false, 
      description: 'Entrepôt manquant (doit échouer)' 
    }
  ]
  
  testCases.forEach(testCase => {
    const result = validateFormWithoutWeight(testCase.data)
    const status = result.valid === testCase.expected ? '✅' : '❌'
    console.log(`${status} ${testCase.description}: ${result.valid} (attendu: ${testCase.expected})`)
    if (!result.valid) {
      console.log(`    Erreur: ${result.error}`)
    }
  })
}

// Test de shouldAutoCalculate sans contrainte de poids
function testShouldAutoCalculateNoConstraint() {
  console.log('\n2️⃣ Test de shouldAutoCalculate sans contrainte de poids...')
  
  function shouldAutoCalculate(data) {
    const supplierPrice = data.supplierPrice?.toString().trim()
    const warehouse = data.warehouse?.trim()
    const volume = data.volume?.toString().trim()
    
    const hasSupplierPrice = Boolean(supplierPrice) && !isNaN(Number(supplierPrice)) && Number(supplierPrice) > 0
    const hasWeight = true // Poids toujours considéré comme valide
    const hasWarehouse = Boolean(warehouse)
    const hasVolumeIfNeeded = data.mode === 'air' || (data.mode === 'sea' && Boolean(volume) && !isNaN(Number(volume)) && Number(volume) > 0)
    
    return hasSupplierPrice && hasWeight && hasWarehouse && hasVolumeIfNeeded
  }
  
  const testCases = [
    {
      data: { mode: 'air', supplierPrice: '52', weight: '', warehouse: 'usa', volume: '' },
      expected: true,
      description: 'Poids vide - devrait calculer'
    },
    {
      data: { mode: 'air', supplierPrice: '52', weight: 'abc', warehouse: 'usa', volume: '' },
      expected: true,
      description: 'Poids invalide - devrait calculer quand même'
    },
    {
      data: { mode: 'air', supplierPrice: '', weight: '1', warehouse: 'usa', volume: '' },
      expected: false,
      description: 'Prix manquant - ne devrait pas calculer'
    }
  ]
  
  testCases.forEach(testCase => {
    const result = shouldAutoCalculate(testCase.data)
    const status = result === testCase.expected ? '✅' : '❌'
    console.log(`${status} ${testCase.description}: ${result} (attendu: ${testCase.expected})`)
  })
}

// Test de normalisation du poids côté API
function testWeightNormalization() {
  console.log('\n3️⃣ Test de normalisation du poids côté API...')
  
  function normalizeWeight(weight) {
    let normalizedWeight = 0
    if (weight !== undefined && weight !== null && String(weight) !== '' && !isNaN(Number(weight)) && Number(weight) >= 0) {
      normalizedWeight = Number(weight)
    }
    return normalizedWeight
  }
  
  const testCases = [
    { input: undefined, expected: 0, description: 'Undefined' },
    { input: null, expected: 0, description: 'Null' },
    { input: '', expected: 0, description: 'Chaîne vide' },
    { input: '0', expected: 0, description: 'Zéro string' },
    { input: 0, expected: 0, description: 'Zéro number' },
    { input: '5', expected: 5, description: 'Nombre valide string' },
    { input: 5, expected: 5, description: 'Nombre valide number' },
    { input: '-1', expected: 0, description: 'Nombre négatif' },
    { input: 'abc', expected: 0, description: 'Texte invalide' }
  ]
  
  testCases.forEach(testCase => {
    const result = normalizeWeight(testCase.input)
    const status = result === testCase.expected ? '✅' : '❌'
    console.log(`${status} ${testCase.description}: ${testCase.input} → ${result} (attendu: ${testCase.expected})`)
  })
}

// Exécuter les tests
testFrontendValidationNoConstraint()
testShouldAutoCalculateNoConstraint()
testWeightNormalization()

console.log('\n📝 Résumé des modifications:')
console.log('1. ❌ Validation du poids supprimée du formulaire frontend')
console.log('2. ✅ shouldAutoCalculate ne dépend plus du poids')
console.log('3. 🔄 API normalise automatiquement le poids (défaut: 0)')
console.log('4. 🎯 Le calcul peut se faire même sans poids spécifié')

console.log('\n🎉 Le simulateur accepte maintenant:')
console.log('- Poids vide (utilisera 0 par défaut)')
console.log('- Poids invalide (utilisera 0 par défaut)')
console.log('- Poids négatif (utilisera 0 par défaut)')
console.log('- Toute valeur de poids valide')

console.log('\n💡 Seuls le prix et l\'entrepôt sont maintenant requis pour le calcul!') 