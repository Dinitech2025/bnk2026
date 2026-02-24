#!/usr/bin/env node

/**
 * Script pour configurer automatiquement la connexion à la base de données VPS
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🚀 Configuration de la base de données VPS PostgreSQL\n');

  // Informations VPS
  const VPS_IP = '180.149.199.175';
  const VPS_USER = 'root';
  const DB_NAME = 'dinitech-base';

  console.log('📋 Informations VPS:');
  console.log(`   IP: ${VPS_IP}`);
  console.log(`   User: ${VPS_USER}`);
  console.log(`   Database: ${DB_NAME}\n`);

  // Demander le mot de passe PostgreSQL
  const pgPassword = await question('🔑 Entrez le mot de passe PostgreSQL (ou appuyez sur Entrée pour "postgres"): ');
  const finalPgPassword = pgPassword.trim() || 'postgres';

  // Demander le port PostgreSQL
  const pgPort = await question('🔌 Entrez le port PostgreSQL (ou appuyez sur Entrée pour "5432"): ');
  const finalPgPort = pgPort.trim() || '5432';

  // Demander l'utilisateur PostgreSQL
  const pgUser = await question('👤 Entrez l\'utilisateur PostgreSQL (ou appuyez sur Entrée pour "postgres"): ');
  const finalPgUser = pgUser.trim() || 'postgres';

  // Construire l'URL de connexion
  const DATABASE_URL = `postgresql://${finalPgUser}:${finalPgPassword}@${VPS_IP}:${finalPgPort}/${DB_NAME}?schema=public`;

  console.log('\n📝 URL de connexion générée:');
  console.log(`   ${DATABASE_URL.replace(finalPgPassword, '****')}\n`);

  // Créer le fichier .env.local
  const envLocalPath = path.join(process.cwd(), '.env.local');
  let envContent = '';

  if (fs.existsSync(envLocalPath)) {
    console.log('⚠️  Le fichier .env.local existe déjà');
    const overwrite = await question('   Voulez-vous le remplacer ? (o/N): ');
    if (overwrite.toLowerCase() !== 'o') {
      console.log('❌ Opération annulée');
      rl.close();
      return;
    }
    envContent = fs.readFileSync(envLocalPath, 'utf-8');
  }

  // Remplacer ou ajouter DATABASE_URL
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${DATABASE_URL}"`);
  } else {
    envContent += `\n# Base de données VPS PostgreSQL\nDATABASE_URL="${DATABASE_URL}"\n`;
  }

  // Ajouter NEXTAUTH_SECRET si absent
  if (!envContent.includes('NEXTAUTH_SECRET=')) {
    const randomSecret = require('crypto').randomBytes(32).toString('base64');
    envContent += `\n# NextAuth\nNEXTAUTH_SECRET="${randomSecret}"\n`;
  }

  // Ajouter NEXTAUTH_URL si absent
  if (!envContent.includes('NEXTAUTH_URL=')) {
    envContent += `NEXTAUTH_URL="http://localhost:3000"\n`;
  }

  // Écrire le fichier
  fs.writeFileSync(envLocalPath, envContent);
  console.log('✅ Fichier .env.local créé avec succès\n');

  // Tester la connexion
  console.log('🔍 Test de la connexion à la base de données...');
  try {
    execSync('npx prisma db execute --stdin < /dev/null', { 
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL }
    });
    console.log('✅ Connexion réussie!\n');
  } catch (error) {
    console.log('⚠️  Impossible de tester la connexion');
    console.log('   Vérifiez que PostgreSQL est accessible depuis votre machine\n');
  }

  // Proposer de pousser le schéma
  const pushSchema = await question('📤 Voulez-vous pousser le schéma Prisma vers la base de données ? (o/N): ');
  if (pushSchema.toLowerCase() === 'o') {
    console.log('\n🔄 Génération du client Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    console.log('\n📤 Push du schéma vers la base de données...');
    try {
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log('\n✅ Schéma poussé avec succès!');
    } catch (error) {
      console.log('\n❌ Erreur lors du push du schéma');
      console.log('   Vérifiez les logs ci-dessus pour plus de détails');
    }
  }

  console.log('\n🎉 Configuration terminée!');
  console.log('\n📋 Prochaines étapes:');
  console.log('   1. Vérifiez que PostgreSQL est accessible depuis votre machine');
  console.log('   2. Exécutez: npm run dev');
  console.log('   3. Testez votre application\n');

  rl.close();
}

main().catch(error => {
  console.error('❌ Erreur:', error.message);
  rl.close();
  process.exit(1);
});







