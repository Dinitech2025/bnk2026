import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

// Lire les arguments de la ligne de commande
const sqlFile = process.argv[2]
const newDatabaseUrl = process.argv[3]

if (!sqlFile || !newDatabaseUrl) {
  console.error('❌ Usage: npx tsx scripts/import-database.ts <fichier.sql> <DATABASE_URL>')
  console.error('\n   Exemple:')
  console.error('   npx tsx scripts/import-database.ts backups/backup-database-2026-01-17.sql "postgresql://user:pass@host:5432/newdb"')
  process.exit(1)
}

// Vérifier que le fichier SQL existe
if (!fs.existsSync(sqlFile)) {
  console.error(`❌ Fichier non trouvé: ${sqlFile}`)
  process.exit(1)
}

// Parser la nouvelle URL de connexion PostgreSQL
const urlMatch = newDatabaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/)

if (!urlMatch) {
  console.error('❌ Format de DATABASE_URL invalide')
  console.error('   Format attendu: postgresql://user:password@host:port/database')
  process.exit(1)
}

const [, username, password, host, port, database] = urlMatch
const decodedPassword = decodeURIComponent(password)

console.log('📥 Import de la base de données PostgreSQL...\n')
console.log(`   Fichier SQL: ${sqlFile}`)
console.log(`   Host: ${host}`)
console.log(`   Port: ${port}`)
console.log(`   Database: ${database}`)
console.log(`   User: ${username}\n`)

// Demander confirmation
const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('⚠️  Cette opération va écraser les données existantes. Continuer? (o/N): ', (answer: string) => {
  if (answer.toLowerCase() !== 'o' && answer.toLowerCase() !== 'oui') {
    console.log('❌ Import annulé')
    rl.close()
    process.exit(0)
  }

  rl.close()

  try {
    console.log('\n🔄 Import en cours...')
    
    // Construire la commande psql
    const psqlCommand = `psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${path.resolve(sqlFile)}"`
    
    // Définir le mot de passe via variable d'environnement
    const env = {
      ...process.env,
      PGPASSWORD: decodedPassword
    }

    execSync(psqlCommand, { 
      env,
      stdio: 'inherit'
    })

    console.log('\n✅ Import réussi!')
    console.log('\n📋 Prochaines étapes:')
    console.log('   1. Vérifiez que toutes les données ont été importées')
    console.log('   2. Exécutez: npx prisma generate')
    console.log('   3. Exécutez: npx prisma db push (si nécessaire)')
    console.log('   4. Testez votre application')
    
  } catch (error: any) {
    console.error('\n❌ Erreur lors de l\'import:', error.message)
    console.error('\n💡 Assurez-vous que:')
    console.error('   1. psql est installé sur votre système')
    console.error('   2. La base de données existe')
    console.error('   3. Vous avez les permissions nécessaires')
    console.error('   4. Les identifiants sont corrects')
    process.exit(1)
  }
})
