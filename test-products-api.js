// Test script pour vérifier l'API des produits
const fetch = require('node-fetch');

async function testProductsAPI() {
  try {
    console.log('Testing products API...');
    
    const response = await fetch('http://localhost:3000/api/admin/products');
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Products count:', data.products?.length || 0);
    console.log('First product:', data.products?.[0]);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testProductsAPI(); 