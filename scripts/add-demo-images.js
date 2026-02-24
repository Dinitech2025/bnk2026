const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addDemoImages() {
  try {
    console.log('🖼️ Ajout d\'images de démonstration...');

    // Images de démonstration (URLs d'exemple)
    const demoImages = {
      'smartphone-galaxy-pro': [
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
        'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500'
      ],
      'ordinateur-portable-gaming': [
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500',
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500'
      ],
      'canape-3-places-cuir': [
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500'
      ],
      'cuisine-equipee-sur-mesure': [
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500'
      ],
      'montre-vintage-collection': [
        'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500',
        'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=500'
      ],
      't-shirt-premium-coton-bio': [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
        'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500'
      ],
      'table-basse-design-moderne': [
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500'
      ]
    };

    let totalImagesAdded = 0;

    for (const [productSlug, imageUrls] of Object.entries(demoImages)) {
      // Trouver le produit
      const product = await prisma.product.findUnique({
        where: { slug: productSlug }
      });

      if (!product) {
        console.log(`⚠️ Produit non trouvé: ${productSlug}`);
        continue;
      }

      // Ajouter les images
      for (const imageUrl of imageUrls) {
        try {
          await prisma.media.create({
            data: {
              name: `Image ${product.name}`,
              fileName: `${product.slug}-${Date.now()}.jpg`,
              path: imageUrl,
              type: 'IMAGE',
              mimeType: 'image/jpeg',
              products: {
                connect: { id: product.id }
              }
            }
          });
          totalImagesAdded++;
        } catch (error) {
          console.log(`⚠️ Erreur ajout image pour ${productSlug}:`, error.message);
        }
      }

      console.log(`✅ Images ajoutées pour: ${product.name}`);
    }

    console.log(`\n🎉 ${totalImagesAdded} images de démonstration ajoutées !`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDemoImages();
