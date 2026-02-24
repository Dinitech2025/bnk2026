const { exec, spawn } = require('child_process');
const os = require('os');

const PORT = 3000;

function killProcessOnPort(port) {
  return new Promise((resolve) => {
    if (os.platform() === 'win32') {
      // Windows
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error || !stdout) {
          console.log(`Port ${port} est libre`);
          resolve();
          return;
        }

        const lines = stdout.split('\n');
        const pids = new Set();
        
        lines.forEach(line => {
          const match = line.match(/\s+(\d+)\s*$/);
          if (match) {
            pids.add(match[1]);
          }
        });

        if (pids.size === 0) {
          console.log(`Port ${port} est libre`);
          resolve();
          return;
        }

        console.log(`Libération du port ${port}...`);
        const killPromises = Array.from(pids).map(pid => {
          return new Promise((resolvePid) => {
            exec(`taskkill /F /PID ${pid}`, (killError) => {
              if (killError) {
                console.log(`Impossible de tuer le processus ${pid}: ${killError.message}`);
              } else {
                console.log(`Processus ${pid} terminé`);
              }
              resolvePid();
            });
          });
        });

        Promise.all(killPromises).then(() => {
          setTimeout(() => {
            console.log(`Port ${port} libéré`);
            resolve();
          }, 1000);
        });
      });
    } else {
      // Unix/Linux/macOS
      exec(`lsof -ti:${port}`, (error, stdout) => {
        if (error || !stdout.trim()) {
          console.log(`Port ${port} est libre`);
          resolve();
          return;
        }

        const pids = stdout.trim().split('\n');
        console.log(`Libération du port ${port}...`);
        
        const killPromises = pids.map(pid => {
          return new Promise((resolvePid) => {
            exec(`kill -9 ${pid}`, (killError) => {
              if (killError) {
                console.log(`Impossible de tuer le processus ${pid}: ${killError.message}`);
              } else {
                console.log(`Processus ${pid} terminé`);
              }
              resolvePid();
            });
          });
        });

        Promise.all(killPromises).then(() => {
          setTimeout(() => {
            console.log(`Port ${port} libéré`);
            resolve();
          }, 1000);
        });
      });
    }
  });
}

async function startDev() {
  console.log('🚀 Démarrage du serveur de développement...');
  
  // Libérer le port 3000
  await killProcessOnPort(PORT);
  
  // Démarrer les tâches automatisées
  console.log('📋 Démarrage des tâches automatisées...');
  const initProcess = spawn('node', ['scripts/init-server.js'], {
    stdio: 'inherit',
    shell: true
  });

  // Attendre un peu pour que les tâches se lancent
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Démarrer Next.js sur le port 3000
  console.log(`🌐 Démarrage de Next.js sur le port ${PORT}...`);
  const nextProcess = spawn('npx', ['next', 'dev', '-p', PORT.toString()], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: PORT.toString() }
  });

  // Gérer l'arrêt propre
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...');
    initProcess.kill();
    nextProcess.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Arrêt du serveur...');
    initProcess.kill();
    nextProcess.kill();
    process.exit(0);
  });
}

startDev().catch(console.error); 