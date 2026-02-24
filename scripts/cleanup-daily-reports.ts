import { PrismaClient } from '@prisma/client';

async function cleanupDailyReports() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧹 Démarrage du nettoyage des rapports journaliers...');

    // 1. Récupérer tous les rapports groupés par date
    const reports = await prisma.dailyReport.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        ticketUsages: true
      }
    });

    // 2. Grouper les rapports par date
    const reportsByDate = reports.reduce((acc, report) => {
      const dateKey = new Date(report.date).toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(report);
      return acc;
    }, {} as { [key: string]: any[] });

    // 3. Pour chaque date, garder uniquement le rapport le plus récent
    let deletedCount = 0;
    for (const [date, dateReports] of Object.entries(reportsByDate)) {
      if (dateReports.length > 1) {
        console.log(`📅 ${date}: ${dateReports.length} rapports trouvés`);
        
        // Trier par date de création décroissante et garder le premier
        const [keepReport, ...duplicates] = dateReports.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        console.log(`✅ Conservation du rapport créé le ${new Date(keepReport.createdAt).toLocaleString()}`);
        
        // Supprimer les doublons
        for (const duplicate of duplicates) {
          try {
            // Supprimer d'abord les usages de tickets associés
            await prisma.ticketUsage.deleteMany({
              where: {
                reportId: duplicate.id
              }
            });

            // Puis supprimer le rapport
            await prisma.dailyReport.delete({
              where: {
                id: duplicate.id
              }
            });

            deletedCount++;
            console.log(`🗑️ Suppression du rapport en double du ${new Date(duplicate.createdAt).toLocaleString()}`);
          } catch (error) {
            console.error(`❌ Erreur lors de la suppression du rapport ${duplicate.id}:`, error);
          }
        }
      }
    }

    console.log('\n📊 Résumé du nettoyage:');
    console.log(`🔍 Total des rapports analysés: ${reports.length}`);
    console.log(`🗑️ Rapports supprimés: ${deletedCount}`);
    console.log(`✅ Rapports conservés: ${reports.length - deletedCount}`);

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
cleanupDailyReports()
  .then(() => {
    console.log('✨ Nettoyage terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }); 
 