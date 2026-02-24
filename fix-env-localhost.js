const fs = require('fs');

console.log('🔧 Correction de l\'URL pour utiliser localhost (tunnel SSH)...\n');

// Lire .env
let envContent = fs.readFileSync('.env', 'utf8');

// Remplacer l'IP par localhost:5433
envContent = envContent.replace(
  /DATABASE_URL="postgresql:\/\/admin:Admin2024PJB@180\.149\.199\.175:5432\/dinitech-base\?schema=public"/,
  'DATABASE_URL="postgresql://admin:Admin2024PJB@localhost:5433/dinitech-base?schema=public"'
);

// Écrire .env
fs.writeFileSync('.env', envContent);
console.log('✅ .env corrigé');

// Faire pareil pour .env.local si existe
if (fs.existsSync('.env.local')) {
  let envLocalContent = fs.readFileSync('.env.local', 'utf8');
  envLocalContent = envLocalContent.replace(
    /DATABASE_URL="postgresql:\/\/admin:Admin2024PJB@180\.149\.199\.175:5432\/dinitech-base\?schema=public"/,
    'DATABASE_URL="postgresql://admin:Admin2024PJB@localhost:5433/dinitech-base?schema=public"'
  );
  fs.writeFileSync('.env.local', envLocalContent);
  console.log('✅ .env.local corrigé');
}

console.log('\n📋 Nouvelle URL:');
console.log('   postgresql://admin:Admin2024PJB@localhost:5433/dinitech-base?schema=public');
console.log('\n✅ Configuration terminée !');
console.log('\n🧪 Testez maintenant:');
console.log('   npx prisma db push');







