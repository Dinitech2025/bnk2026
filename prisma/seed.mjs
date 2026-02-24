import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Début du seeding...');

  // Suppression des données existantes
  await prisma.user.deleteMany({});
  await prisma.platform.deleteMany({});
  
  // Création des utilisateurs de test
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Utilisateur Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Administrateur',
      email: 'admin@boutiknaka.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Utilisateur admin créé:', admin.email);
  
  // Utilisateur Staff
  const staff = await prisma.user.create({
    data: {
      name: 'Staff',
      email: 'staff@boutiknaka.com',
      password: hashedPassword,
      role: 'STAFF',
    },
  });
  console.log('Utilisateur staff créé:', staff.email);
  
  // Utilisateur Client
  const client = await prisma.user.create({
    data: {
      name: 'Client',
      email: 'client@boutiknaka.com',
      password: hashedPassword,
      role: 'CLIENT',
    },
  });
  console.log('Utilisateur client créé:', client.email);

  // Création des plateformes de streaming
  const netflix = await prisma.platform.create({
    data: {
      name: 'Netflix',
      slug: 'netflix',
      description: 'Service de streaming proposant des films, séries et documentaires en illimité',
      websiteUrl: 'https://www.netflix.com',
      maxProfilesPerAccount: 5,
      isActive: true,
    },
  });
  console.log('Plateforme créée:', netflix.name);

  const disneyPlus = await prisma.platform.create({
    data: {
      name: 'Disney+',
      slug: 'disney-plus',
      description: 'Plateforme de streaming de Disney, Pixar, Marvel, Star Wars et National Geographic',
      websiteUrl: 'https://www.disneyplus.com',
      maxProfilesPerAccount: 7,
      isActive: true,
    },
  });
  console.log('Plateforme créée:', disneyPlus.name);

  const amazonPrime = await prisma.platform.create({
    data: {
      name: 'Amazon Prime Video',
      slug: 'amazon-prime-video',
      description: 'Service de streaming inclus dans l\'abonnement Amazon Prime',
      websiteUrl: 'https://www.primevideo.com',
      maxProfilesPerAccount: 6,
      isActive: true,
    },
  });
  console.log('Plateforme créée:', amazonPrime.name);

  // Seeding du cybercafé
  console.log('Initialisation du cybercafé...');
  
  const ticketTypes = [
    { duration: '30min', price: 500 },
    { duration: '1h', price: 1000 },
    { duration: '2h', price: 2000 },
    { duration: '5h', price: 5000 },
  ];

  for (const ticketType of ticketTypes) {
    await prisma.ticket.create({
      data: {
        duration: ticketType.duration,
        price: ticketType.price,
        stock: 0
      }
    });
  }

  console.log('Types de tickets créés');
  console.log('Seeding terminé!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 