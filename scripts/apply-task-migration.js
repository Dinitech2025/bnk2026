const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function applyMigration() {
  console.log('🔧 Application de la migration Task...\n')
  
  try {
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, '..', 'prisma', 'migrations', 'add_task_model.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 Fichier SQL chargé')
    console.log('🔄 Exécution de la migration...\n')
    
    // Diviser le SQL en commandes individuelles et nettoyer
    const commands = sqlContent
      .split(';')
      .map(cmd => {
        // Supprimer les commentaires et espaces
        return cmd
          .split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .trim()
      })
      .filter(cmd => cmd.length > 0)
    
    console.log(`📝 ${commands.length} commandes SQL à exécuter\n`)
    
    // Exécuter chaque commande séparément
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i]
      if (cmd.startsWith('CREATE TABLE')) {
        console.log(`${i + 1}. Création de la table Task...`)
      } else if (cmd.startsWith('CREATE INDEX')) {
        console.log(`${i + 1}. Création d'un index...`)
      } else if (cmd.startsWith('ALTER TABLE')) {
        console.log(`${i + 1}. Ajout d'une clé étrangère...`)
      } else {
        console.log(`${i + 1}. Exécution d'une commande...`)
      }
      
      try {
        await prisma.$executeRawUnsafe(cmd)
        console.log('   ✅ Succès')
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('   ⚠️  Déjà existant (ignoré)')
        } else {
          console.error('   ❌ Erreur:', error.message)
          throw error
        }
      }
    }
    
    console.log('\n✅ Migration appliquée avec succès!')
    console.log('\n📊 Vérification de la table Task...')
    
    // Vérifier que la table existe
    const count = await prisma.task.count()
    console.log(`✅ Table Task accessible. ${count} tâches existantes.\n`)
    
    console.log('🎉 Migration terminée avec succès!')
    console.log('\n💡 Prochaines étapes:')
    console.log('   1. Redémarrez votre serveur de développement')
    console.log('   2. Accédez à /admin/tasks')
    console.log('   3. Testez avec: node scripts/test-task-system.js\n')
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error.message)
    console.error('\n💡 Solutions possibles:')
    console.error('   1. Vérifiez que DATABASE_URL est correctement configuré')
    console.error('   2. Vérifiez que vous avez les permissions sur la base de données')
    console.error('   3. La table Task existe peut-être déjà\n')
    
    // Essayer de vérifier si la table existe déjà
    try {
      const count = await prisma.task.count()
      console.log(`ℹ️  La table Task existe déjà avec ${count} tâches.\n`)
    } catch (e) {
      console.error('❌ La table Task n\'existe pas encore.\n')
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la migration
applyMigration()

