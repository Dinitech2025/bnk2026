const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedProductsWithImages() {
  console.log('🛍️ Ajout de produits avec images...')

  // D'abord, créer quelques catégories de produits si elles n'existent pas
  const categories = [
    {
      name: 'Électronique',
      slug: 'electronique',
      description: 'Appareils électroniques et gadgets',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    },
    {
      name: 'Mode & Vêtements',
      slug: 'mode-vetements',
      description: 'Vêtements et accessoires de mode',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    },
    {
      name: 'Maison & Jardin',
      slug: 'maison-jardin',
      description: 'Articles pour la maison et le jardin',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    }
  ]

  for (const category of categories) {
    await prisma.productCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category
    })
    console.log(`✅ Catégorie "${category.name}" créée`)
  }

  // Récupérer les catégories créées
  const electronique = await prisma.productCategory.findUnique({ where: { slug: 'electronique' } })
  const mode = await prisma.productCategory.findUnique({ where: { slug: 'mode-vetements' } })
  const maison = await prisma.productCategory.findUnique({ where: { slug: 'maison-jardin' } })

  const products = [
    // Électronique
    {
      name: 'iPhone 15 Pro Max',
      slug: 'iphone-15-pro-max',
      description: 'Le dernier smartphone d\'Apple avec appareil photo professionnel et puce A17 Pro',
      price: 5849955, // ~1300 EUR en Ariary
      // stock: 25,
      inventory: 25,
      categoryId: electronique.id,
      images: [
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ]
    },
    {
      name: 'MacBook Air M3',
      slug: 'macbook-air-m3',
      description: 'Ordinateur portable ultra-fin avec puce M3 et écran Liquid Retina 13 pouces',
      price: 6749955, // ~1500 EUR en Ariary
      // stock: 15,
      inventory: 15,
      categoryId: electronique.id,
      images: [
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ]
    },
    {
      name: 'AirPods Pro 2',
      slug: 'airpods-pro-2',
      description: 'Écouteurs sans fil avec réduction de bruit active et audio spatial',
      price: 1124955, // ~250 EUR en Ariary
      // stock: 50,
      inventory: 50,
      categoryId: electronique.id,
      images: [
        'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ]
    },
    
    // Mode & Vêtements
    {
      name: 'Veste en Jean Premium',
      slug: 'veste-jean-premium',
      description: 'Veste en jean de qualité supérieure, coupe moderne et confortable',
      price: 404955, // ~90 EUR en Ariary
      // stock: 30,
      inventory: 30,
      categoryId: mode.id,
      images: [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ]
    },
    {
      name: 'Sneakers Sport Edition',
      slug: 'sneakers-sport-edition',
      description: 'Baskets sportives haute performance pour le running et la marche',
      price: 584955, // ~130 EUR en Ariary
      // stock: 40,
      inventory: 40,
      categoryId: mode.id,
      images: [
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ]
    },
    {
      name: 'Montre Connectée Elite',
      slug: 'montre-connectee-elite',
      description: 'Montre intelligente avec suivi de santé, GPS et résistance à l\'eau',
      price: 1349955, // ~300 EUR en Ariary
      // stock: 20,
      inventory: 20,
      categoryId: mode.id,
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1434493907317-a46b5bbe7834?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ]
    },

    // Maison & Jardin
    {
      name: 'Plante Monstera Deliciosa',
      slug: 'plante-monstera-deliciosa',
      description: 'Belle plante d\'intérieur tropicale, parfaite pour décorer votre salon',
      price: 224955, // ~50 EUR en Ariary
      // stock: 35,
      inventory: 35,
      categoryId: maison.id,
      images: [
        'https://images.unsplash.com/photo-1545241047-6083a3684587?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ]
    },
    {
      name: 'Lampe de Bureau LED',
      slug: 'lampe-bureau-led',
      description: 'Lampe de bureau moderne avec éclairage LED réglable et port USB',
      price: 359955, // ~80 EUR en Ariary
      // stock: 25,
      inventory: 25,
      categoryId: maison.id,
      images: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ]
    }
  ]

  for (const productData of products) {
    // Vérifier si le produit existe déjà
    const existingProduct = await prisma.product.findUnique({
      where: { slug: productData.slug }
    })

    if (!existingProduct) {
      const { images, ...productInfo } = productData
      
      // Créer le produit
      const product = await prisma.product.create({
        data: productInfo
      })

      // Ajouter les images en tant que Media
      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i]
        const fileName = `${product.slug}-${i + 1}.jpg`
        await prisma.media.create({
          data: {
            name: `${product.name} - Image ${i + 1}`,
            fileName: fileName,
            mimeType: 'image/jpeg',
            path: imageUrl,
            size: 1024000, // Taille approximative

            type: 'IMAGE',
            products: {
              connect: { id: product.id }
            }
          }
        })
      }

      console.log(`✅ Produit "${product.name}" créé avec ${images.length} images`)
    } else {
      console.log(`ℹ️ Produit "${productData.name}" existe déjà`)
    }
  }

  console.log('🎉 Produits avec images ajoutés avec succès!')
}

seedProductsWithImages()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
