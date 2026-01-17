import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

// Lire la DATABASE_URL depuis les variables d'environnement
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL non trouvée dans les variables d\'environnement')
  console.error('   Assurez-vous que votre fichier .env.local ou .env contient DATABASE_URL')
  process.exit(1)
}

// Parser l'URL de connexion PostgreSQL
// Format: postgresql://user:password@host:port/database?schema=public
const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/)

if (!urlMatch) {
  console.error('❌ Format de DATABASE_URL invalide')
  console.error('   Format attendu: postgresql://user:password@host:port/database')
  process.exit(1)
}

const [, username, password, host, port, database] = urlMatch

// Décoder le mot de passe (peut contenir des caractères encodés)
const decodedPassword = decodeURIComponent(password)

console.log('📦 Export de la base de données PostgreSQL...\n')
console.log(`   Host: ${host}`)
console.log(`   Port: ${port}`)
console.log(`   Database: ${database}`)
console.log(`   User: ${username}\n`)

// Créer le nom du fichier avec timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
const filename = `backup-${database}-${timestamp}.sql`
const filepath = path.join(process.cwd(), 'backups', filename)

// Créer le dossier backups s'il n'existe pas
const backupsDir = path.join(process.cwd(), 'backups')
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true })
}

console.log(`📝 Export vers: ${filepath}\n`)

try {
  // Construire la commande pg_dump
  // Note: pg_dump doit être installé sur le système
  const pgDumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F p -f "${filepath}" --no-owner --no-acl`
  
  // Définir le mot de passe via variable d'environnement pour éviter la prompt
  const env = {
    ...process.env,
    PGPASSWORD: decodedPassword
  }

  console.log('🔄 Export en cours...')
  execSync(pgDumpCommand, { 
    env,
    stdio: 'inherit'
  })

  // Vérifier que le fichier a été créé
  if (fs.existsSync(filepath)) {
    const stats = fs.statSync(filepath)
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2)
    
    console.log(`\n✅ Export réussi!`)
    console.log(`   Fichier: ${filepath}`)
    console.log(`   Taille: ${fileSizeMB} MB`)
    console.log(`\n📋 Prochaines étapes:`)
    console.log(`   1. Sauvegardez ce fichier en lieu sûr`)
    console.log(`   2. Modifiez votre DATABASE_URL pour pointer vers la nouvelle base`)
    console.log(`   3. Importez ce fichier dans la nouvelle base avec:`)
    console.log(`      psql -h nouveau_host -p nouveau_port -U nouveau_user -d nouvelle_database -f "${filepath}"`)
  } else {
    console.error('\n❌ Le fichier d\'export n\'a pas été créé')
    process.exit(1)
  }
} catch (error: any) {
  console.error('\n❌ Erreur lors de l\'export:', error.message)
  console.error('\n💡 Assurez-vous que:')
  console.error('   1. pg_dump est installé sur votre système')
  console.error('   2. Vous avez accès à la base de données')
  console.error('   3. Les identifiants sont corrects')
  process.exit(1)
}
