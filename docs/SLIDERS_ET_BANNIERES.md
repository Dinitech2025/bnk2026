# 📸 Sliders et Bannières avec Images Multiples

Ce document explique comment utiliser les sliders et bannières de la homepage avec support d'images multiples et diaporamas.

## 📋 Table des Matières

1. [Modèles de Base de Données](#modèles-de-base-de-données)
2. [Scripts d'Initialisation](#scripts-dinitialisation)
3. [Utilisation dans l'Application](#utilisation-dans-lapplication)
4. [Personnalisation](#personnalisation)

---

## 🗃️ Modèles de Base de Données

### HeroSlide & HeroSlideImage

**HeroSlide** : Slide principal de la homepage
- Image principale (`image`)
- Titre et description
- Bouton d'action personnalisable
- Configuration du diaporama (`slideshowEnabled`, `slideshowDuration`, `slideshowTransition`)
- Personnalisation des couleurs
- Relation one-to-many avec `HeroSlideImage`

**HeroSlideImage** : Images supplémentaires pour le diaporama
- URL de l'image
- Titre et description optionnels
- Attribut `alt` pour l'accessibilité
- Ordre d'affichage

### HomeSlider & HomeSliderImage

**HomeSlider** : Slider de la page d'accueil (système existant amélioré)
- Tout comme `HeroSlide` mais avec plus d'options (dates, statistiques)
- Support du diaporama d'images multiples

**HomeSliderImage** : Images pour les HomeSliders

### HeroBanner & HeroBannerImage

**HeroBanner** : Bannière principale (déjà existant)
- Configuration complète du diaporama
- Personnalisation avancée des couleurs et effets

---

## 🚀 Scripts d'Initialisation

### 1. Initialisation Complète de la Homepage

```bash
node scripts/seed-homepage-complete.js
```

Ce script crée :
- ✅ 3 Hero Slides avec personnalisation
- ✅ 9 images pour les slides (3 par slide)
- ✅ 1 Hero Banner
- ✅ 5 images pour la bannière
- ✅ Active les diaporamas avec transition "fade"

### 2. Ajouter des Images aux Hero Slides

```bash
node scripts/seed-hero-slide-images.js
```

Ajoute des images aux Hero Slides existants selon leur thématique :
- Consultation → Images business
- Développement → Images technologie
- Formation → Images éducation
- Maintenance → Images support

### 3. Ajouter des Images aux Home Sliders

```bash
node scripts/seed-home-slider-images.js
```

Détecte automatiquement la thématique et ajoute les images appropriées.

### 4. Ajouter des Images à la Bannière

```bash
node scripts/seed-banner-images.js
```

Ajoute 5 images variées à la bannière principale.

---

## 💻 Utilisation dans l'Application

### Récupérer les Sliders avec leurs Images

```typescript
// Récupérer les Hero Slides
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

// Récupérer les Home Sliders
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

// Récupérer la Bannière
const banner = await prisma.heroBanner.findFirst({
  where: { isActive: true },
  include: {
    backgroundImages: {
      where: { isActive: true },
      orderBy: { order: 'asc' }
    }
  }
})
```

### Composant React pour Afficher le Diaporama

```tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface SlideImage {
  imageUrl: string
  title?: string
  alt?: string
}

interface HeroSlideProps {
  slide: {
    title: string
    description?: string
    image: string
    slideshowEnabled: boolean
    slideshowDuration: number
    slideshowTransition: string
    slideImages: SlideImage[]
  }
}

export function HeroSlideComponent({ slide }: HeroSlideProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const images = slide.slideshowEnabled && slide.slideImages.length > 0 
    ? slide.slideImages 
    : [{ imageUrl: slide.image, alt: slide.title }]

  useEffect(() => {
    if (!slide.slideshowEnabled || images.length <= 1) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }, slide.slideshowDuration)

    return () => clearInterval(interval)
  }, [slide.slideshowEnabled, slide.slideshowDuration, images.length])

  return (
    <div className="relative w-full h-[600px] overflow-hidden">
      {/* Images */}
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={img.imageUrl}
            alt={img.alt || slide.title}
            fill
            className="object-cover"
            priority={index === 0}
          />
        </div>
      ))}

      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black"
        style={{ opacity: slide.overlayOpacity / 100 }}
      />

      {/* Contenu */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <h1 
          className="text-5xl font-bold mb-4"
          style={{ color: slide.titleColor || '#ffffff' }}
        >
          {slide.title}
        </h1>
        {slide.description && (
          <p 
            className="text-xl mb-8"
            style={{ color: slide.descriptionColor || '#f3f4f6' }}
          >
            {slide.description}
          </p>
        )}
      </div>

      {/* Indicateurs */}
      {slide.slideshowEnabled && images.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentImageIndex 
                  ? 'bg-white w-8' 
                  : 'bg-white/50'
              }`}
              aria-label={`Image ${index + 1}`}
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

### Ajouter Manuellement des Images

```typescript
// Ajouter une image à un Hero Slide
await prisma.heroSlideImage.create({
  data: {
    heroSlideId: 'slide-id',
    imageUrl: 'https://example.com/image.jpg',
    title: 'Mon image',
    description: 'Description de l\'image',
    alt: 'Texte alternatif',
    order: 1,
    isActive: true
  }
})

// Ajouter une image à un Home Slider
await prisma.homeSliderImage.create({
  data: {
    homeSliderId: 'slider-id',
    imageUrl: 'https://example.com/image.jpg',
    title: 'Mon image',
    description: 'Description',
    alt: 'Texte alternatif',
    order: 1,
    isActive: true
  }
})
```

### Configurer le Diaporama

```typescript
// Activer le diaporama pour un slide
await prisma.heroSlide.update({
  where: { id: 'slide-id' },
  data: {
    slideshowEnabled: true,
    slideshowDuration: 5000, // 5 secondes
    slideshowTransition: 'fade' // fade, slide, ou zoom
  }
})

// Personnaliser les couleurs
await prisma.heroSlide.update({
  where: { id: 'slide-id' },
  data: {
    titleColor: '#ffffff',
    descriptionColor: '#f3f4f6',
    buttonTextColor: '#ffffff',
    buttonBgColor: '#3b82f6',
    overlayColor: '#000000',
    overlayOpacity: 40 // 0-100
  }
})
```

---

## 📊 Structure des Données

### Exemple de Slide avec Images

```json
{
  "id": "cm1abc123",
  "title": "Découvrez nos Services",
  "description": "Services de qualité professionnelle",
  "image": "https://example.com/main.jpg",
  "slideshowEnabled": true,
  "slideshowDuration": 5000,
  "slideshowTransition": "fade",
  "overlayOpacity": 40,
  "slideImages": [
    {
      "id": "img1",
      "imageUrl": "https://example.com/img1.jpg",
      "title": "Service 1",
      "alt": "Description service 1",
      "order": 1,
      "isActive": true
    },
    {
      "id": "img2",
      "imageUrl": "https://example.com/img2.jpg",
      "title": "Service 2",
      "alt": "Description service 2",
      "order": 2,
      "isActive": true
    }
  ]
}
```

---

## 🔧 Commandes Utiles

```bash
# Générer le client Prisma après modifications du schéma
npx prisma generate

# Pousser les changements vers la base de données
npx prisma db push

# Voir les données dans Prisma Studio
npx prisma studio

# Réinitialiser complètement la homepage
node scripts/seed-homepage-complete.js
```

---

## ✨ Fonctionnalités Clés

- ✅ **Support multi-images** : Chaque slide peut avoir plusieurs images
- ✅ **Diaporama automatique** : Configuration de la durée et transition
- ✅ **Personnalisation complète** : Couleurs, opacité, effets
- ✅ **Images optimisées** : Support Next.js Image avec lazy loading
- ✅ **Accessibilité** : Attributs `alt` et navigation au clavier
- ✅ **Responsive** : Adaptation mobile et desktop
- ✅ **Performance** : Chargement optimisé et transitions fluides

---

## 📝 Notes

- Les images sont hébergées sur Unsplash dans les exemples (changez les URLs en production)
- Le diaporama utilise CSS transitions pour des performances optimales
- Chaque image peut être activée/désactivée individuellement
- L'ordre des images est personnalisable via le champ `order`
- Les transitions disponibles : `fade`, `slide`, `zoom`

---

**Créé pour BoutikNaka** 🎨




