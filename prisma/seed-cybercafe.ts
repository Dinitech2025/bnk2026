import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Début du seeding cybercafé...');

  // Créer les types de tickets
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
  console.log('Seeding cybercafé terminé!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
 