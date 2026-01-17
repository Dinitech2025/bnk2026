const fs = require('fs');

const newPassword = 'Admin2024PJB';
const newUrl = `postgresql://admin:${newPassword}@localhost:5433/dinitech-base?schema=public`;

console.log('🔧 Mise à jour du mot de passe...\n');

// Mettre à jour .env
if (fs.existsSync('.env')) {
  let envContent = fs.readFileSync('.env', 'utf8');
  envContent = envContent.replace(
    /DATABASE_URL="postgresql:\/\/admin:[^@]+@localhost:5433\/dinitech-base\?schema=public"/g,
    `DATABASE_URL="${newUrl}"`
  );
  fs.writeFileSync('.env', envContent);
  console.log('✅ .env mis à jour');
}

// Mettre à jour .env.local
if (fs.existsSync('.env.local')) {
  let envLocalContent = fs.readFileSync('.env.local', 'utf8');
  envLocalContent = envLocalContent.replace(
    /DATABASE_URL="postgresql:\/\/admin:[^@]+@localhost:5433\/dinitech-base\?schema=public"/g,
    `DATABASE_URL="${newUrl}"`
  );
  fs.writeFileSync('.env.local', envLocalContent);
  console.log('✅ .env.local mis à jour');
}

console.log('\n📋 Nouvelle URL:');
console.log(`   ${newUrl}`);
console.log('\n✅ Mot de passe simplifié !');
console.log('\n🧪 Testez maintenant:');
console.log('   npx prisma db push');







