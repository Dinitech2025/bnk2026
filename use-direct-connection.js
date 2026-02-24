const fs = require('fs');

const vpsIp = '180.149.199.175';
const newUrl = `postgresql://admin:Admin2024PJB@${vpsIp}:5432/dinitech-base?schema=public`;

console.log('🔧 Configuration de la connexion directe au VPS...\n');

// Mettre à jour .env
if (fs.existsSync('.env')) {
  let envContent = fs.readFileSync('.env', 'utf8');
  envContent = envContent.replace(
    /DATABASE_URL="postgresql:\/\/[^"]+"/g,
    `DATABASE_URL="${newUrl}"`
  );
  fs.writeFileSync('.env', envContent);
  console.log('✅ .env mis à jour');
}

// Mettre à jour .env.local
if (fs.existsSync('.env.local')) {
  let envLocalContent = fs.readFileSync('.env.local', 'utf8');
  envLocalContent = envLocalContent.replace(
    /DATABASE_URL="postgresql:\/\/[^"]+"/g,
    `DATABASE_URL="${newUrl}"`
  );
  fs.writeFileSync('.env.local', envLocalContent);
  console.log('✅ .env.local mis à jour');
}

console.log('\n📋 Nouvelle URL (connexion directe):');
console.log(`   ${newUrl}`);
console.log('\n✅ Configuration terminée !');
console.log('\n🧪 Testez maintenant:');
console.log('   npx prisma db push');







