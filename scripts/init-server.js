// Script d'initialisation du serveur qui lance des tâches automatisées

const { spawn } = require('child_process');
const path = require('path');

console.log('Démarrage des tâches automatisées...');

// Lancer le planificateur de tâches d'abonnements
function startSubscriptionScheduler() {
  console.log('Démarrage du planificateur de mises à jour des abonnements...');
  
  const schedulerPath = path.join(__dirname, 'cron-scheduler.js');
  const scheduler = spawn('node', [schedulerPath], { 
    detached: true,
    stdio: ['ignore', 'inherit', 'inherit']
  });
  
  scheduler.unref();
  
  console.log(`Planificateur de mises à jour des abonnements démarré avec PID: ${scheduler.pid}`);
  
  return scheduler.pid;
}

// Exécuter les tâches au démarrage
const schedulerPid = startSubscriptionScheduler();

// Enregistrer les PIDs pour pouvoir les tuer si nécessaire
console.log(`Services démarrés. PIDs: Planificateur=${schedulerPid}`);
console.log('Tâches automatisées démarrées avec succès.');

// On ne termine pas ce script, car il est utilisé dans la commande de démarrage du serveur 