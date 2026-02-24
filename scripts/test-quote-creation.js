const { PrismaClient } = require('@prisma/client');

async function testQuoteCreation() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Test de création d\'un devis...');
    
    // Vérifier qu'un utilisateur existe
    const user = await prisma.user.findFirst({
      where: { email: 'client@test.com' }
    });
    
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé');
      return;
    }
    
    console.log('✅ Utilisateur trouvé:', user.id);
    
    // Créer un produit de test négociable
    const product = await prisma.product.create({
      data: {
        name: 'Produit Test Négociable',
        slug: 'produit-test-negociable',
        description: 'Produit pour tester les négociations',
        price: 100000,
        sku: 'TEST-NEG-001',
        inventory: 10,
        pricingType: 'NEGOTIABLE',
        published: true
      }
    });
    
    console.log('✅ Produit négociable créé:', product.id, product.name);
    
    // Tenter de créer un devis de test
    const quote = await prisma.quote.create({
      data: {
        userId: user.id,
        productId: product.id,
        proposedPrice: 50000,
        description: 'Test de proposition de prix',
        status: 'PENDING',
        negotiationType: 'PRODUCT_PRICE'
      }
    });
    
    console.log('✅ Devis créé avec succès:', quote.id);
    
    console.log('✅ Test terminé avec succès - L\'API devrait maintenant fonctionner');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testQuoteCreation();



