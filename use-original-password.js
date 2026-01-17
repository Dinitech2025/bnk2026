const fs = require('fs');

// Utiliser le mot de passe original du container
const originalPassword = 'dinyoili@PJB24';
// Encoder le @ pour l'URL
const encodedPassword = encodeURIComponent(originalPassword);
const newUrl = `postgresql://admin:${encodedPassword}@localhost:5433/dinitech-base?schema=public`;

console.log('🔧 Utilisation du mot de passe original du container...\n');

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

console.log('\n📋 Nouvelle URL (avec mot de passe original encodé):');
console.log(`   ${newUrl}`);
console.log('\n✅ Configuration terminée !');
console.log('\n🧪 Testez maintenant:');
console.log('   npx prisma db push');







