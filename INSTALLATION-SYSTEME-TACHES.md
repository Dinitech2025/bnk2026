# 🚀 Installation du Système de Gestion de Tâches

## Étapes d'Installation

### 1. Appliquer la Migration SQL

Le système de tâches nécessite une nouvelle table dans la base de données. Voici comment l'installer:

#### Option A: Via psql (Recommandé)

```bash
# Depuis le terminal, exécuter:
psql $DATABASE_URL -f prisma/migrations/add_task_model.sql
```

#### Option B: Via l'interface Prisma Studio

1. Ouvrir Prisma Studio:
```bash
npx prisma studio
```

2. Aller dans l'onglet "SQL"
3. Copier-coller le contenu de `prisma/migrations/add_task_model.sql`
4. Exécuter la requête

#### Option C: Via un client PostgreSQL

1. Ouvrir votre client PostgreSQL (pgAdmin, DBeaver, etc.)
2. Se connecter à votre base de données
3. Copier-coller le contenu de `prisma/migrations/add_task_model.sql`
4. Exécuter la requête

### 2. Générer le Client Prisma

```bash
npx prisma generate
```

### 3. Tester l'Installation

```bash
node scripts/test-task-system.js
```

Vous devriez voir:
```
🧪 Test du système de gestion de tâches

1️⃣ Vérification de la table Task...
✅ Table Task accessible. 0 tâches existantes.

2️⃣ Création d'une tâche de test...
✅ Tâche créée avec succès: clxxx...

...

✨ Tous les tests sont passés avec succès!
🎉 Le système de gestion de tâches fonctionne correctement.
```

### 4. Configurer le Cron Job (Optionnel mais Recommandé)

Pour activer la génération automatique quotidienne des tâches:

#### Sur Linux/Mac:

```bash
# Ouvrir le crontab
crontab -e

# Ajouter cette ligne (génération à 8h00 chaque jour)
0 8 * * * cd /chemin/vers/bnk && node scripts/generate-tasks-cron.js >> /var/log/bnk-tasks.log 2>&1
```

#### Sur Windows (Task Scheduler):

1. Ouvrir le Planificateur de tâches
2. Créer une nouvelle tâche
3. Déclencheur: Quotidien à 8h00
4. Action: Démarrer un programme
   - Programme: `node`
   - Arguments: `scripts/generate-tasks-cron.js`
   - Dossier de départ: `C:\chemin\vers\bnk`

#### Sur Netlify/Vercel (Cron Jobs):

Ajouter dans `netlify.toml` ou `vercel.json`:

```toml
# netlify.toml
[[plugins]]
  package = "@netlify/plugin-cron"
  
  [plugins.inputs]
    schedule = "0 8 * * *"
    command = "node scripts/generate-tasks-cron.js"
```

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/admin/tasks/generate",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### 5. Vérifier l'Accès à l'Interface

1. Démarrer le serveur de développement:
```bash
npm run dev
```

2. Se connecter en tant qu'admin

3. Accéder à: `http://localhost:3000/admin/tasks`

Vous devriez voir l'interface de gestion des tâches.

## 🔧 Dépannage

### Erreur: "Table Task does not exist"

**Solution:** La migration SQL n'a pas été appliquée.
```bash
psql $DATABASE_URL -f prisma/migrations/add_task_model.sql
npx prisma generate
```

### Erreur: "Cannot find module '@prisma/client'"

**Solution:** Réinstaller les dépendances.
```bash
npm install
npx prisma generate
```

### Les tâches ne se génèrent pas automatiquement

**Solution:** Vérifier le cron job.
```bash
# Tester la génération manuelle
node scripts/generate-tasks-cron.js

# Vérifier les logs du cron
tail -f /var/log/bnk-tasks.log
```

### Erreur de permissions

**Solution:** Vérifier que l'utilisateur a les droits sur la base de données.
```sql
-- Donner les permissions nécessaires
GRANT ALL PRIVILEGES ON TABLE "Task" TO votre_utilisateur;
```

## 📝 Vérification Post-Installation

### Checklist:

- [ ] La table `Task` existe dans la base de données
- [ ] Le client Prisma est généré
- [ ] Le script de test passe avec succès
- [ ] L'interface `/admin/tasks` est accessible
- [ ] Les APIs répondent correctement
- [ ] Le cron job est configuré (optionnel)
- [ ] Les notifications affichent les tâches

### Commandes de Vérification:

```bash
# 1. Vérifier la table
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Task\";"

# 2. Tester les APIs
curl http://localhost:3000/api/admin/tasks

# 3. Générer des tâches de test
curl -X POST http://localhost:3000/api/admin/tasks/generate

# 4. Vérifier les notifications
curl http://localhost:3000/api/admin/notifications
```

## 🎯 Première Utilisation

### 1. Générer les Premières Tâches

Depuis l'interface admin:
1. Aller sur `/admin/tasks`
2. Cliquer sur "Générer tâches auto"
3. Attendre la confirmation

Ou via l'API:
```bash
curl -X POST http://localhost:3000/api/admin/tasks/generate \
  -H "Content-Type: application/json"
```

### 2. Créer une Tâche Manuelle

1. Cliquer sur "Nouvelle tâche"
2. Remplir le formulaire:
   - Titre: "Ma première tâche"
   - Type: "CUSTOM"
   - Priorité: "MEDIUM"
   - Description: "Ceci est une tâche de test"
3. Cliquer sur "Créer"

### 3. Traiter une Tâche

1. Trouver une tâche en attente
2. Cliquer sur "Démarrer"
3. Effectuer l'action nécessaire
4. Cliquer sur "Terminer"

## 📊 Monitoring

### Logs à Surveiller:

```bash
# Logs du serveur Next.js
tail -f .next/server.log

# Logs du cron job
tail -f /var/log/bnk-tasks.log

# Logs de la base de données
tail -f /var/log/postgresql/postgresql.log
```

### Métriques Importantes:

- Nombre de tâches créées par jour
- Temps moyen de complétion
- Taux de tâches urgentes
- Taux de complétion

## 🔄 Mise à Jour

Si vous mettez à jour le système de tâches:

```bash
# 1. Récupérer les dernières modifications
git pull

# 2. Installer les dépendances
npm install

# 3. Régénérer le client Prisma
npx prisma generate

# 4. Redémarrer le serveur
npm run dev
```

## 📞 Support

En cas de problème:

1. Consulter la documentation: `SYSTEME-GESTION-TACHES.md`
2. Vérifier les logs du serveur
3. Exécuter le script de test: `node scripts/test-task-system.js`
4. Contacter l'équipe de développement

---

**Version:** 1.0.0  
**Dernière mise à jour:** 23 octobre 2025  
**Auteur:** BoutikNaka Development Team

