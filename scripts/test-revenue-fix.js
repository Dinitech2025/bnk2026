#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function testRevenueFix() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 TEST DE LA CORRECTION DU CHIFFRE D\'AFFAIRES');
    console.log('==============================================\n');

    // Simuler le calcul comme dans le code corrigé
    const allPayments = await prisma.payment.findMany({
      where: {
        status: {
          in: ['COMPLETED', 'PAID', 'completed']
        }
      },
      select: {
        amount: true,
        currency: true,
        paymentExchangeRate: true,
        originalAmount: true,
        status: true,
        createdAt: true
      }
    });

    console.log(`📊 PAIEMENTS TROUVÉS : ${allPayments.length}`);
    console.log('');

    let totalRevenue = 0;
    let totalRevenueUSD = 0;
    let totalRevenueEUR = 0;
    let totalPaidAmount = 0;

    console.log('💰 CALCUL DU CA :');
    allPayments.forEach((payment, index) => {
      const paymentAmount = Number(payment.amount);
      const paymentCurrency = payment.currency || 'Ar';
      const paymentRate = payment.paymentExchangeRate ? Number(payment.paymentExchangeRate) : 1;
      const originalAmount = payment.originalAmount ? Number(payment.originalAmount) : paymentAmount;

      console.log(`   ${index + 1}. ${paymentAmount} ${paymentCurrency} (${payment.status})`);

      // Ajouter au total des paiements (en Ariary)
      if (paymentCurrency === 'Ar' || paymentCurrency === 'MGA') {
        totalRevenue += paymentAmount;
        totalPaidAmount += paymentAmount;
        console.log(`      → +${paymentAmount} Ar`);
      } else {
        const revenueInAr = originalAmount * paymentRate;
        totalRevenue += revenueInAr;
        totalPaidAmount += revenueInAr;
        console.log(`      → +${revenueInAr} Ar (${originalAmount} × ${paymentRate})`);
        
        if (paymentCurrency === 'USD') {
          totalRevenueUSD += originalAmount;
        } else if (paymentCurrency === 'EUR') {
          totalRevenueEUR += originalAmount;
        }
      }
    });

    console.log('');
    console.log('📈 RÉSULTATS :');
    console.log(`   • CA Total : ${Math.round(totalRevenue)} Ar`);
    console.log(`   • CA USD : ${totalRevenueUSD.toFixed(2)} USD`);
    console.log(`   • CA EUR : ${totalRevenueEUR.toFixed(2)} EUR`);
    console.log('');
    console.log('🎯 AFFICHAGE FORMATÉ :');
    console.log(`   • CA Total : ${totalRevenue >= 1000000 ? `${(totalRevenue / 1000000).toFixed(1)}M` : `${Math.round(totalRevenue / 1000)}K`} Ar`);
    
    if (totalRevenue > 0) {
      console.log('');
      console.log('✅ SUCCESS ! Le chiffre d\'affaires devrait maintenant s\'afficher correctement.');
    } else {
      console.log('');
      console.log('❌ Le CA est toujours à 0. Vérifiez les statuts de paiement.');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRevenueFix();
