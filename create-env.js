const fs = require('fs');

const envContent = `# Base de données VPS PostgreSQL
DATABASE_URL="postgresql://admin:dinyoili@PJB24@180.149.199.175:5432/dinitech-base?schema=public&connect_timeout=30"

# NextAuth
NEXTAUTH_SECRET="secret_nextauth_aleatoire_pour_boutiknaka_123456789"
NEXTAUTH_URL="http://localhost:3000"

# Variables d'environnement
NODE_ENV="development"
`;

fs.writeFileSync('.env.local', envContent);
console.log('✅ Fichier .env.local créé avec succès !');
console.log('\n📋 Configuration:');
console.log('   - Utilisateur: admin');
console.log('   - Mot de passe: dinyoili@PJB24');
console.log('   - Base: dinitech-base');
console.log('   - Host: 180.149.199.175:5432');







