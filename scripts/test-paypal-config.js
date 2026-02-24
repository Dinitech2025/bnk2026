const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSTIC CONFIGURATION PAYPAL');
console.log('==================================');

// Lire les fichiers d'environnement
const envPath = path.resolve(__dirname, '../.env');
const envLocalPath = path.resolve(__dirname, '../.env.local');

console.log('\n📁 FICHIERS D\'ENVIRONNEMENT:');
console.log(`   • .env: ${fs.existsSync(envPath) ? '✅ Existe' : '❌ Manquant'}`);
console.log(`   • .env.local: ${fs.existsSync(envLocalPath) ? '✅ Existe' : '❌ Manquant'}`);

// Lire manuellement les fichiers d'environnement
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      env[key] = value;
    }
  });
  
  return env;
}

const envVars = { ...loadEnvFile(envPath), ...loadEnvFile(envLocalPath) };

console.log('\n🔑 VARIABLES PAYPAL:');
console.log(`   • PAYPAL_CLIENT_ID: ${envVars.PAYPAL_CLIENT_ID ? '✅ Définie' : '❌ Manquante'}`);
console.log(`   • PAYPAL_CLIENT_SECRET: ${envVars.PAYPAL_CLIENT_SECRET ? '✅ Définie' : '❌ Manquante'}`);
console.log(`   • NEXT_PUBLIC_PAYPAL_CLIENT_ID: ${envVars.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? '✅ Définie' : '❌ Manquante'}`);
console.log(`   • PAYPAL_MODE: ${envVars.PAYPAL_MODE || 'Non définie'}`);
console.log(`   • PAYPAL_ENVIRONMENT: ${envVars.PAYPAL_ENVIRONMENT || 'Non définie'}`);

// Tester la connexion PayPal
async function testPayPalConnection() {
  const PAYPAL_CLIENT_ID = envVars.PAYPAL_CLIENT_ID;
  const PAYPAL_CLIENT_SECRET = envVars.PAYPAL_CLIENT_SECRET;
  const PAYPAL_BASE_URL = 'https://api-m.sandbox.paypal.com';

  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    console.log('\n❌ IMPOSSIBLE DE TESTER: Clés PayPal manquantes');
    return;
  }

  console.log('\n🧪 TEST DE CONNEXION PAYPAL:');
  
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();

    if (response.ok && data.access_token) {
      console.log('   ✅ Connexion PayPal réussie');
      console.log(`   🔑 Token obtenu: ${data.access_token.substring(0, 20)}...`);
      console.log(`   ⏱️  Expire dans: ${data.expires_in} secondes`);
    } else {
      console.log('   ❌ Échec de connexion PayPal');
      console.log(`   📝 Erreur: ${data.error_description || data.error || 'Erreur inconnue'}`);
    }
  } catch (error) {
    console.log('   ❌ Erreur de connexion');
    console.log(`   📝 Détail: ${error.message}`);
  }
}

// Recommandations
function showRecommendations() {
  console.log('\n💡 RECOMMANDATIONS:');
  
  if (!envVars.PAYPAL_CLIENT_ID || !envVars.PAYPAL_CLIENT_SECRET) {
    console.log('   1. Créez un compte développeur PayPal sur https://developer.paypal.com');
    console.log('   2. Créez une application sandbox');
    console.log('   3. Copiez les clés Client ID et Client Secret');
    console.log('   4. Mettez à jour le fichier .env.local');
  }
  
  console.log('   5. Redémarrez le serveur après modification des variables');
  console.log('   6. Vérifiez que les URLs de retour sont correctes');
}

// Exécuter les tests
testPayPalConnection().then(() => {
  showRecommendations();
});
