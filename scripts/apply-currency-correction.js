#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function applyCurrencyCorrection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 APPLICATION DE LA CORRECTION DES DEVISES');
    console.log('==========================================\n');

    // Identifier les paiements avec des montants suspects en EUR
    const suspiciousPayments = await prisma.payment.findMany({
      where: {
        currency: 'EUR',
        amount: {
          gt: 100000 // Plus de 100,000 EUR semble suspect
        }
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        originalAmount: true,
        order: {
          select: {
            orderNumber: true
          }
        }
      }
    });

    console.log(`🎯 PAIEMENTS À CORRIGER : ${suspiciousPayments.length}\n`);

    if (suspiciousPayments.length === 0) {
      console.log('✅ Aucun paiement à corriger.');
      return;
    }

    // Appliquer la correction
    let correctedCount = 0;
    
    for (const payment of suspiciousPayments) {
      console.log(`Correction ${payment.order?.orderNumber}: ${Number(payment.amount).toLocaleString()} EUR → MGA`);
      
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          currency: 'MGA',
          // Le montant reste le même, seule la devise change
          // originalAmount reste inchangé si il existe déjà
        }
      });
      
      correctedCount++;
    }

    console.log(`\n✅ ${correctedCount} paiements corrigés avec succès !\n`);

    // Vérifier le nouveau CA
    const allPayments = await prisma.payment.findMany({
      where: {
        status: {
          in: ['COMPLETED', 'PAID', 'completed']
        }
      },
      select: {
        amount: true,
        currency: true,
        originalAmount: true
      }
    });

    let totalRevenueAr = 0;
    let totalRevenueUSD = 0;
    let totalRevenueEUR = 0;

    allPayments.forEach(payment => {
      const paymentAmount = Number(payment.amount);
      const paymentCurrency = payment.currency || 'Ar';
      const originalAmount = payment.originalAmount ? Number(payment.originalAmount) : paymentAmount;

      if (paymentCurrency === 'Ar' || paymentCurrency === 'MGA') {
        totalRevenueAr += paymentAmount;
      } else if (paymentCurrency === 'USD') {
        totalRevenueUSD += originalAmount;
      } else if (paymentCurrency === 'EUR') {
        totalRevenueEUR += originalAmount;
      }
    });

    console.log('📊 NOUVEAU CHIFFRE D\'AFFAIRES :');
    console.log(`   • Ariary: ${totalRevenueAr.toLocaleString()} Ar = ${(totalRevenueAr / 1000000).toFixed(1)}M Ar`);
    console.log(`   • USD: ${totalRevenueUSD.toLocaleString()} USD`);
    console.log(`   • EUR: ${totalRevenueEUR.toLocaleString()} EUR`);
    console.log('');

    console.log('🎯 RÉSULTAT ATTENDU DANS L\'INTERFACE :');
    console.log(`   • CA Total: ${(totalRevenueAr / 1000000).toFixed(1)}M Ar (au lieu de 116M+)`);
    console.log('   • Les conversions EUR seront maintenant correctes');
    console.log('   • Plus de montants aberrants en millions d\'euros');
    console.log('');

    console.log('✨ Correction terminée ! Actualisez la page pour voir les changements.');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyCurrencyCorrection();
