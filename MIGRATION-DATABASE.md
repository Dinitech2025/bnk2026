# 🔄 Guide de Migration de Base de Données

Ce guide vous explique comment exporter votre base de données actuelle et l'importer dans une nouvelle base PostgreSQL.

## 📋 Prérequis

1. **pg_dump** et **psql** installés sur votre système
   - Windows: Installez PostgreSQL depuis https://www.postgresql.org/download/windows/
   - Les outils sont inclus dans l'installation PostgreSQL

2. Accès à votre base de données actuelle et à la nouvelle base

## 🔧 Étape 1: Exporter la Base de Données Actuelle

### Option A: Utiliser le script automatique (Recommandé)

```bash
# Assurez-vous que votre DATABASE_URL est configurée dans .env.local ou .env
npx tsx scripts/export-database.ts
```

Le script va:
- Lire votre DATABASE_URL actuelle
- Exporter toutes les données dans un fichier SQL
- Sauvegarder le fichier dans le dossier `backups/`

### Option B: Commande manuelle

```bash
# Remplacer les valeurs par vos informations
pg_dump -h votre_host -p 5432 -U votre_user -d votre_database -F p -f backup.sql --no-owner --no-acl
```

## 📝 Étape 2: Mettre à Jour la Configuration

### Option A: Utiliser le script interactif (Recommandé)

```bash
npx tsx scripts/update-database-config.ts
```

Le script va vous demander:
- Host de la nouvelle base
- Port (défaut: 5432)
- Nom de la base de données
- Utilisateur PostgreSQL
- Mot de passe PostgreSQL

Il mettra à jour automatiquement votre fichier `.env.local` ou `.env`.

### Option B: Modification manuelle

Éditez votre fichier `.env.local` ou `.env`:

```env
DATABASE_URL="postgresql://nouveau_user:nouveau_password@nouveau_host:5432/nouvelle_database?schema=public&connect_timeout=30"
```

**Important:** Si votre mot de passe contient des caractères spéciaux (comme `@`, `#`, `%`), ils seront automatiquement encodés dans l'URL.

## 📥 Étape 3: Créer la Nouvelle Base de Données

Avant d'importer, assurez-vous que la nouvelle base de données existe:

```bash
# Se connecter à PostgreSQL
psql -h nouveau_host -p 5432 -U nouveau_user -d postgres

# Créer la nouvelle base de données
CREATE DATABASE "nouvelle_database";

# Quitter
\q
```

## 📥 Étape 4: Importer les Données

### Option A: Utiliser le script automatique (Recommandé)

```bash
npx tsx scripts/import-database.ts backups/backup-database-2026-01-17.sql "postgresql://user:pass@host:5432/newdb"
```

### Option B: Commande manuelle

```bash
# Remplacer les valeurs par vos informations
psql -h nouveau_host -p 5432 -U nouveau_user -d nouvelle_database -f backup.sql
```

**Note:** Vous devrez peut-être entrer le mot de passe PostgreSQL lors de l'exécution.

## ✅ Étape 5: Vérifier et Finaliser

1. **Générer le client Prisma:**
   ```bash
   npx prisma generate
   ```

2. **Vérifier le schéma (optionnel):**
   ```bash
   npx prisma db push
   ```

3. **Tester votre application:**
   ```bash
   npm run dev
   ```

## 🔍 Vérification

Pour vérifier que les données ont été correctement importées:

```bash
# Se connecter à la nouvelle base
psql -h nouveau_host -p 5432 -U nouveau_user -d nouvelle_database

# Compter les tables
\dt

# Vérifier quelques données
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Order";
SELECT COUNT(*) FROM "Product";

# Quitter
\q
```

## ⚠️ Notes Importantes

1. **Sauvegarde:** Gardez toujours une copie de votre backup SQL en lieu sûr
2. **Mot de passe:** Les caractères spéciaux dans les mots de passe sont automatiquement encodés dans l'URL
3. **Permissions:** Assurez-vous d'avoir les permissions nécessaires sur la nouvelle base
4. **Schéma:** Le script exporte avec `--no-owner --no-acl` pour éviter les problèmes de permissions

## 🆘 Dépannage

### Erreur: "pg_dump: command not found"
- Installez PostgreSQL sur votre système
- Ajoutez PostgreSQL/bin à votre PATH

### Erreur: "password authentication failed"
- Vérifiez vos identifiants
- Assurez-vous que l'utilisateur a les permissions nécessaires

### Erreur: "database does not exist"
- Créez la base de données avant d'importer
- Vérifiez le nom de la base dans la DATABASE_URL

### Erreur lors de l'import
- Vérifiez que la base de données est vide ou que vous acceptez d'écraser les données
- Vérifiez les logs d'erreur pour plus de détails

## 📞 Support

Si vous rencontrez des problèmes, vérifiez:
1. Les logs d'erreur détaillés
2. La connexion à la base de données
3. Les permissions utilisateur
4. La version de PostgreSQL (doit être compatible)
