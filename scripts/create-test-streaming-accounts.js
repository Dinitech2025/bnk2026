const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestAccounts() {
  try {
    console.log('🎬 Création de comptes de streaming de test...');
    
    // Récupérer les plateformes
    const platforms = await prisma.platform.findMany({
      select: { id: true, name: true, hasProfiles: true, maxProfilesPerAccount: true }
    });
    
    const testAccounts = [
      {
        username: 'netflix.test@email.com',
        email: 'netflix.test@email.com',
        password: 'TestPassword123',
        platformName: 'Netflix'
      },
      {
        username: 'spotify.premium',
        email: 'spotify.test@email.com', 
        password: 'TestPassword123',
        platformName: 'Spotify'
      },
      {
        username: 'disney.family',
        email: 'disney.test@email.com',
        password: 'TestPassword123', 
        platformName: 'Disney+'
      }
    ];
    
    for (const accountData of testAccounts) {
      const platform = platforms.find(p => p.name === accountData.platformName);
      if (!platform) {
        console.log(`⚠️ Plateforme ${accountData.platformName} non trouvée`);
        continue;
      }
      
      // Vérifier si le compte existe déjà
      const existingAccount = await prisma.account.findFirst({
        where: {
          username: accountData.username,
          platformId: platform.id
        }
      });
      
      if (existingAccount) {
        console.log(`⚠️ Compte ${accountData.username} existe déjà`);
        continue;
      }
      
      // Créer le compte
      const account = await prisma.account.create({
        data: {
          username: accountData.username,
          email: accountData.email,
          password: accountData.password,
          status: 'ACTIVE',
          availability: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
          platformId: platform.id
        }
      });
      
      // Créer les profils si la plateforme les supporte
      if (platform.hasProfiles) {
        const maxProfiles = platform.maxProfilesPerAccount || 1;
        const profiles = [];
        for (let i = 0; i < maxProfiles; i++) {
          profiles.push({
            accountId: account.id,
            profileSlot: i + 1,
            name: i === 0 ? 'Principal' : `Profil ${i + 1}`,
            isAssigned: false
          });
        }
        
        await prisma.accountProfile.createMany({
          data: profiles
        });
      }
      
      console.log(`✅ Compte créé: ${accountData.username} (${accountData.platformName})`);
    }
    
    console.log('\n🎉 Comptes de test créés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAccounts();
