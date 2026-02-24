const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanTestUsers() {
  try {
    console.log('🧹 Nettoyage des utilisateurs de test...');
    
    const testEmails = [
      'admin@test.com',
      'staff@test.com', 
      'client@test.com'
    ];
    
    for (const email of testEmails) {
      const deleted = await prisma.user.deleteMany({
        where: { email }
      });
      
      if (deleted.count > 0) {
        console.log(`✅ Supprimé: ${email}`);
      } else {
        console.log(`⚠️ Non trouvé: ${email}`);
      }
    }
    
    console.log('');
    console.log('🎯 Utilisateurs de test supprimés !');
    console.log('💡 Utilisez ce script avant le déploiement en production.');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestUsers();
