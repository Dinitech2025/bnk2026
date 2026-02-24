// Test script pour vérifier le frontend
const puppeteer = require('puppeteer');

async function testFrontend() {
  let browser;
  try {
    console.log('Lancement du navigateur...');
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Écouter les logs de la console
    page.on('console', msg => {
      console.log('CONSOLE:', msg.text());
    });
    
    // Écouter les erreurs
    page.on('pageerror', error => {
      console.error('PAGE ERROR:', error.message);
    });
    
    // Écouter les requêtes réseau
    page.on('response', response => {
      if (response.url().includes('/api/admin/products')) {
        console.log('API RESPONSE:', response.status(), response.url());
      }
    });
    
    console.log('Navigation vers la page des produits...');
    await page.goto('http://localhost:3000/admin/products', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Attendre que la page se charge
    await page.waitForTimeout(5000);
    
    // Vérifier si les produits sont affichés
    const productCount = await page.evaluate(() => {
      const products = document.querySelectorAll('[data-testid="product-card"], tr[data-product-id]');
      return products.length;
    });
    
    console.log('Nombre de produits affichés:', productCount);
    
    // Prendre une capture d'écran
    await page.screenshot({ path: 'products-page.png', fullPage: true });
    console.log('Capture d\'écran sauvegardée: products-page.png');
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testFrontend(); 