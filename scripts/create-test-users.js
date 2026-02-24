const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🔍 Création des utilisateurs de test...');
    
    const testUsers = [
      {
        email: 'admin@test.com',
        password: 'test123',
        firstName: 'Admin',
        lastName: 'Test',
        role: 'ADMIN'
      },
      {
        email: 'staff@test.com',
        password: 'test123',
        firstName: 'Staff',
        lastName: 'Test',
        role: 'STAFF'
      },
      {
        email: 'client@test.com',
        password: 'test123',
        firstName: 'Client',
        lastName: 'Test',
        role: 'CLIENT'
      }
    ];

    for (const userData of testUsers) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`✅ Utilisateur ${userData.email} existe déjà`);
        continue;
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          emailVerified: new Date() // Marquer comme vérifié pour les tests
        }
      });

      console.log(`✅ Utilisateur créé: ${user.email} (${user.role})`);
    }

    console.log('🎉 Tous les utilisateurs de test sont prêts !');
    
    console.log('\n📋 Identifiants de test:');
    console.log('Admin: admin@test.com / test123');
    console.log('Staff: staff@test.com / test123');
    console.log('Client: client@test.com / test123');

  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();