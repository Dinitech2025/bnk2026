#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function testPaymentHistoricalRates() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 TEST DES TAUX HISTORIQUES DANS LES PAIEMENTS');
    console.log('===============================================\n');

    // Récupérer quelques commandes avec paiements pour tester
    const ordersWithPayments = await prisma.order.findMany({
      where: {
        payments: {
          some: {}
        }
      },
      select: {
        id: true,
        orderNumber: true,
        currency: true,
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            originalAmount: true,
            paymentExchangeRate: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 2
        }
      },
      take: 5
    });

    console.log(`📊 COMMANDES AVEC PAIEMENTS : ${ordersWithPayments.length}\n`);

    ordersWithPayments.forEach((order, index) => {
      console.log(`${index + 1}. Commande ${order.orderNumber} (${order.currency})`);
      
      order.payments.forEach((payment, paymentIndex) => {
        const amount = Number(payment.amount);
        const originalAmount = payment.originalAmount ? Number(payment.originalAmount) : null;
        const exchangeRate = payment.paymentExchangeRate ? Number(payment.paymentExchangeRate) : null;
        
        console.log(`   Paiement ${paymentIndex + 1}:`);
        console.log(`     • Montant: ${amount} ${payment.currency}`);
        console.log(`     • Original: ${originalAmount || 'N/A'}`);
        console.log(`     • Taux: ${exchangeRate || 'N/A'}`);
        console.log(`     • Date: ${new Date(payment.createdAt).toLocaleDateString('fr-FR')}`);
        
        // Simuler la conversion comme dans PaymentAmountDisplay
        if (exchangeRate && originalAmount) {
          console.log(`     • Conversion EUR: ${(amount / exchangeRate).toFixed(4)} EUR`);
          console.log(`     • Conversion USD: ${(amount / exchangeRate * 0.000214).toFixed(4)} USD`);
        } else {
          console.log(`     • ⚠️  Données manquantes pour la conversion`);
        }
        console.log('');
      });
    });

    // Vérifier les paiements sans taux de change
    const paymentsWithoutRates = await prisma.payment.count({
      where: {
        OR: [
          { paymentExchangeRate: null },
          { originalAmount: null }
        ]
      }
    });

    console.log('📈 ÉTAT DES DONNÉES :');
    console.log(`   • Paiements sans taux de change : ${paymentsWithoutRates}`);
    
    if (paymentsWithoutRates === 0) {
      console.log('   ✅ Tous les paiements ont des taux historiques !');
    } else {
      console.log('   ⚠️  Certains paiements manquent de données historiques');
    }

    // Vérifier les taux de change utilisés
    const exchangeRateStats = await prisma.payment.groupBy({
      by: ['paymentExchangeRate', 'currency'],
      _count: {
        paymentExchangeRate: true
      },
      where: {
        paymentExchangeRate: {
          not: null
        }
      }
    });

    console.log('\n💱 TAUX DE CHANGE UTILISÉS :');
    exchangeRateStats.forEach(stat => {
      const rate = Number(stat.paymentExchangeRate);
      console.log(`   • ${stat.currency}: ${rate} (${stat._count.paymentExchangeRate} paiements)`);
    });

    console.log('\n🎯 RÉSULTAT ATTENDU :');
    console.log('   • Les paiements dans la page de détail utilisent maintenant leurs taux historiques');
    console.log('   • La conversion se fait selon le taux au moment du paiement');
    console.log('   • Plus de distorsion due aux taux actuels');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentHistoricalRates();
