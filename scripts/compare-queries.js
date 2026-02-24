const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function compareQueries() {
  console.log('🔍 COMPARAISON DES REQUÊTES');
  console.log('===========================');
  
  try {
    // 1. Notre requête de test (qui fonctionne)
    console.log('1️⃣ NOTRE REQUÊTE DE TEST (qui fonctionne):');
    const testOrders = await prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        orderNumber: true,
        email: true,
        status: true,
        paymentStatus: true,
        total: true,
        currency: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    console.log(`   📊 Total: ${testOrders.length} commandes`);
    testOrders.slice(0, 5).forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.orderNumber} (${order.status}/${order.paymentStatus})`);
    });
    console.log('');

    // 2. Requête exacte de getOrders() (comme dans page.tsx)
    console.log('2️⃣ REQUÊTE EXACTE DE getOrders() (page.tsx):');
    const page = 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    const [adminOrders, totalCount] = await Promise.all([
      prisma.order.findMany({
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            include: {
              offer: {
                select: {
                  id: true,
                  name: true,
                },
              },
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
              service: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          payments: {
            where: {
              status: 'COMPLETED'
            },
            select: {
              id: true,
              amount: true,
              currency: true,
              method: true,
              provider: true,
              createdAt: true
            }
          },
          billingAddress: true,
          shippingAddress: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.order.count()
    ]);

    console.log(`   📊 Total: ${adminOrders.length} commandes récupérées sur ${totalCount} total`);
    adminOrders.slice(0, 5).forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.orderNumber} (${order.status}/${order.paymentStatus})`);
    });
    console.log('');

    // 3. Analyse des différences
    console.log('3️⃣ ANALYSE DES DIFFÉRENCES:');
    
    const testOrderNumbers = new Set(testOrders.map(o => o.orderNumber));
    const adminOrderNumbers = new Set(adminOrders.map(o => o.orderNumber));
    
    const missingInAdmin = testOrders.filter(o => !adminOrderNumbers.has(o.orderNumber));
    const missingInTest = adminOrders.filter(o => !testOrderNumbers.has(o.orderNumber));
    
    if (missingInAdmin.length > 0) {
      console.log(`   ❌ Commandes manquantes dans getOrders(): ${missingInAdmin.length}`);
      missingInAdmin.forEach(order => {
        console.log(`      • ${order.orderNumber} (${order.status}/${order.paymentStatus})`);
      });
    }
    
    if (missingInTest.length > 0) {
      console.log(`   ❌ Commandes manquantes dans test: ${missingInTest.length}`);
      missingInTest.forEach(order => {
        console.log(`      • ${order.orderNumber} (${order.status}/${order.paymentStatus})`);
      });
    }
    
    if (missingInAdmin.length === 0 && missingInTest.length === 0) {
      console.log('   ✅ Aucune différence trouvée - les requêtes retournent les mêmes commandes');
    }

    // 4. Vérification spécifique des commandes de test
    console.log('');
    console.log('4️⃣ VÉRIFICATION DES COMMANDES DE TEST:');
    const testOrdersInDb = await prisma.order.findMany({
      where: {
        orderNumber: {
          startsWith: 'BN-'
        }
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`   📦 Commandes BN-* trouvées en base: ${testOrdersInDb.length}`);
    testOrdersInDb.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.orderNumber}`);
      console.log(`      Status: ${order.status}/${order.paymentStatus}`);
      console.log(`      User: ${order.user?.email}`);
      console.log(`      Créé: ${order.createdAt}`);
      
      // Vérifier si elle est dans les résultats admin
      const inAdmin = adminOrders.find(a => a.id === order.id);
      console.log(`      Dans getOrders(): ${inAdmin ? '✅' : '❌'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

compareQueries();

