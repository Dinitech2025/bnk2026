const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testTaskSystem() {
  console.log('🧪 Test du système de gestion de tâches\n')
  
  try {
    // 1. Vérifier que la table Task existe
    console.log('1️⃣ Vérification de la table Task...')
    const taskCount = await prisma.task.count()
    console.log(`✅ Table Task accessible. ${taskCount} tâches existantes.\n`)

    // 2. Créer une tâche de test
    console.log('2️⃣ Création d\'une tâche de test...')
    const testTask = await prisma.task.create({
      data: {
        title: 'Tâche de test système',
        description: 'Ceci est une tâche de test pour vérifier le bon fonctionnement du système',
        type: 'CUSTOM',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
        metadata: {
          test: true,
          createdBy: 'test-script'
        }
      }
    })
    console.log(`✅ Tâche créée avec succès: ${testTask.id}\n`)

    // 3. Lire la tâche
    console.log('3️⃣ Lecture de la tâche...')
    const readTask = await prisma.task.findUnique({
      where: { id: testTask.id }
    })
    console.log(`✅ Tâche lue: ${readTask.title}\n`)

    // 4. Mettre à jour la tâche
    console.log('4️⃣ Mise à jour du statut...')
    const updatedTask = await prisma.task.update({
      where: { id: testTask.id },
      data: {
        status: 'IN_PROGRESS'
      }
    })
    console.log(`✅ Statut mis à jour: ${updatedTask.status}\n`)

    // 5. Compléter la tâche
    console.log('5️⃣ Complétion de la tâche...')
    const completedTask = await prisma.task.update({
      where: { id: testTask.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })
    console.log(`✅ Tâche complétée à: ${completedTask.completedAt}\n`)

    // 6. Tester les filtres
    console.log('6️⃣ Test des filtres...')
    const pendingTasks = await prisma.task.findMany({
      where: { status: 'PENDING' },
      take: 5
    })
    console.log(`✅ ${pendingTasks.length} tâches en attente trouvées\n`)

    const urgentTasks = await prisma.task.findMany({
      where: { 
        priority: 'URGENT',
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      take: 5
    })
    console.log(`✅ ${urgentTasks.length} tâches urgentes trouvées\n`)

    // 7. Supprimer la tâche de test
    console.log('7️⃣ Nettoyage...')
    await prisma.task.delete({
      where: { id: testTask.id }
    })
    console.log(`✅ Tâche de test supprimée\n`)

    // 8. Statistiques globales
    console.log('8️⃣ Statistiques globales:')
    const stats = await prisma.task.groupBy({
      by: ['status'],
      _count: true
    })
    console.log('\nRépartition par statut:')
    stats.forEach(stat => {
      console.log(`  - ${stat.status}: ${stat._count} tâches`)
    })

    const priorityStats = await prisma.task.groupBy({
      by: ['priority'],
      _count: true
    })
    console.log('\nRépartition par priorité:')
    priorityStats.forEach(stat => {
      console.log(`  - ${stat.priority}: ${stat._count} tâches`)
    })

    const typeStats = await prisma.task.groupBy({
      by: ['type'],
      _count: true
    })
    console.log('\nRépartition par type:')
    typeStats.forEach(stat => {
      console.log(`  - ${stat.type}: ${stat._count} tâches`)
    })

    console.log('\n✨ Tous les tests sont passés avec succès!')
    console.log('🎉 Le système de gestion de tâches fonctionne correctement.\n')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    console.error('\n⚠️  Le système de tâches n\'est pas correctement configuré.')
    console.error('💡 Assurez-vous d\'avoir exécuté la migration SQL:')
    console.error('   psql $DATABASE_URL -f prisma/migrations/add_task_model.sql\n')
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter les tests
testTaskSystem()

