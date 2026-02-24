#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage de Stagewise...');

// Configuration
const config = {
  appPort: 3000,
  port: 3001,
  workspace: process.cwd(),
  verbose: true
};

console.log(`📍 Workspace: ${config.workspace}`);
console.log(`🌐 App Port: ${config.appPort}`);
console.log(`🔧 Stagewise Port: ${config.port}`);

// Arguments pour Stagewise
const args = [
  'stagewise',
  '--app-port', config.appPort.toString(),
  '--port', config.port.toString(),
  '--workspace', config.workspace,
  '--verbose'
];

console.log(`🎯 Commande: npx ${args.join(' ')}`);

// Démarrer Stagewise avec gestion des prompts
const stagewise = spawn('npx', args, {
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true,
  cwd: config.workspace
});

// Répondre automatiquement aux prompts
stagewise.stdin.write('Y\n'); // Accepter la télémétrie si demandé
stagewise.stdin.write('Y\n'); // Accepter la sauvegarde de config si demandé

stagewise.on('error', (error) => {
  console.error('❌ Erreur Stagewise:', error);
});

stagewise.on('close', (code) => {
  console.log(`🔚 Stagewise fermé avec le code: ${code}`);
});

// Gérer l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt de Stagewise...');
  stagewise.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt de Stagewise...');
  stagewise.kill('SIGTERM');
  process.exit(0);
});

console.log('✅ Stagewise démarré !');
console.log('📱 Interface disponible sur: http://localhost:3001');
console.log('🎯 Votre site avec toolbar Stagewise');
console.log('⏹️  Appuyez sur Ctrl+C pour arrêter');

// Attendre un peu puis vérifier si le serveur répond
setTimeout(() => {
  console.log('🔍 Vérification du serveur Stagewise...');
  console.log('🌐 Ouvrez http://localhost:3001 dans votre navigateur');
  console.log('🎯 Vous devriez voir votre site avec la toolbar Stagewise en haut');
}, 3000);