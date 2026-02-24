# Guide de Développement

## Démarrage du serveur de développement

### Méthode recommandée
```bash
npm run dev
```
Cette commande va automatiquement :
- Libérer le port 3000 si il est occupé
- Démarrer les tâches automatisées
- Lancer Next.js sur le port 3000

### Méthodes alternatives

#### Pour Windows (scripts batch)
Double-cliquez sur `dev.bat` ou exécutez :
```cmd
dev.bat
```

#### Nettoyage manuel du port 3000
```bash
npm run kill-port
```
ou sur Windows :
```cmd
kill-port.bat
```

#### Ancienne méthode (sans nettoyage automatique)
```bash
npm run dev:old
```

## Résolution des problèmes

### Port 3000 occupé
Si vous obtenez l'erreur "Port 3000 is in use", utilisez :
```bash
npm run kill-port
```
puis relancez :
```bash
npm run dev
```

### Processus bloqués
Sur Windows, vous pouvez utiliser le script batch :
```cmd
kill-port.bat
```

### Vérification manuelle des processus
#### Windows
```cmd
netstat -ano | findstr :3000
taskkill /F /PID [PID_NUMBER]
```

#### Linux/macOS
```bash
lsof -ti:3000
kill -9 [PID_NUMBER]
```

## Ports utilisés

- **3000** : Serveur de développement Next.js (principal)
- **3001** : Serveur de production (fallback)
- **3002** : Serveur de développement (fallback automatique)

## Scripts disponibles

- `npm run dev` : Démarre le serveur avec nettoyage automatique du port
- `npm run dev:old` : Ancienne méthode de démarrage
- `npm run kill-port` : Nettoie uniquement le port 3000
- `npm run build` : Compile l'application
- `npm run start` : Démarre en mode production

## Arrêt du serveur

Utilisez `Ctrl+C` dans le terminal pour arrêter proprement le serveur et tous les processus associés. 