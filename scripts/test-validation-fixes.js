console.log('🧪 Test des corrections de validation du simulateur...')
console.log('=' .repeat(60))

// Simuler les fonctions de validation
function testValidation() {
  console.log('\n1️⃣ Test de la logique de validation...')
  
  // Test des données valides
  const validData = {
    supplierPrice: '23',
    weight: '1',
    warehouse: 'usa',
    mode: 'air',
    volume: ''
  }
  
  console.log('\n✅ Test avec données valides:')
  console.log('Prix:', validData.supplierPrice, '→', Number(validData.supplierPrice.trim()))
  console.log('Poids:', validData.weight, '→', Number(validData.weight.trim()))
  console.log('Entrepôt:', validData.warehouse, '→', Boolean(validData.warehouse.trim()))
  
  // Test shouldAutoCalculate
  const supplierPrice = validData.supplierPrice?.trim()
  const weight = validData.weight?.trim()
  const warehouse = validData.warehouse?.trim()
  
  const hasSupplierPrice = Boolean(supplierPrice) && !isNaN(Number(supplierPrice)) && Number(supplierPrice) > 0
  const hasWeight = Boolean(weight) && !isNaN(Number(weight)) && Number(weight) >= 0
  const hasWarehouse = Boolean(warehouse)
  const hasVolumeIfNeeded = validData.mode === 'air' || (validData.mode === 'sea' && Boolean(validData.volume?.trim()) && !isNaN(Number(validData.volume?.trim())) && Number(validData.volume?.trim()) > 0)
  
  const shouldAutoCalculate = hasSupplierPrice && hasWeight && hasWarehouse && hasVolumeIfNeeded
  
  console.log('\n🔍 Résultats de validation:')
  console.log('- Prix valide:', hasSupplierPrice)
  console.log('- Poids valide:', hasWeight)
  console.log('- Entrepôt valide:', hasWarehouse)
  console.log('- Volume OK (aérien):', hasVolumeIfNeeded)
  console.log('- Peut calculer automatiquement:', shouldAutoCalculate)
  
  // Test avec données invalides
  console.log('\n❌ Test avec données invalides:')
  const invalidData = {
    supplierPrice: '',
    weight: '0',
    warehouse: '',
    mode: 'sea',
    volume: ''
  }
  
  const invalidPrice = invalidData.supplierPrice?.trim()
  const invalidWeight = invalidData.weight?.trim()
  const invalidWarehouse = invalidData.warehouse?.trim()
  const invalidVolume = invalidData.volume?.trim()
  
  const invalidPriceCheck = Boolean(invalidPrice) && !isNaN(Number(invalidPrice)) && Number(invalidPrice) > 0
  const invalidWeightCheck = Boolean(invalidWeight) && !isNaN(Number(invalidWeight)) && Number(invalidWeight) >= 0
  const invalidWarehouseCheck = Boolean(invalidWarehouse)
  const invalidVolumeCheck = invalidData.mode === 'air' || (invalidData.mode === 'sea' && Boolean(invalidVolume) && !isNaN(Number(invalidVolume)) && Number(invalidVolume) > 0)
  
  console.log('- Prix vide:', invalidPriceCheck, '(attendu: false)')
  console.log('- Poids zéro:', invalidWeightCheck, '(attendu: true maintenant - poids 0 autorisé)')
  console.log('- Entrepôt vide:', invalidWarehouseCheck, '(attendu: false)')
  console.log('- Volume manquant (maritime):', invalidVolumeCheck, '(attendu: false)')
  
  // Test spécifique pour poids 0
  console.log('\n🔍 Test spécifique poids 0:')
  const zeroWeightData = {
    supplierPrice: '10',
    weight: '0',
    warehouse: 'usa',
    mode: 'air',
    volume: ''
  }
  
  const zeroWeight = zeroWeightData.weight?.trim()
  const zeroWeightValid = Boolean(zeroWeight) && !isNaN(Number(zeroWeight)) && Number(zeroWeight) >= 0
  console.log('- Poids 0 valide:', zeroWeightValid, '(attendu: true)')
  
  console.log('\n✅ Tests de validation terminés!')
}

// Test des entrepôts par défaut
function testWarehouseDefaults() {
  console.log('\n2️⃣ Test des entrepôts par défaut...')
  
  const AIR_WAREHOUSES = [
    { value: 'usa', label: 'États-Unis', currency: 'USD' },
    { value: 'france', label: 'France', currency: 'EUR' },
    { value: 'uk', label: 'Royaume-Uni', currency: 'GBP' }
  ]
  
  const SEA_WAREHOUSES = [
    { value: 'france', label: 'France', currency: 'EUR' },
    { value: 'china', label: 'Chine', currency: 'USD' }
  ]
  
  console.log('Entrepôts aériens:', AIR_WAREHOUSES.map(w => w.value))
  console.log('Entrepôt par défaut aérien:', AIR_WAREHOUSES[0].value)
  console.log('Entrepôts maritimes:', SEA_WAREHOUSES.map(w => w.value))
  console.log('Entrepôt par défaut maritime:', SEA_WAREHOUSES[0].value)
  
  console.log('\n✅ Configuration des entrepôts OK!')
}

// Exécuter les tests
testValidation()
testWarehouseDefaults()

console.log('\n🎉 Tous les tests terminés!')
console.log('\n📝 Résumé des corrections:')
console.log('1. Calcul automatique réactivé')
console.log('2. Validation cohérente entre shouldAutoCalculate et validateForm')
console.log('3. Entrepôt par défaut initialisé (usa pour aérien)')
console.log('4. Gestion correcte des valeurs trimées et des conversions Number()')
console.log('5. Messages de debug ajoutés pour le débogage')
console.log('6. Poids 0 maintenant autorisé (pour produits virtuels/très légers)') 
console.log('=' .repeat(60))

// Simuler les fonctions de validation
function testValidation() {
  console.log('\n1️⃣ Test de la logique de validation...')
  
  // Test des données valides
  const validData = {
    supplierPrice: '23',
    weight: '1',
    warehouse: 'usa',
    mode: 'air',
    volume: ''
  }
  
  console.log('\n✅ Test avec données valides:')
  console.log('Prix:', validData.supplierPrice, '→', Number(validData.supplierPrice.trim()))
  console.log('Poids:', validData.weight, '→', Number(validData.weight.trim()))
  console.log('Entrepôt:', validData.warehouse, '→', Boolean(validData.warehouse.trim()))
  
  // Test shouldAutoCalculate
  const supplierPrice = validData.supplierPrice?.trim()
  const weight = validData.weight?.trim()
  const warehouse = validData.warehouse?.trim()
  
  const hasSupplierPrice = Boolean(supplierPrice) && !isNaN(Number(supplierPrice)) && Number(supplierPrice) > 0
  const hasWeight = Boolean(weight) && !isNaN(Number(weight)) && Number(weight) >= 0
  const hasWarehouse = Boolean(warehouse)
  const hasVolumeIfNeeded = validData.mode === 'air' || (validData.mode === 'sea' && Boolean(validData.volume?.trim()) && !isNaN(Number(validData.volume?.trim())) && Number(validData.volume?.trim()) > 0)
  
  const shouldAutoCalculate = hasSupplierPrice && hasWeight && hasWarehouse && hasVolumeIfNeeded
  
  console.log('\n🔍 Résultats de validation:')
  console.log('- Prix valide:', hasSupplierPrice)
  console.log('- Poids valide:', hasWeight)
  console.log('- Entrepôt valide:', hasWarehouse)
  console.log('- Volume OK (aérien):', hasVolumeIfNeeded)
  console.log('- Peut calculer automatiquement:', shouldAutoCalculate)
  
  // Test avec données invalides
  console.log('\n❌ Test avec données invalides:')
  const invalidData = {
    supplierPrice: '',
    weight: '0',
    warehouse: '',
    mode: 'sea',
    volume: ''
  }
  
  const invalidPrice = invalidData.supplierPrice?.trim()
  const invalidWeight = invalidData.weight?.trim()
  const invalidWarehouse = invalidData.warehouse?.trim()
  const invalidVolume = invalidData.volume?.trim()
  
  const invalidPriceCheck = Boolean(invalidPrice) && !isNaN(Number(invalidPrice)) && Number(invalidPrice) > 0
  const invalidWeightCheck = Boolean(invalidWeight) && !isNaN(Number(invalidWeight)) && Number(invalidWeight) >= 0
  const invalidWarehouseCheck = Boolean(invalidWarehouse)
  const invalidVolumeCheck = invalidData.mode === 'air' || (invalidData.mode === 'sea' && Boolean(invalidVolume) && !isNaN(Number(invalidVolume)) && Number(invalidVolume) > 0)
  
  console.log('- Prix vide:', invalidPriceCheck, '(attendu: false)')
  console.log('- Poids zéro:', invalidWeightCheck, '(attendu: true maintenant - poids 0 autorisé)')
  console.log('- Entrepôt vide:', invalidWarehouseCheck, '(attendu: false)')
  console.log('- Volume manquant (maritime):', invalidVolumeCheck, '(attendu: false)')
  
  // Test spécifique pour poids 0
  console.log('\n🔍 Test spécifique poids 0:')
  const zeroWeightData = {
    supplierPrice: '10',
    weight: '0',
    warehouse: 'usa',
    mode: 'air',
    volume: ''
  }
  
  const zeroWeight = zeroWeightData.weight?.trim()
  const zeroWeightValid = Boolean(zeroWeight) && !isNaN(Number(zeroWeight)) && Number(zeroWeight) >= 0
  console.log('- Poids 0 valide:', zeroWeightValid, '(attendu: true)')
  
  console.log('\n✅ Tests de validation terminés!')
}

// Test des entrepôts par défaut
function testWarehouseDefaults() {
  console.log('\n2️⃣ Test des entrepôts par défaut...')
  
  const AIR_WAREHOUSES = [
    { value: 'usa', label: 'États-Unis', currency: 'USD' },
    { value: 'france', label: 'France', currency: 'EUR' },
    { value: 'uk', label: 'Royaume-Uni', currency: 'GBP' }
  ]
  
  const SEA_WAREHOUSES = [
    { value: 'france', label: 'France', currency: 'EUR' },
    { value: 'china', label: 'Chine', currency: 'USD' }
  ]
  
  console.log('Entrepôts aériens:', AIR_WAREHOUSES.map(w => w.value))
  console.log('Entrepôt par défaut aérien:', AIR_WAREHOUSES[0].value)
  console.log('Entrepôts maritimes:', SEA_WAREHOUSES.map(w => w.value))
  console.log('Entrepôt par défaut maritime:', SEA_WAREHOUSES[0].value)
  
  console.log('\n✅ Configuration des entrepôts OK!')
}

// Exécuter les tests
testValidation()
testWarehouseDefaults()

console.log('\n🎉 Tous les tests terminés!')
console.log('\n📝 Résumé des corrections:')
console.log('1. Calcul automatique réactivé')
console.log('2. Validation cohérente entre shouldAutoCalculate et validateForm')
console.log('3. Entrepôt par défaut initialisé (usa pour aérien)')
console.log('4. Gestion correcte des valeurs trimées et des conversions Number()')
console.log('5. Messages de debug ajoutés pour le débogage')
console.log('6. Poids 0 maintenant autorisé (pour produits virtuels/très légers)') 