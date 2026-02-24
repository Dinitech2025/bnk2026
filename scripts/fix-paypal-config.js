const fs = require('fs');
const path = require('path');

console.log('🔧 CORRECTION CONFIGURATION PAYPAL');
console.log('==================================');

const envLocalPath = path.resolve(__dirname, '../.env.local');

// Configuration PayPal avec de vraies clés de sandbox
const paypalConfig = `# Configuration PayPal pour développement
PAYPAL_CLIENT_ID=AeuzxlYSLM6KdZ5Diepn0yHLyGkcdXERENMGbMJQMCv4niQ3kT2eOhaeOVLAhJDU8E5rNRXq0qF9ULux
PAYPAL_CLIENT_SECRET=EGsWRAZhV1-aVb1U7B13lel1k0p2-IVmEAkVt-vYHmXM18xxEltFUx1rErHHm0iNWcXq1S_FGIhq8Kko
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AeuzxlYSLM6KdZ5Diepn0yHLyGkcdXERENMGbMJQMCv4niQ3kT2eOhaeOVLAhJDU8E5rNRXq0qF9ULux
PAYPAL_ENVIRONMENT=sandbox
PAYPAL_MODE=sandbox

# Configuration NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production

# Configuration base
NEXT_PUBLIC_BASE_URL=http://localhost:3000
`;

try {
    // Sauvegarder l'ancien fichier
    if (fs.existsSync(envLocalPath)) {
        const backup = envLocalPath + '.backup.' + Date.now();
        fs.copyFileSync(envLocalPath, backup);
        console.log(`📋 Sauvegarde créée: ${path.basename(backup)}`);
    }
    
    // Écrire la nouvelle configuration
    fs.writeFileSync(envLocalPath, paypalConfig);
    
    console.log('✅ CONFIGURATION MISE À JOUR');
    console.log('============================');
    console.log(`📍 Fichier: ${envLocalPath}`);
    console.log('');
    console.log('🔑 NOUVELLES VARIABLES:');
    console.log('   • PAYPAL_CLIENT_ID (sandbox)');
    console.log('   • PAYPAL_CLIENT_SECRET (sandbox)');
    console.log('   • NEXT_PUBLIC_PAYPAL_CLIENT_ID (frontend)');
    console.log('   • PAYPAL_ENVIRONMENT=sandbox');
    console.log('   • PAYPAL_MODE=sandbox');
    console.log('');
    console.log('⚠️  IMPORTANT:');
    console.log('   • Redémarrez le serveur de développement');
    console.log('   • Ces clés sont pour le sandbox PayPal');
    console.log('   • Testez avec un compte PayPal sandbox');
    console.log('');
    console.log('🚀 PayPal est maintenant configuré correctement !');
    
} catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message);
}

