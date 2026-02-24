import { prisma } from '@/lib/prisma'

// Images de fallback par catégorie de produit
const FALLBACK_IMAGES_BY_CATEGORY = {
  electronics: [
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=800&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=800&fit=crop&auto=format'
  ],
  fashion: [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=800&fit=crop&auto=format'
  ],
  beauty: [
    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&h=800&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1588405748880-12d1d2a59d32?w=800&h=800&fit=crop&auto=format'
  ],
  home: [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=600&fit=crop&auto=format'
  ],
  sports: [
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&h=600&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&auto=format'
  ],
  default: [
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=800&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=800&fit=crop&auto=format'
  ]
}

// Fonction pour extraire l'ASIN depuis une URL Amazon
export function extractASIN(url: string): string | null {
  if (!url) return null
  
  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/)
  return asinMatch ? asinMatch[1] : null
}

// Fonction pour détecter la catégorie du produit basée sur le nom
export function detectProductCategory(productName: string): keyof typeof FALLBACK_IMAGES_BY_CATEGORY {
  const name = productName.toLowerCase()
  
  if (name.includes('iphone') || name.includes('macbook') || name.includes('airpods') || 
      name.includes('électronique') || name.includes('ordinateur') || name.includes('téléphone')) {
    return 'electronics'
  }
  
  if (name.includes('vêtement') || name.includes('sac') || name.includes('chaussure') || 
      name.includes('mode') || name.includes('textile')) {
    return 'fashion'
  }
  
  if (name.includes('parfum') || name.includes('cosmétique') || name.includes('beauté') || 
      name.includes('crème') || name.includes('maquillage')) {
    return 'beauty'
  }
  
  if (name.includes('maison') || name.includes('cuisine') || name.includes('café') || 
      name.includes('meuble') || name.includes('décoration')) {
    return 'home'
  }
  
  if (name.includes('sport') || name.includes('vélo') || name.includes('fitness') || 
      name.includes('trottinette') || name.includes('exercice')) {
    return 'sports'
  }
  
  return 'default'
}

// Fonction pour obtenir des images de fallback appropriées
export function getFallbackImages(productName: string, count: number = 2): string[] {
  const category = detectProductCategory(productName)
  const images = FALLBACK_IMAGES_BY_CATEGORY[category] || FALLBACK_IMAGES_BY_CATEGORY.default
  
  return images.slice(0, count)
}

// Fonction pour ajouter des images à un produit
export async function addImagesToProduct(
  productId: string, 
  imageUrls: string[], 
  productName: string,
  productSlug: string,
  source: 'amazon' | 'fallback' = 'fallback'
): Promise<boolean> {
  try {
    if (imageUrls.length === 0) return false

    // Supprimer les anciennes images si elles existent
    await prisma.media.deleteMany({
      where: {
        products: {
          some: {
            id: productId
          }
        }
      }
    })

    // Supprimer les anciens attributs d'images
    await prisma.productAttribute.deleteMany({
      where: {
        productId: productId,
        name: {
          startsWith: 'image_'
        }
      }
    })

    // Créer les nouvelles entrées Media
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i]
      const fileName = `${productSlug}-${source}-${i + 1}.jpg`
      
      // Créer l'entrée Media
      await prisma.media.create({
        data: {
          name: `${productName} - Image ${source === 'amazon' ? 'Amazon' : 'Fallback'} ${i + 1}`,
          fileName: fileName,
          mimeType: 'image/jpeg',
          path: url,
          size: 0,
          alt: `${productName} - Image ${i + 1}`,
          products: {
            connect: { id: productId }
          }
        }
      })
      
      // Ajouter aussi comme attribut pour compatibilité
      await prisma.productAttribute.create({
        data: {
          productId: productId,
          name: `image_${i + 1}`,
          value: url
        }
      })
    }

    return true
  } catch (error) {
    console.error('Erreur lors de l\'ajout des images:', error)
    return false
  }
}

// Fonction pour traiter les images lors de la création d'un produit depuis le simulateur
export async function processProductImages(
  productId: string,
  productName: string,
  productSlug: string,
  supplierUrl?: string
): Promise<{ success: boolean; imagesAdded: number; source: string }> {
  try {
    let imageUrls: string[] = []
    let source = 'fallback'

    // Si une URL Amazon est fournie, extraire l'ASIN et l'ajouter comme attribut
    if (supplierUrl) {
      const asin = extractASIN(supplierUrl)
      
      if (asin) {
        // Ajouter l'ASIN comme attribut
        await prisma.productAttribute.create({
          data: {
            productId: productId,
            name: 'asin',
            value: asin
          }
        })

        // Ajouter l'URL Amazon comme attribut
        await prisma.productAttribute.create({
          data: {
            productId: productId,
            name: 'amazon_url',
            value: supplierUrl
          }
        })

        source = 'amazon-ready'
      }
    }

    // Pour l'instant, utiliser toujours des images de fallback
    // (L'intégration avec les vraies images Amazon peut être faite plus tard)
    imageUrls = getFallbackImages(productName, 2)

    // Ajouter les images au produit
    const success = await addImagesToProduct(
      productId, 
      imageUrls, 
      productName, 
      productSlug, 
      source === 'amazon-ready' ? 'amazon' : 'fallback'
    )

    return {
      success,
      imagesAdded: success ? imageUrls.length : 0,
      source: source === 'amazon-ready' ? 'amazon-fallback' : 'fallback'
    }

  } catch (error) {
    console.error('Erreur lors du traitement des images:', error)
    return {
      success: false,
      imagesAdded: 0,
      source: 'error'
    }
  }
} 