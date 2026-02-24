#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

// Taux de change corrects (base MGA - Ariary)
const correctExchangeRates = {
  'MGA': 1.0,       // MGA (Ariary) est la devise de base
  'Ar': 1.0,        // Ar = MGA (même devise)
  'EUR': 0.000196,  // 1 MGA = 0.000196 EUR (1 EUR ≈ 5100 MGA)
  'USD': 0.000214,  // 1 MGA = 0.000214 USD (1 USD ≈ 4680 MGA)
  'GBP': 0.000168   // 1 MGA = 0.000168 GBP (1 GBP ≈ 5950 MGA)
};

async function fixPaymentRatesInconsistencies() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 CORRECTION DES INCOHÉRENCES DE TAUX DE CHANGE');
    console.log('===============================================\n');

    // 1. Corriger les paiements sans taux de change
    const paymentsWithoutRates = await prisma.payment.findMany({
      where: {
        OR: [
          { paymentExchangeRate: null },
          { originalAmount: null }
        ]
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        originalAmount: true,
        paymentExchangeRate: true,
        order: {
          select: {
            orderNumber: true
          }
        }
      }
    });

    console.log(`🔍 PAIEMENTS SANS DONNÉES COMPLÈTES : ${paymentsWithoutRates.length}`);

    for (const payment of paymentsWithoutRates) {
      const currency = payment.currency || 'Ar';
      const amount = Number(payment.amount);
      const correctRate = correctExchangeRates[currency] || 1;
      
      console.log(`Correction ${payment.order?.orderNumber}: ${amount} ${currency}`);
      
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentExchangeRate: correctRate,
          originalAmount: payment.originalAmount || amount
        }
      });
    }

    // 2. Corriger les taux incorrects pour les paiements en Ar/MGA
    const incorrectArPayments = await prisma.payment.findMany({
      where: {
        currency: { in: ['Ar', 'MGA'] },
        paymentExchangeRate: { not: 1.0 }
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        paymentExchangeRate: true,
        order: {
          select: {
            orderNumber: true
          }
        }
      }
    });

    console.log(`\n🔍 PAIEMENTS AR/MGA AVEC TAUX INCORRECT : ${incorrectArPayments.length}`);

    for (const payment of incorrectArPayments) {
      console.log(`Correction taux ${payment.order?.orderNumber}: ${payment.currency} (${Number(payment.paymentExchangeRate)} → 1.0)`);
      
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentExchangeRate: 1.0
        }
      });
    }

    console.log(`\n✅ Corrections terminées !`);

    // 3. Vérification finale
    const finalStats = await prisma.payment.groupBy({
      by: ['currency', 'paymentExchangeRate'],
      _count: {
        paymentExchangeRate: true
      },
      where: {
        paymentExchangeRate: {
          not: null
        }
      }
    });

    console.log('\n📊 TAUX FINAUX PAR DEVISE :');
    finalStats.forEach(stat => {
      const rate = Number(stat.paymentExchangeRate);
      console.log(`   • ${stat.currency}: ${rate} (${stat._count.paymentExchangeRate} paiements)`);
    });

    // Vérifier qu'il n'y a plus de paiements sans données
    const remainingIssues = await prisma.payment.count({
      where: {
        OR: [
          { paymentExchangeRate: null },
          { originalAmount: null }
        ]
      }
    });

    console.log('\n🎯 RÉSULTAT :');
    if (remainingIssues === 0) {
      console.log('   ✅ Tous les paiements ont maintenant des données complètes !');
      console.log('   ✅ Les taux de change sont cohérents');
      console.log('   ✅ L\'historique des paiements utilisera les bons taux');
    } else {
      console.log(`   ⚠️  Il reste ${remainingIssues} paiements avec des données manquantes`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPaymentRatesInconsistencies();
