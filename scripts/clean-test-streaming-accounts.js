const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanTestAccounts() {
  try {
    console.log('🧹 Nettoyage des comptes de streaming de test...');
    
    const testUsernames = [
      'netflix.test@email.com',
      'spotify.premium',
      'disney.family'
    ];
    
    for (const username of testUsernames) {
      // Supprimer les profils associés
      const account = await prisma.account.findFirst({
        where: { username },
        include: { accountProfiles: true }
      });
      
      if (account) {
        // Supprimer les profils
        await prisma.accountProfile.deleteMany({
          where: { accountId: account.id }
        });
        
        // Supprimer le compte
        await prisma.account.delete({
          where: { id: account.id }
        });
        
        console.log(`✅ Supprimé: ${username}`);
      } else {
        console.log(`⚠️ Non trouvé: ${username}`);
      }
    }
    
    console.log('\n🎯 Comptes de test supprimés !');
    console.log('💡 Utilisez ce script pour nettoyer avant le déploiement.');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestAccounts();
