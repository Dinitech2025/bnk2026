# 🎨 Guide Complet : Sliders et Bannières Homepage - BoutikNaka

## ✅ Ce qui a été ajouté

### 📦 Nouveaux Modèles dans la Base de Données

1. **HeroSlideImage** - Images multiples pour les Hero Slides
   - Relation avec `HeroSlide`
   - Support du diaporama automatique
   - Personnalisation complète (couleurs, opacité, transitions)

2. **HomeSliderImage** - Images multiples pour les Home Sliders
   - Relation avec `HomeSlider`
   - Même système de diaporama que HeroSlide
   - Compatible avec les sliders existants

3. **Champs ajoutés aux modèles existants** :
   - `slideshowEnabled` - Activer/désactiver le diaporama
   - `slideshowDuration` - Durée entre les images (ms)
   - `slideshowTransition` - Type de transition (fade, slide, zoom)
   - Champs de couleurs personnalisables

---

## 🎯 État Actuel de Votre Homepage

### ✅ Données Initialisées

Voici ce qui a été créé et initialisé :

#### 📊 Hero Slides (3)
1. **"Découvrez nos Services Premium"**
   - 3 images (Consultation, Stratégie, Innovation)
   - Diaporama activé (5 secondes, fade)
   - Couleurs personnalisées

2. **"Solutions Technologiques Innovantes"**
   - 3 images (Développement, Programmation, Technologies)
   - Diaporama activé (5 secondes, fade)
   - Bouton vert personnalisé

3. **"Formation & Accompagnement"**
   - 3 images (Formation, Équipe, Excellence)
   - Diaporama activé (5 secondes, fade)
   - Bouton orange personnalisé

#### 📊 Home Sliders (3)
1. **"Découvrez nos Produits Exclusifs"**
   - 3 images (Commerce, Shopping, Produits)
   - Diaporama activé (5 secondes, fade)

2. **"Services Premium"**
   - 3 images (Services, Consultation, Solutions)
   - Diaporama activé (5 secondes, fade)

3. **"Nouveau sur BoutikNaka"**
   - 3 images (Lifestyle, Mode, Accessoires)
   - Diaporama activé (5 secondes, fade)

#### 📊 Hero Banner (1)
- **"Bienvenue chez Boutik'nakà"**
  - 5 images de fond (Commerce, Consultation, Innovation, Bureaux, Architecture)
  - Diaporama activé (6 secondes, fade)
  - 2 boutons d'action configurés

#### 📈 Total
- **23 images** dans la base de données
- **7 diaporamas** actifs
- **100%** des sliders/bannières configurés

---

## 🚀 Scripts Disponibles

### 1️⃣ Initialisation Complète
```bash
node scripts/seed-homepage-complete.js
```
**Utilité :** Crée tous les Hero Slides, images et la bannière  
**Quand l'utiliser :** Première installation ou réinitialisation complète

### 2️⃣ Ajouter Images aux Hero Slides
```bash
node scripts/seed-hero-slide-images.js
```
**Utilité :** Ajoute des images aux Hero Slides existants  
**Quand l'utiliser :** Après création manuelle de Hero Slides

### 3️⃣ Ajouter Images aux Home Sliders
```bash
node scripts/seed-home-slider-images.js
```
**Utilité :** Détecte et ajoute des images appropriées aux Home Sliders  
**Quand l'utiliser :** Après création de Home Sliders via l'admin

### 4️⃣ Ajouter Images à la Bannière
```bash
node scripts/seed-banner-images.js
```
**Utilité :** Ajoute/met à jour les images de la bannière principale  
**Quand l'utiliser :** Pour renouveler les images de la bannière

### 5️⃣ Vérifier les Données
```bash
node scripts/check-homepage-data.js
```
**Utilité :** Affiche un rapport complet de toutes les données  
**Quand l'utiliser :** Pour vérifier l'état actuel de la homepage

---

## 💻 Utilisation dans le Code

### Récupérer les Données

#### Hero Slides avec Images
```typescript
// app/(site)/page.tsx ou dans un composant
import { prisma } from '@/lib/prisma'

const heroSlides = await prisma.heroSlide.findMany({
  where: { isActive: true },
  include: {
    slideImages: {
      where: { isActive: true },
      orderBy: { order: 'asc' }
    }
  },
  orderBy: { order: 'asc' }
})
```

#### Home Sliders avec Images
```typescript
const homeSliders = await prisma.homeSlider.findMany({
  where: { isActive: true },
  include: {
    sliderImages: {
      where: { isActive: true },
      orderBy: { order: 'asc' }
    }
  },
  orderBy: { order: 'asc' }
})
```

#### Hero Banner avec Images
```typescript
const heroBanner = await prisma.heroBanner.findFirst({
  where: { isActive: true },
  include: {
    backgroundImages: {
      where: { isActive: true },
      orderBy: { order: 'asc' }
    }
  }
})
```

### Composant React Exemple

Voir le fichier complet dans `docs/SLIDERS_ET_BANNIERES.md`

```tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export function SliderWithImages({ slider }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Images à afficher
  const images = slider.slideshowEnabled && slider.sliderImages.length > 0
    ? slider.sliderImages
    : [{ imageUrl: slider.imageUrl, alt: slider.title }]

  // Changement automatique
  useEffect(() => {
    if (!slider.slideshowEnabled || images.length <= 1) return
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, slider.slideshowDuration)

    return () => clearInterval(interval)
  }, [slider.slideshowEnabled, slider.slideshowDuration, images.length])

  return (
    <div className="relative w-full h-[600px] overflow-hidden">
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={img.imageUrl}
            alt={img.alt || slider.title}
            fill
            className="object-cover"
            priority={index === 0}
          />
        </div>
      ))}
      
      {/* Indicateurs */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full ${
                i === currentIndex ? 'bg-white w-8' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 🎨 Personnalisation

### Ajouter Manuellement une Image

```typescript
// Dans un API route ou action serveur
await prisma.heroSlideImage.create({
  data: {
    heroSlideId: 'slide-id',
    imageUrl: 'https://votre-image.jpg',
    title: 'Mon image',
    description: 'Description',
    alt: 'Texte alternatif',
    order: 1,
    isActive: true
  }
})
```

### Modifier la Configuration du Diaporama

```typescript
await prisma.heroSlide.update({
  where: { id: 'slide-id' },
  data: {
    slideshowEnabled: true,
    slideshowDuration: 7000, // 7 secondes
    slideshowTransition: 'slide', // fade, slide, zoom
    overlayOpacity: 50 // 0-100
  }
})
```

### Personnaliser les Couleurs

```typescript
await prisma.heroSlide.update({
  where: { id: 'slide-id' },
  data: {
    titleColor: '#ffffff',
    descriptionColor: '#e5e7eb',
    buttonTextColor: '#ffffff',
    buttonBgColor: '#ef4444', // Rouge
    overlayColor: '#000000',
    overlayOpacity: 45
  }
})
```

---

## 📊 Structure de la Base de Données

### HeroSlide
```prisma
model HeroSlide {
  id                  String             @id @default(cuid())
  title               String
  description         String?
  image               String             // Image par défaut
  buttonText          String
  buttonLink          String
  isActive            Boolean
  order               Int
  
  // Diaporama
  slideshowEnabled    Boolean            @default(false)
  slideshowDuration   Int                @default(5000)
  slideshowTransition String             @default("fade")
  
  // Couleurs
  titleColor          String?
  descriptionColor    String?
  buttonTextColor     String?
  buttonBgColor       String?
  overlayColor        String?            @default("#000000")
  overlayOpacity      Int                @default(40)
  
  // Relations
  slideImages         HeroSlideImage[]
}
```

### HeroSlideImage
```prisma
model HeroSlideImage {
  id           String     @id @default(cuid())
  heroSlideId  String
  imageUrl     String
  title        String?
  description  String?
  alt          String?
  order        Int        @default(0)
  isActive     Boolean    @default(true)
  
  heroSlide    HeroSlide  @relation(fields: [heroSlideId], references: [id], onDelete: Cascade)
}
```

---

## 🔧 Commandes Prisma Utiles

```bash
# Générer le client Prisma
npx prisma generate

# Ouvrir Prisma Studio (interface graphique)
npx prisma studio

# Synchroniser le schéma avec la DB
npx prisma db push

# Vérifier les données
node scripts/check-homepage-data.js
```

---

## 📝 Notes Importantes

### ✅ Fait
- ✅ Modèles créés et migrés dans la base de données
- ✅ 23 images ajoutées (Hero Slides + Home Sliders + Banner)
- ✅ Diaporamas configurés et activés
- ✅ Scripts d'initialisation et de seed créés
- ✅ Documentation complète rédigée
- ✅ Script de vérification pour monitoring

### 🎯 Prochaines Étapes (Optionnel)

1. **Interface Admin** : Créer une interface pour gérer les sliders/images
2. **Upload d'Images** : Intégrer avec Cloudinary/ImageKit
3. **Animations** : Ajouter plus de types de transitions
4. **Responsive** : Optimiser pour mobile
5. **Performance** : Lazy loading et optimisation des images

### 💡 Conseils

- **Images de production** : Remplacer les URLs Unsplash par vos propres images
- **Performance** : Utiliser Next.js Image avec `priority` pour la première image
- **Accessibilité** : Toujours remplir les attributs `alt`
- **SEO** : Utiliser des noms descriptifs pour les images
- **Backup** : Exporter régulièrement avec `prisma db pull`

---

## 🆘 Dépannage

### Problème : "Table does not exist"
```bash
npx prisma db push
npx prisma generate
```

### Problème : "No images showing"
```bash
node scripts/check-homepage-data.js
# Vérifier si les images existent et sont actives
```

### Problème : "Slideshow not working"
Vérifier que :
- `slideshowEnabled` est `true`
- Il y a plus d'une image active
- `slideshowDuration` est > 0
- Le composant utilise `useEffect` correctement

---

## 📚 Documentation Complète

Pour plus de détails, voir :
- **docs/SLIDERS_ET_BANNIERES.md** - Documentation technique complète
- **scripts/** - Tous les scripts disponibles
- **prisma/schema.prisma** - Structure de la base de données

---

## 🎉 Résultat Final

Votre homepage dispose maintenant de :
- ✅ **3 Hero Slides** avec 3 images chacun (9 images)
- ✅ **3 Home Sliders** avec 3 images chacun (9 images)
- ✅ **1 Hero Banner** avec 5 images de fond
- ✅ **Diaporamas automatiques** avec transitions fluides
- ✅ **Personnalisation complète** des couleurs et effets
- ✅ **Scripts de gestion** pour faciliter la maintenance

**Total : 23 images configurées et 7 diaporamas actifs ! 🚀**

---

**Créé pour BoutikNaka** 🛍️  
Date : 2025  
Version : 1.0




