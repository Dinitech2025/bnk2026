import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSettings() {
  try {
    // Vérifier les paramètres de devise
    const currencySettings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['currency', 'currencySymbol', 'exchangeRates', 'baseCurrency'],
        },
      },
    });

    console.log('Paramètres de devise trouvés:', currencySettings.length);
    currencySettings.forEach(setting => {
      console.log(`- ${setting.key}: ${setting.value}`);
    });

    // Vérifier le nombre total de paramètres
    const totalSettings = await prisma.setting.count();
    console.log(`Nombre total de paramètres dans la base: ${totalSettings}`);

    // Vérifier les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true
      }
    });
    
    console.log('Utilisateurs trouvés:', users.length);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });

  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSettings(); 
 
 
 