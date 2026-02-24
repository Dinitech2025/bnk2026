const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Données des produits par catégorie (prix en Ariary - MGA)
const productsByCategory = {
  'outils': [
    {
      name: 'Marteau 500g',
      description: 'Marteau robuste avec manche en bois, idéal pour tous travaux de bricolage.',
      price: 25000,
      stockQuantity: 50,
      imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&h=500&fit=crop'
    },
    {
      name: 'Tournevis électrique',
      description: 'Tournevis électrique rechargeable avec embouts multiples.',
      price: 180000,
      stockQuantity: 25,
      imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500&h=500&fit=crop'
    },
    {
      name: 'Scie à métaux',
      description: 'Scie à métaux professionnelle avec lame de rechange.',
      price: 45000,
      stockQuantity: 30,
      imageUrl: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500&h=500&fit=crop'
    }
  ],
  'epicerie': [
    {
      name: 'Riz Makalioka 5kg',
      description: 'Riz blanc de qualité supérieure, cultivé localement.',
      price: 15000,
      stockQuantity: 100,
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&h=500&fit=crop'
    },
    {
      name: 'Huile de tournesol 1L',
      description: 'Huile de tournesol pure pour cuisine.',
      price: 8000,
      stockQuantity: 80,
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&h=500&fit=crop'
    },
    {
      name: 'Sucre blanc 1kg',
      description: 'Sucre blanc cristallisé de première qualité.',
      price: 4500,
      stockQuantity: 120,
      imageUrl: 'https://images.unsplash.com/photo-1587736985306-8c1c3c2d0f54?w=500&h=500&fit=crop'
    }
  ],
  'vetements': [
    {
      name: 'T-shirt coton homme',
      description: 'T-shirt 100% coton, confortable et respirant.',
      price: 35000,
      stockQuantity: 60,
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop'
    },
    {
      name: 'Robe traditionnelle femme',
      description: 'Belle robe traditionnelle malgache en coton.',
      price: 85000,
      stockQuantity: 25,
      imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=500&fit=crop'
    },
    {
      name: 'Pantalon jean',
      description: 'Jean classique, coupe droite, très résistant.',
      price: 75000,
      stockQuantity: 40,
      imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=500&fit=crop'
    }
  ],
  'chaussures': [
    {
      name: 'Baskets sport',
      description: 'Baskets confortables pour le sport et les loisirs.',
      price: 120000,
      stockQuantity: 35,
      imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop'
    },
    {
      name: 'Sandales en cuir',
      description: 'Sandales artisanales en cuir véritable.',
      price: 65000,
      stockQuantity: 45,
      imageUrl: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=500&h=500&fit=crop'
    }
  ],
  'ordinateurs': [
    {
      name: 'Ordinateur portable',
      description: 'Laptop 15" avec processeur Intel Core i5, 8GB RAM, 256GB SSD.',
      price: 2500000,
      stockQuantity: 15,
      imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop'
    },
    {
      name: 'Souris sans fil',
      description: 'Souris optique sans fil avec récepteur USB.',
      price: 45000,
      stockQuantity: 50,
      imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop'
    }
  ],
  'sports': [
    {
      name: 'Ballon de football',
      description: 'Ballon de football officiel, taille 5.',
      price: 55000,
      stockQuantity: 30,
      imageUrl: 'https://images.unsplash.com/photo-1614632537190-23e4b3d5e7b4?w=500&h=500&fit=crop'
    },
    {
      name: 'Raquette de tennis',
      description: 'Raquette de tennis professionnelle avec cordage.',
      price: 180000,
      stockQuantity: 20,
      imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=500&fit=crop'
    }
  ],
  'jouets': [
    {
      name: 'Voiture télécommandée',
      description: 'Voiture RC avec télécommande, fonctionne sur batterie.',
      price: 95000,
      stockQuantity: 25,
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop'
    },
    {
      name: 'Poupée traditionnelle',
      description: 'Belle poupée artisanale en costume traditionnel.',
      price: 45000,
      stockQuantity: 35,
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop'
    }
  ],
  'enfants': [
    {
      name: 'Cartable scolaire',
      description: 'Cartable résistant avec compartiments multiples.',
      price: 65000,
      stockQuantity: 40,
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop'
    },
    {
      name: 'Cahier d\'exercices',
      description: 'Lot de 5 cahiers pour l\'école primaire.',
      price: 8000,
      stockQuantity: 100,
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&h=500&fit=crop'
    }
  ],
  'beaute': [
    {
      name: 'Crème hydratante',
      description: 'Crème hydratante pour visage, tous types de peau.',
      price: 35000,
      stockQuantity: 50,
      imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&h=500&fit=crop'
    },
    {
      name: 'Parfum floral',
      description: 'Eau de parfum aux notes florales, 50ml.',
      price: 120000,
      stockQuantity: 25,
      imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=500&fit=crop'
    }
  ],
  'bebe': [
    {
      name: 'Biberon anti-colique',
      description: 'Biberon spécial anti-colique 250ml avec tétine.',
      price: 25000,
      stockQuantity: 45,
      imageUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=500&h=500&fit=crop'
    },
    {
      name: 'Couches taille 3',
      description: 'Paquet de 30 couches ultra-absorbantes.',
      price: 18000,
      stockQuantity: 60,
      imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500&h=500&fit=crop'
    }
  ],
  'sante': [
    {
      name: 'Thermomètre digital',
      description: 'Thermomètre électronique avec affichage LCD.',
      price: 35000,
      stockQuantity: 30,
      imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&h=500&fit=crop'
    },
    {
      name: 'Masques chirurgicaux',
      description: 'Boîte de 50 masques chirurgicaux jetables.',
      price: 15000,
      stockQuantity: 80,
      imageUrl: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=500&h=500&fit=crop'
    }
  ],
  'bijoux': [
    {
      name: 'Collier en argent',
      description: 'Collier artisanal en argent avec pendentif traditionnel.',
      price: 150000,
      stockQuantity: 20,
      imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=500&fit=crop'
    },
    {
      name: 'Bracelet en perles',
      description: 'Bracelet traditionnel en perles colorées.',
      price: 45000,
      stockQuantity: 35,
      imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&h=500&fit=crop'
    }
  ],
  'plein-air': [
    {
      name: 'Tente 2 places',
      description: 'Tente de camping imperméable pour 2 personnes.',
      price: 350000,
      stockQuantity: 15,
      imageUrl: 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=500&h=500&fit=crop'
    },
    {
      name: 'Sac à dos randonnée',
      description: 'Sac à dos 40L avec sangles de compression.',
      price: 180000,
      stockQuantity: 25,
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop'
    }
  ],
  'industrie': [
    {
      name: 'Casque de sécurité',
      description: 'Casque de protection industrielle certifié.',
      price: 85000,
      stockQuantity: 40,
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop'
    },
    {
      name: 'Gants de protection',
      description: 'Paire de gants industriels résistants.',
      price: 25000,
      stockQuantity: 60,
      imageUrl: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500&h=500&fit=crop'
    }
  ]
};

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

async function createProducts() {
  try {
    console.log('🔍 Vérification des catégories...');
    
    // Récupérer les catégories existantes
    const categories = await prisma.productCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    console.log('\n=== CATÉGORIES DISPONIBLES ===');
    categories.forEach(cat => {
      console.log(`ID: ${cat.id} | Nom: ${cat.name} | Slug: ${cat.slug} | Produits existants: ${cat._count.products}`);
    });
    
    if (categories.length === 0) {
      console.log('❌ Aucune catégorie trouvée. Veuillez d\'abord créer des catégories.');
      return;
    }
    
    console.log('\n🚀 Création des produits (prix en Ariary - MGA)...');
    
    let totalCreated = 0;
    
    for (const category of categories) {
      // Nettoyer le slug pour correspondre aux clés de notre objet
      const cleanSlug = category.slug.replace(/-\d+$/, ''); // Enlever les suffixes numériques
      const categoryProducts = productsByCategory[cleanSlug] || [];
      
      if (categoryProducts.length === 0) {
        console.log(`⚠️  Pas de produits définis pour la catégorie: ${category.name} (slug: ${cleanSlug})`);
        continue;
      }
      
      console.log(`\n📦 Création de ${categoryProducts.length} produits pour "${category.name}":`);
      
      for (const productData of categoryProducts) {
        try {
          // Vérifier si le produit existe déjà
          const existingProduct = await prisma.product.findFirst({
            where: {
              name: productData.name,
              categoryId: category.id
            }
          });
          
          if (existingProduct) {
            console.log(`   ⏭️  "${productData.name}" existe déjà`);
            continue;
          }
          
          const product = await prisma.product.create({
            data: {
              name: productData.name,
              slug: generateSlug(productData.name),
              description: productData.description,
              price: productData.price,
              inventory: productData.stockQuantity,
              published: true,
              categoryId: category.id
            },
            include: {
              images: true
            }
          });
          
          // Ajouter l'image si elle n'existe pas déjà
          if (productData.imageUrl) {
            await prisma.media.create({
              data: {
                url: productData.imageUrl,
                type: 'IMAGE',
                productId: product.id
              }
            });
          }
          
          console.log(`   ✅ Créé: "${product.name}" - ${product.price.toLocaleString()} Ar`);
          totalCreated++;
          
        } catch (error) {
          console.error(`   ❌ Erreur lors de la création de "${productData.name}":`, error.message);
        }
      }
    }
    
    console.log(`\n🎉 Création terminée! ${totalCreated} produits créés au total.`);
    
    // Afficher le résumé final
    console.log('\n=== RÉSUMÉ FINAL ===');
    const finalCategories = await prisma.productCategory.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    finalCategories.forEach(cat => {
      console.log(`${cat.name}: ${cat._count.products} produits`);
    });
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createProducts(); 