# ⚡ Guide Rapide : Sliders Multi-Images

## 🚀 Démarrage en 3 Minutes

### 1️⃣ Initialiser la Homepage

```bash
node scripts/seed-homepage-complete.js
```

✅ Crée 3 Hero Slides avec 9 images  
✅ Configure 1 Hero Banner avec 5 images  
✅ Active tous les diaporamas  

---

### 2️⃣ Vérifier les Données

```bash
node scripts/check-homepage-data.js
```

✅ Affiche un rapport complet  
✅ Montre toutes les images  
✅ Vérifie les diaporamas  

---

### 3️⃣ Utiliser dans le Code

```typescript
// Récupérer les slides avec images
const slides = await prisma.heroSlide.findMany({
  include: { slideImages: true }
})
```

---

## 🎯 Commandes Essentielles

| Action | Commande |
|--------|----------|
| **Tout initialiser** | `node scripts/seed-homepage-complete.js` |
| **Vérifier données** | `node scripts/check-homepage-data.js` |
| **Ajouter images slides** | `node scripts/seed-hero-slide-images.js` |
| **Ajouter images sliders** | `node scripts/seed-home-slider-images.js` |
| **Mettre à jour bannière** | `node scripts/seed-banner-images.js` |
| **Ouvrir Prisma Studio** | `npx prisma studio` |

---

## 📊 Ce Qui Est Créé

### Hero Slides (3)
1. **Services Premium** → 3 images business
2. **Solutions Tech** → 3 images technologie  
3. **Formation** → 3 images éducation

### Home Sliders (3)
1. **Produits Exclusifs** → 3 images commerce
2. **Services Premium** → 3 images services
3. **Nouveautés** → 3 images lifestyle

### Hero Banner (1)
**Bienvenue chez Boutik'nakà** → 5 images variées

**Total : 23 images + 7 diaporamas actifs** 🎉

---

## 💻 Exemple de Code React

```tsx
'use client'

import { useState, useEffect } from 'react'

export function Slider({ slide }) {
  const [index, setIndex] = useState(0)
  const images = slide.slideImages

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length)
    }, slide.slideshowDuration)
    return () => clearInterval(timer)
  }, [images.length, slide.slideshowDuration])

  return (
    <div className="relative h-96">
      {images.map((img, i) => (
        <img
          key={i}
          src={img.imageUrl}
          alt={img.alt}
          className={i === index ? 'block' : 'hidden'}
        />
      ))}
    </div>
  )
}
```

---

## 🎨 Configuration Rapide

### Activer le Diaporama

```typescript
await prisma.heroSlide.update({
  where: { id: 'slide-id' },
  data: {
    slideshowEnabled: true,
    slideshowDuration: 5000, // 5 secondes
    slideshowTransition: 'fade'
  }
})
```

### Ajouter une Image

```typescript
await prisma.heroSlideImage.create({
  data: {
    heroSlideId: 'slide-id',
    imageUrl: 'https://example.com/image.jpg',
    title: 'Mon image',
    alt: 'Description',
    order: 1
  }
})
```

---

## 🆘 Problèmes Courants

### Pas d'images affichées ?
```bash
# Vérifier les données
node scripts/check-homepage-data.js

# Réinitialiser
node scripts/seed-homepage-complete.js
```

### Erreur Prisma ?
```bash
npx prisma generate
npx prisma db push
```

### Base de données désynchronisée ?
```bash
npx prisma db pull
npx prisma generate
```

---

## 📚 Documentation Complète

- 📖 **Guide complet** : `README_HOMEPAGE_SLIDERS.md`
- 🔧 **Doc technique** : `docs/SLIDERS_ET_BANNIERES.md`
- 📝 **Changelog** : `CHANGELOG_SLIDERS.md`

---

## ✅ Checklist

- [ ] Exécuter `seed-homepage-complete.js`
- [ ] Vérifier avec `check-homepage-data.js`
- [ ] Voir les données dans `npx prisma studio`
- [ ] Créer les composants React
- [ ] Intégrer dans la page d'accueil
- [ ] Tester le diaporama
- [ ] Optimiser les images
- [ ] Déployer 🚀

---

**C'est tout ! Votre homepage est prête ! 🎉**




