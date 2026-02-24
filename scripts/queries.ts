import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Créer un utilisateur de test
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'test123',
        role: 'CLIENT',
        name: 'Test User'
      },
    });

    console.log('Utilisateur créé avec succès:', user);

    // Compter le nombre total d'utilisateurs
    const userCount = await prisma.user.count();
    console.log('Nombre total d\'utilisateurs:', userCount);

    // Vérifier la connexion à la base de données
    console.log('✅ Connexion à la base de données réussie !');

  } catch (error) {
    console.error('Erreur lors de l\'exécution des requêtes:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 