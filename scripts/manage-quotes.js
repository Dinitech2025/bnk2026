#!/usr/bin/env node

/**
 * Script de gestion des devis
 * Usage: node scripts/manage-quotes.js [action] [options]
 * 
 * Actions:
 *   create [budget] [weight]  - Créer un devis exemple
 *   cancel [quoteId]          - Annuler un devis
 *   delete [quoteId]          - Supprimer un devis
 *   list                      - Lister tous les devis
 *   test-db                   - Tester la connexion à la base de données
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDatabase() {
  console.log('\n🔍 Test de la connexion à la base de données...\n');
  
  try {
    // Test 1: Connexion basique
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');
    
    // Test 2: Compter les utilisateurs
    const userCount = await prisma.user.count();
    console.log(`✅ Utilisateurs dans la base: ${userCount}`);
    
    // Test 3: Compter les devis
    const quoteCount = await prisma.quote.count();
    console.log(`✅ Devis dans la base: ${quoteCount}`);
    
    // Test 4: Compter les messages
    const messageCount = await prisma.message.count();
    console.log(`✅ Messages dans la base: ${messageCount}`);
    
    // Test 5: Compter les conversations
    const conversationCount = await prisma.conversation.count();
    console.log(`✅ Conversations dans la base: ${conversationCount}`);
    
    console.log('\n✅ Tous les tests de base de données ont réussi!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Erreur de connexion à la base de données:', error.message);
    return false;
  }
}

async function listQuotes() {
  console.log('\n📋 Liste des devis:\n');
  
  try {
    const quotes = await prisma.quote.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        service: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });
    
    if (quotes.length === 0) {
      console.log('Aucun devis trouvé.\n');
      return;
    }
    
    quotes.forEach((quote, index) => {
      console.log(`${index + 1}. ID: ${quote.id}`);
      console.log(`   Client: ${quote.user.name} (${quote.user.email})`);
      console.log(`   Service: ${quote.service.name}`);
      console.log(`   Budget: ${quote.budget ? quote.budget + '€' : 'Non spécifié'}`);
      console.log(`   Statut: ${quote.status}`);
      console.log(`   Messages: ${quote._count.messages}`);
      console.log(`   Créé le: ${quote.createdAt.toLocaleString('fr-FR')}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des devis:', error.message);
  }
}

async function cancelQuote(quoteId) {
  console.log(`\n🚫 Annulation du devis ${quoteId}...\n`);
  
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        service: {
          select: {
            name: true
          }
        }
      }
    });
    
    if (!quote) {
      console.error('❌ Devis non trouvé');
      return;
    }
    
    // Mettre à jour le statut à REJECTED
    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'REJECTED',
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Devis annulé avec succès!');
    console.log(`   Client: ${quote.user.name} (${quote.user.email})`);
    console.log(`   Service: ${quote.service.name}`);
    console.log(`   Nouveau statut: REJECTED\n`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'annulation du devis:', error.message);
  }
}

async function deleteQuote(quoteId) {
  console.log(`\n🗑️  Suppression du devis ${quoteId}...\n`);
  
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        service: {
          select: {
            name: true
          }
        }
      }
    });
    
    if (!quote) {
      console.error('❌ Devis non trouvé');
      return;
    }
    
    // Supprimer les messages associés
    await prisma.quoteMessage.deleteMany({
      where: { quoteId }
    });
    
    // Supprimer le devis
    await prisma.quote.delete({
      where: { id: quoteId }
    });
    
    console.log('✅ Devis supprimé avec succès!');
    console.log(`   Client: ${quote.user.name} (${quote.user.email})`);
    console.log(`   Service: ${quote.service.name}\n`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du devis:', error.message);
  }
}

async function createQuote(budget = 2499, weight = '6kg') {
  console.log(`\n🎯 Création d'un devis exemple : ${budget}€ - ${weight}\n`);
  
  try {
    // 1. Trouver un client de test
    const client = await prisma.user.findFirst({
      where: {
        role: 'CLIENT',
        email: { contains: 'test' }
      }
    });
    
    if (!client) {
      console.error('❌ Aucun client de test trouvé');
      return;
    }
    
    console.log(`✅ Client trouvé: ${client.email}`);
    
    // 2. Trouver un service qui nécessite un devis
    const service = await prisma.service.findFirst({
      where: {
        published: true,
        OR: [
          { requiresQuote: true },
          { pricingType: 'QUOTE_REQUIRED' }
        ]
      }
    });
    
    if (!service) {
      console.error('❌ Aucun service trouvé');
      return;
    }
    
    console.log(`✅ Service trouvé: ${service.name}`);
    
    // 3. Créer le devis
    const quote = await prisma.quote.create({
      data: {
        userId: client.id,
        serviceId: service.id,
        description: `Demande de devis pour ${service.name}. Budget: ${budget}€, Poids: ${weight}`,
        budget: budget,
        status: 'PENDING',
      }
    });
    
    console.log(`✅ Devis créé: ${quote.id}`);
    
    // 4. Créer un message initial
    await prisma.quoteMessage.create({
      data: {
        quoteId: quote.id,
        userId: client.id,
        message: `Bonjour, je souhaite obtenir un devis pour ${service.name}. Mon budget est de ${budget}€ et le poids est de ${weight}.`,
        messageType: 'INITIAL_REQUEST'
      }
    });
    
    console.log('✅ Message initial créé');
    console.log(`\n🎉 Devis créé avec succès!`);
    console.log(`   URL: http://localhost:3000/admin/quotes/${quote.id}\n`);
    
    return quote.id;
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du devis:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const action = args[0];
  
  if (!action) {
    console.log(`
Usage: node scripts/manage-quotes.js [action] [options]

Actions disponibles:
  create [budget] [weight]  - Créer un devis exemple (défaut: 2499€, 6kg)
  cancel [quoteId]          - Annuler un devis
  delete [quoteId]          - Supprimer un devis
  list                      - Lister tous les devis
  test-db                   - Tester la connexion à la base de données
  
Exemples:
  node scripts/manage-quotes.js create
  node scripts/manage-quotes.js create 3500 10kg
  node scripts/manage-quotes.js cancel cmhg00000000000000000000
  node scripts/manage-quotes.js delete cmhg00000000000000000000
  node scripts/manage-quotes.js list
  node scripts/manage-quotes.js test-db
    `);
    process.exit(0);
  }
  
  try {
    switch (action) {
      case 'test-db':
        await testDatabase();
        break;
        
      case 'list':
        await listQuotes();
        break;
        
      case 'create':
        const budget = args[1] ? parseFloat(args[1]) : 2499;
        const weight = args[2] || '6kg';
        await createQuote(budget, weight);
        break;
        
      case 'cancel':
        if (!args[1]) {
          console.error('❌ Veuillez fournir l\'ID du devis à annuler');
          process.exit(1);
        }
        await cancelQuote(args[1]);
        break;
        
      case 'delete':
        if (!args[1]) {
          console.error('❌ Veuillez fournir l\'ID du devis à supprimer');
          process.exit(1);
        }
        await deleteQuote(args[1]);
        break;
        
      default:
        console.error(`❌ Action inconnue: ${action}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();




