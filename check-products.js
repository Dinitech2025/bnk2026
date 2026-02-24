// Script pour vérifier les produits dans la base de données
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProducts() {
  try {
    console.log('Checking products in database...');
    
    // Compter tous les produits
    const totalProducts = await prisma.product.count();
    console.log('Total products in database:', totalProducts);
    
    // Compter les produits non-importés
    const nonImportedProducts = await prisma.product.count({
      where: {
        NOT: {
          category: {
            name: 'Produits importés'
          }
        }
      }
    });
    console.log('Non-imported products:', nonImportedProducts);
    
    // Récupérer quelques produits pour voir leur structure
    const sampleProducts = await prisma.product.findMany({
      take: 3,
      include: {
        category: true,
        images: true
      }
    });
    
    console.log('Sample products:');
    sampleProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (Category: ${product.category?.name || 'None'})`);
    });
    
    // Vérifier les catégories
    const categories = await prisma.category.findMany();
    console.log('Categories:', categories.map(c => c.name));
    
  } catch (error) {
    console.error('Error checking products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts(); 