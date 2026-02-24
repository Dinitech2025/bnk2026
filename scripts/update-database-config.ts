import * as fs from 'fs'
import * as path from 'path'

console.log('🔧 Mise à jour de la configuration de la base de données\n')

// Demander les nouvelles informations
const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  try {
    console.log('📋 Veuillez fournir les informations de la nouvelle base de données:\n')
    
    const host = await question('Host (ex: localhost ou 180.149.199.175): ')
    const port = await question('Port (défaut: 5432): ') || '5432'
    const database = await question('Nom de la base de données: ')
    const username = await question('Utilisateur PostgreSQL: ')
    const password = await question('Mot de passe PostgreSQL: ')
    
    // Construire la DATABASE_URL
    const encodedPassword = encodeURIComponent(password)
    const databaseUrl = `postgresql://${username}:${encodedPassword}@${host}:${port}/${database}?schema=public&connect_timeout=30`
    
    console.log('\n📝 Configuration créée:')
    console.log(`   DATABASE_URL="${databaseUrl}"\n`)
    
    // Lire le fichier .env.local s'il existe, sinon .env
    const envLocalPath = path.join(process.cwd(), '.env.local')
    const envPath = path.join(process.cwd(), '.env')
    
    let envFile = ''
    let envFilePath = ''
    
    if (fs.existsSync(envLocalPath)) {
      envFile = fs.readFileSync(envLocalPath, 'utf-8')
      envFilePath = envLocalPath
    } else if (fs.existsSync(envPath)) {
      envFile = fs.readFileSync(envPath, 'utf-8')
      envFilePath = envPath
    } else {
      // Créer un nouveau fichier .env.local
      envFilePath = envLocalPath
    }
    
    // Mettre à jour ou ajouter DATABASE_URL
    let updatedEnvFile = envFile
    
    if (envFile.includes('DATABASE_URL=')) {
      // Remplacer la ligne existante
      updatedEnvFile = envFile.replace(
        /DATABASE_URL=.*/g,
        `DATABASE_URL="${databaseUrl}"`
      )
    } else {
      // Ajouter à la fin du fichier
      updatedEnvFile = envFile + (envFile ? '\n' : '') + `DATABASE_URL="${databaseUrl}"\n`
    }
    
    // Sauvegarder le fichier
    fs.writeFileSync(envFilePath, updatedEnvFile)
    
    console.log(`✅ Configuration sauvegardée dans: ${envFilePath}`)
    console.log('\n📋 Prochaines étapes:')
    console.log('   1. Vérifiez que la nouvelle base de données existe')
    console.log('   2. Importez votre backup SQL si nécessaire')
    console.log('   3. Exécutez: npx prisma generate')
    console.log('   4. Exécutez: npx prisma db push (si nécessaire)')
    console.log('   5. Testez votre application')
    
  } catch (error: any) {
    console.error('\n❌ Erreur:', error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
