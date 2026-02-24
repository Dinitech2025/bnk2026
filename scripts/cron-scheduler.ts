import cron from 'node-cron';
import { updateSubscriptionStatuses } from './update-subscription-status';
import { PrismaClient } from '@prisma/client';
import { syncExchangeRates } from '../lib/currency-service';

const prisma = new PrismaClient();

console.log('Démarrage du planificateur de tâches...');

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

// Synchroniser les taux de change 5 fois par jour (toutes les 4.8 heures)
// À 0h, 4h48, 9h36, 14h24 et 19h12
cron.schedule('0 0,5,10,14,19 * * *', async () => {
  const now = new Date();
  console.log(`Exécution programmée de la synchronisation des taux de change : ${now.toISOString()}`);
  
  try {
    const result = await syncExchangeRates();
    if (result) {
      console.log('Synchronisation des taux de change terminée avec succès');
    } else {
      console.log('Aucune mise à jour des taux de change nécessaire ou erreur lors de la synchronisation');
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation des taux de change :', error);
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
  
  console.log('Exécution initiale de la synchronisation des taux de change...');
  
  try {
    const result = await syncExchangeRates();
    if (result) {
      console.log('Synchronisation initiale des taux de change terminée avec succès');
    } else {
      console.log('Aucune mise à jour initiale des taux de change nécessaire ou erreur lors de la synchronisation');
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation initiale des taux de change :', error);
  }
})();

// Maintenir le processus actif
process.stdin.resume();

console.log('Planificateur de tâches démarré avec succès:');
console.log('- Mise à jour des abonnements: tous les jours à minuit');
console.log('- Synchronisation des taux de change: 5 fois par jour');
console.log('Planificateur de tâches démarré avec succès. Exécution quotidienne à minuit.');
console.log('Appuyez sur Ctrl+C pour arrêter le processus.'); 