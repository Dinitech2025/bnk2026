# 🔧 Correction PayPal Production - URLs localhost

## 🐛 **Problème Identifié**

PayPal utilisait des URLs localhost en production au lieu du domaine de production, causant des erreurs de redirection.

## ✅ **Corrections Appliquées**

### 1. **Amélioration de la fonction `getBaseUrl()`**

```typescript
// Nouvelle logique de détection d'URL en production
export function getBaseUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    // 1. Priorité: URL automatique Netlify
    if (process.env.URL) return process.env.URL
    
    // 2. Fallback: URL de déploiement Netlify  
    if (process.env.DEPLOY_URL) return process.env.DEPLOY_URL
    
    // 3. Fallback: Variable manuelle
    if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
    
    // 4. Dernier fallback
    return 'https://boutik-naka.com'
  }
  // ... logique développement
}
```

### 2. **Variables d'environnement Netlify utilisées**

- ✅ `process.env.URL` - URL principale du site (automatique)
- ✅ `process.env.DEPLOY_URL` - URL de déploiement (automatique)  
- ✅ `process.env.NEXT_PUBLIC_BASE_URL` - Variable manuelle (optionnelle)

### 3. **Logs de débogage ajoutés**

L'API PayPal `/api/paypal/create-order` affiche maintenant :
```javascript
console.log('🔗 PayPal URLs générées:', {
  environment: process.env.NODE_ENV,
  netlifyUrl: process.env.URL,
  deployUrl: process.env.DEPLOY_URL,
  baseUrl: getSecureBaseUrl(),
  returnUrl,
  cancelUrl
})
```

## 🧪 **Tests Effectués**

### ✅ Test 1 - Production avec variables Netlify
```
getBaseUrl(): https://boutik-naka.com
Return URL: https://boutik-naka.com/paypal-return?orderID=ORDER_12345&success=true
Cancel URL: https://boutik-naka.com/paypal-return?orderID=ORDER_12345&success=false
Contient localhost? ✅ NON
```

### ✅ Test 2 - Production sans variables Netlify
```
getBaseUrl(): https://boutik-naka.com (fallback)
Return URL: https://boutik-naka.com/paypal-return?orderID=ORDER_67890&success=true
Cancel URL: https://boutik-naka.com/paypal-return?orderID=ORDER_67890&success=false
Contient localhost? ✅ NON
```

## 🚀 **Déploiement**

- ✅ **Commit** : 022231b
- ✅ **Push** : Déployé sur master
- ✅ **Build** : Succès complet
- 🔄 **Netlify** : Redéploiement automatique en cours

## 🔍 **Comment Vérifier en Production**

### 1. **Vérifier les logs Netlify**
1. Aller sur Netlify Dashboard
2. Functions > View logs
3. Chercher "🔗 PayPal URLs générées"
4. Vérifier que les URLs contiennent `boutik-naka.com`

### 2. **Tester un paiement PayPal**
1. Aller sur le site en production
2. Ajouter un produit au panier
3. Aller au checkout
4. Sélectionner PayPal
5. Vérifier que la redirection fonctionne

### 3. **Vérifier les URLs dans la console**
Ouvrir les outils de développement et chercher les logs PayPal.

## 📋 **Scripts de Diagnostic Disponibles**

```bash
# Test des URLs en local
node scripts/test-paypal-urls-simple.js

# Diagnostic complet
node scripts/fix-production-urls.js

# Test de production (simulation)
node scripts/test-paypal-production-urls.js
```

## ⚠️ **Si le Problème Persiste**

### Option 1 : Ajouter la variable manuellement
Dans Netlify Dashboard > Site settings > Environment variables :
```
NEXT_PUBLIC_BASE_URL=https://boutik-naka.com
```

### Option 2 : Vérifier les variables Netlify
Les variables `URL` et `DEPLOY_URL` sont automatiques, mais vérifiez qu'elles existent.

### Option 3 : Forcer le redéploiement
1. Aller sur Netlify Dashboard
2. Deploys > Trigger deploy > Deploy site

## 🎯 **Résultat Attendu**

Après déploiement, PayPal devrait :
- ✅ Utiliser `https://boutik-naka.com` pour les URLs de retour
- ✅ Rediriger correctement après paiement
- ✅ Ne plus afficher d'erreurs de localhost
- ✅ Fonctionner en mode production

## 📊 **Commit Info**

- **Repository** : github.com/Dinitech2025/bnk2025
- **Branche** : master
- **Commit** : 022231b
- **Fichiers modifiés** :
  - `lib/utils/get-base-url.ts` - Logique URL améliorée
  - `app/api/paypal/create-order/route.ts` - Logs de débogage
  - Scripts de diagnostic ajoutés

---

🎉 **PayPal devrait maintenant fonctionner correctement en production !**
