const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function main() {
  try {
    // Afficher l'URL de la base de données (en masquant les informations sensibles)
    const dbUrl = process.env.DATABASE_URL || 'Non définie';
    console.log('URL de la base de données :', dbUrl.replace(/:[^:\/]+@/, ':****@'));

    // Tester la connexion
    console.log('Test de la connexion à la base de données...');
    
    // Définition des utilisateurs par défaut
    const defaultUsers = [
      {
        email: 'admin@boutiknaka.com',
        password: 'admin123',
        role: 'ADMIN',
        name: 'Admin User'
      },
      {
        email: 'staff@boutiknaka.com',
        password: 'staff123',
        role: 'STAFF',
        name: 'Staff User'
      },
      {
        email: 'client@example.com',
        password: 'client123',
        role: 'CLIENT',
        name: 'Client User'
      }
    ];

    // Créer ou mettre à jour chaque utilisateur
    for (const userData of defaultUsers) {
      const hashedPassword = await hashPassword(userData.password);
      
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          password: hashedPassword,
          role: userData.role,
          name: userData.name
        },
        create: {
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          name: userData.name,
          preferredLanguage: 'fr'
        }
      });

      console.log(`Utilisateur ${userData.role} créé/mis à jour avec succès:`, {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      });
    }

    // Afficher le nombre total d'utilisateurs
    const userCount = await prisma.user.count();
    console.log('\nNombre total d\'utilisateurs:', userCount);
    console.log('✅ Configuration des utilisateurs terminée !');

  } catch (error) {
    console.error('Erreur détaillée:', error);
    if (error.message.includes('must start with the protocol')) {
      console.error('\nErreur: L\'URL de la base de données doit commencer par postgresql:// ou postgres://');
      console.error('Vérifiez votre fichier .env et assurez-vous que DATABASE_URL est correctement formatée.');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 