const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { addDays } = require('date-fns');

const prisma = new PrismaClient();

console.log('Démarrage du planificateur de tâches...');

// Fonction de mise à jour des abonnements
async function updateSubscriptionStatuses() {
  console.log("Début de la mise à jour des statuts d'abonnements...");
  const now = new Date();
  const threeDaysFromNow = addDays(now, 3);

  try {
    // 1. Mettre à jour les abonnements en attente qui ont une date de début passée -> ACTIVE
    const pendingSubscriptions = await prisma.subscription.updateMany({
      where: {
        status: 'PENDING',
        startDate: { lte: now }
      },
      data: {
        status: 'ACTIVE'
      }
    });
    console.log(`${pendingSubscriptions.count} abonnements en attente ont été activés`);

    // 2. Identifier les abonnements qui expirent dans les 3 prochains jours -> CONTACT_NEEDED
    const contactNeededSubscriptions = await prisma.subscription.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: threeDaysFromNow,
          gt: now
        },
        contactNeeded: false
      },
      data: {
        status: 'CONTACT_NEEDED',
        contactNeeded: true
      }
    });
    console.log(`${contactNeededSubscriptions.count} abonnements ont été marqués comme nécessitant un contact`);

    // 3. Marquer les abonnements expirés -> EXPIRED
    const expiredSubscriptions = await prisma.subscription.updateMany({
      where: {
        status: { in: ['ACTIVE', 'CONTACT_NEEDED'] },
        endDate: { lt: now }
      },
      data: {
        status: 'EXPIRED',
      }
    });
    console.log(`${expiredSubscriptions.count} abonnements ont été marqués comme expirés`);

    console.log("Mise à jour des statuts terminée avec succès");
    return { pendingSubscriptions, contactNeededSubscriptions, expiredSubscriptions };
  } catch (error) {
    console.error("Erreur lors de la mise à jour des statuts d'abonnements:", error);
    throw error;
  }
}

// Exécuter tous les jours à minuit
cron.schedule('0 0 * * *', async () => {
  console.log(`Exécution programmée de la mise à jour des abonnements : ${new Date().toISOString()}`);
  
  try {
    await updateSubscriptionStatuses();
    console.log('Mise à jour des abonnements terminée avec succès');
  } catch (error) {
    console.error('Erreur lors de la mise à jour des abonnements :', error);
  }
});

// Exécuter aussi la mise à jour au démarrage du script
(async () => {
  console.log('Exécution initiale de la mise à jour des abonnements...');
  
  try {
    await updateSubscriptionStatuses();
    console.log('Mise à jour initiale des abonnements terminée avec succès');
  } catch (error) {
    console.error('Erreur lors de la mise à jour initiale des abonnements :', error);
  }
})();

// Maintenir le processus actif
process.stdin.resume();

console.log('Planificateur de tâches démarré avec succès. Exécution quotidienne à minuit.');
console.log('Appuyez sur Ctrl+C pour arrêter le processus.'); 