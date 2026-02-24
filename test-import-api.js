// Script de test pour l'API de calcul d'importation
console.log('=== Test de l\'API de calcul d\'importation ===');

// Test transport aérien
const testAirImport = {
  mode: 'air',
  productName: 'iPhone 15 Pro Max',
  productUrl: 'https://example.com/iphone',
  supplierPrice: 1200,
  supplierCurrency: 'USD',
  weight: 0.5,
  warehouse: 'usa'
};

// Test transport maritime
const testSeaImport = {
  mode: 'sea',
  productName: 'Ordinateur portable Dell',
  productUrl: 'https://example.com/dell-laptop',
  supplierPrice: 800,
  supplierCurrency: 'EUR',
  weight: 2.5,
  warehouse: 'france',
  volume: 0.02
};

async function testAPI() {
  console.log('\n1. Test transport aérien (USA):');
  try {
    const response = await fetch('http://localhost:3001/api/admin/products/imported/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(testAirImport)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Succès!');
      console.log('Produit:', result.productInfo.name);
      console.log('Mode:', result.productInfo.mode);
      console.log('Entrepôt:', result.productInfo.warehouse);
      console.log('Coût total:', result.pricing.totalCost.toLocaleString('fr-FR'), 'Ar');
      console.log('Prix suggéré:', result.pricing.suggestedSellingPrice.toLocaleString('fr-FR'), 'Ar');
      console.log('Délai:', result.transitTime);
    } else {
      const error = await response.json();
      console.log('❌ Erreur:', error.error);
    }
  } catch (error) {
    console.log('❌ Erreur réseau:', error.message);
  }

  console.log('\n2. Test transport maritime (France):');
  try {
    const response = await fetch('http://localhost:3001/api/admin/products/imported/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(testSeaImport)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Succès!');
      console.log('Produit:', result.productInfo.name);
      console.log('Mode:', result.productInfo.mode);
      console.log('Entrepôt:', result.productInfo.warehouse);
      console.log('Poids:', result.productInfo.weight, 'kg');
      console.log('Volume:', result.productInfo.volume, 'm³');
      console.log('Coût total:', result.pricing.totalCost.toLocaleString('fr-FR'), 'Ar');
      console.log('Prix suggéré:', result.pricing.suggestedSellingPrice.toLocaleString('fr-FR'), 'Ar');
      console.log('Délai:', result.transitTime);
    } else {
      const error = await response.json();
      console.log('❌ Erreur:', error.error);
    }
  } catch (error) {
    console.log('❌ Erreur réseau:', error.message);
  }

  console.log('\n3. Test avec données manquantes:');
  try {
    const response = await fetch('http://localhost:3001/api/admin/products/imported/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        mode: 'sea',
        productName: 'Test',
        supplierPrice: 100,
        supplierCurrency: 'USD',
        weight: 1
        // volume manquant pour maritime
      })
    });

    const result = await response.json();
    if (response.ok) {
      console.log('✅ Succès inattendu');
    } else {
      console.log('✅ Erreur attendue:', result.error);
    }
  } catch (error) {
    console.log('❌ Erreur réseau:', error.message);
  }
}

// Exécuter les tests
testAPI(); 
 
 
console.log('=== Test de l\'API de calcul d\'importation ===');

// Test transport aérien
const testAirImport = {
  mode: 'air',
  productName: 'iPhone 15 Pro Max',
  productUrl: 'https://example.com/iphone',
  supplierPrice: 1200,
  supplierCurrency: 'USD',
  weight: 0.5,
  warehouse: 'usa'
};

// Test transport maritime
const testSeaImport = {
  mode: 'sea',
  productName: 'Ordinateur portable Dell',
  productUrl: 'https://example.com/dell-laptop',
  supplierPrice: 800,
  supplierCurrency: 'EUR',
  weight: 2.5,
  warehouse: 'france',
  volume: 0.02
};

async function testAPI() {
  console.log('\n1. Test transport aérien (USA):');
  try {
    const response = await fetch('http://localhost:3001/api/admin/products/imported/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(testAirImport)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Succès!');
      console.log('Produit:', result.productInfo.name);
      console.log('Mode:', result.productInfo.mode);
      console.log('Entrepôt:', result.productInfo.warehouse);
      console.log('Coût total:', result.pricing.totalCost.toLocaleString('fr-FR'), 'Ar');
      console.log('Prix suggéré:', result.pricing.suggestedSellingPrice.toLocaleString('fr-FR'), 'Ar');
      console.log('Délai:', result.transitTime);
    } else {
      const error = await response.json();
      console.log('❌ Erreur:', error.error);
    }
  } catch (error) {
    console.log('❌ Erreur réseau:', error.message);
  }

  console.log('\n2. Test transport maritime (France):');
  try {
    const response = await fetch('http://localhost:3001/api/admin/products/imported/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(testSeaImport)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Succès!');
      console.log('Produit:', result.productInfo.name);
      console.log('Mode:', result.productInfo.mode);
      console.log('Entrepôt:', result.productInfo.warehouse);
      console.log('Poids:', result.productInfo.weight, 'kg');
      console.log('Volume:', result.productInfo.volume, 'm³');
      console.log('Coût total:', result.pricing.totalCost.toLocaleString('fr-FR'), 'Ar');
      console.log('Prix suggéré:', result.pricing.suggestedSellingPrice.toLocaleString('fr-FR'), 'Ar');
      console.log('Délai:', result.transitTime);
    } else {
      const error = await response.json();
      console.log('❌ Erreur:', error.error);
    }
  } catch (error) {
    console.log('❌ Erreur réseau:', error.message);
  }

  console.log('\n3. Test avec données manquantes:');
  try {
    const response = await fetch('http://localhost:3001/api/admin/products/imported/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        mode: 'sea',
        productName: 'Test',
        supplierPrice: 100,
        supplierCurrency: 'USD',
        weight: 1
        // volume manquant pour maritime
      })
    });

    const result = await response.json();
    if (response.ok) {
      console.log('✅ Succès inattendu');
    } else {
      console.log('✅ Erreur attendue:', result.error);
    }
  } catch (error) {
    console.log('❌ Erreur réseau:', error.message);
  }
}

// Exécuter les tests
testAPI(); 
 
 