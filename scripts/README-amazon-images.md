# 🛒 Système d'Images Amazon pour Produits Importés

Ce système permet d'associer des images depuis Amazon aux produits importés de votre application.

## 📋 Scripts Disponibles

### 1. `fetch-amazon-images-simple.js` ⭐ (Recommandé)
**Version simplifiée qui fonctionne immédiatement**
- Utilise des images de fallback depuis Unsplash
- Associe automatiquement un ASIN à un produit
- Fonctionne sans configuration Cloudinary

```bash
node scripts/fetch-amazon-images-simple.js
```

### 2. `fetch-amazon-images.js` 🔧 (Avancé)
**Version complète avec Cloudinary**
- Tente de récupérer les vraies images Amazon
- Upload sur Cloudinary pour optimisation
- Nécessite configuration Cloudinary

```bash
# D'abord configurer Cloudinary
node scripts/setup-cloudinary.js

# Puis lancer le script
node scripts/fetch-amazon-images.js
```

### 3. `check-amazon-association.js` 🔍
**Vérification des associations**
- Affiche tous les produits avec ASIN
- Montre les images associées
- Statistiques complètes

```bash
node scripts/check-amazon-association.js
```

## 🚀 Utilisation Rapide

### Étape 1: Modifier l'URL Amazon
Éditez le fichier `scripts/fetch-amazon-images-simple.js` et changez l'URL :

```javascript
const AMAZON_URL = 'https://www.amazon.fr/dp/VOTRE_ASIN_ICI'
```

### Étape 2: Lancer le script
```bash
node scripts/fetch-amazon-images-simple.js
```

### Étape 3: Vérifier le résultat
```bash
node scripts/check-amazon-association.js
```

## 📊 Comment ça fonctionne

1. **Extraction ASIN** : Le script extrait l'ASIN depuis l'URL Amazon
2. **Recherche produit** : Cherche un produit existant avec cet ASIN
3. **Association automatique** : Si pas trouvé, associe au premier produit importé disponible
4. **Ajout images** : Ajoute les images (fallback ou vraies images Amazon)
5. **Mise à jour base** : Crée les entrées Media et attributs

## 🔧 Configuration Cloudinary (Optionnel)

Pour utiliser les vraies images Amazon :

1. Créez un compte sur [Cloudinary](https://cloudinary.com/)
2. Ajoutez à votre `.env.local` :
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
3. Lancez `node scripts/fetch-amazon-images.js`

## 📝 Structure des Données

### Attributs ajoutés au produit :
- `asin` : L'identifiant Amazon (ex: B0DMVB5XFF)
- `amazon_url` : L'URL complète Amazon
- `image_1`, `image_2`, etc. : URLs des images

### Entrées Media créées :
- Nom descriptif
- URL de l'image
- Relation avec le produit
- Métadonnées (alt, taille, etc.)

## 🎯 Exemples d'URLs Amazon

```
https://www.amazon.fr/dp/B0DMVB5XFF
https://www.amazon.com/dp/B08N5WRWNW
https://www.amazon.co.uk/dp/B09G9FPHY6
```

## ⚠️ Limitations

### Amazon Anti-Bot
Amazon a des protections contre le scraping automatique :
- Peut bloquer les requêtes automatisées
- Nécessite parfois des proxies ou rotation d'IP
- C'est pourquoi on utilise des images de fallback

### Images de Fallback
Les images Unsplash sont :
- ✅ Libres de droits
- ✅ Haute qualité
- ✅ Optimisées pour le web
- ❌ Pas spécifiques au produit

## 🔗 Liens Utiles

- **Administration** : http://localhost:3000/admin/products
- **Produits importés** : http://localhost:3000/admin/products/imported
- **Simulateur** : http://localhost:3000/admin/products/imported/simulation

## 💡 Conseils

1. **Testez d'abord** avec la version simple
2. **Configurez Cloudinary** pour de meilleures performances
3. **Vérifiez les associations** avec le script de check
4. **Publiez les produits** depuis l'administration
5. **Remplacez manuellement** les images si nécessaire

## 🆘 Dépannage

### Erreur "ASIN non trouvé"
- Vérifiez que l'URL contient `/dp/ASIN`
- L'ASIN doit faire 10 caractères (lettres et chiffres)

### Erreur "Aucun produit importé"
- Lancez d'abord `node scripts/create-imported-products.js`
- Vérifiez la catégorie "Produits importés"

### Images ne s'affichent pas
- Vérifiez `next.config.js` pour les domaines autorisés
- Redémarrez le serveur Next.js après modification

### Cloudinary ne fonctionne pas
- Vérifiez les variables d'environnement
- Testez avec `node scripts/setup-cloudinary.js` 