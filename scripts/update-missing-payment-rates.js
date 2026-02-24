#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

// Taux de change actuels (base MGA - Ariary)
const currentExchangeRates = {
  'MGA': 1.0,       // MGA (Ariary) est la devise de base
  'Ar': 1.0,        // Ar = MGA
  'EUR': 0.000196,  // 1 MGA = 0.000196 EUR (1 EUR ≈ 5100 MGA)
  'USD': 0.000214,  // 1 MGA = 0.000214 USD (1 USD ≈ 4680 MGA)
  'GBP': 0.000168   // 1 MGA = 0.000168 GBP (1 GBP ≈ 5950 MGA)
};

async function updateMissingPaymentRates() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 MISE À JOUR DES TAUX DE CHANGE MANQUANTS');
    console.log('==========================================\n');

    // Trouver tous les paiements sans taux de change
    const paymentsWithoutRates = await prisma.payment.findMany({
      where: {
        OR: [
          { paymentExchangeRate: null },
          { paymentExchangeRate: { equals: null } }
        ]
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        originalAmount: true,
        paymentExchangeRate: true,
        createdAt: true,
        order: {
          select: {
            orderNumber: true
          }
        }
      }
    });

    console.log(`📊 PAIEMENTS SANS TAUX TROUVÉS : ${paymentsWithoutRates.length}\n`);

    if (paymentsWithoutRates.length === 0) {
      console.log('✅ Tous les paiements ont déjà un taux de change enregistré.');
      return;
    }

    // Analyser les paiements par devise
    const paymentsByCurrency = {};
    paymentsWithoutRates.forEach(payment => {
      const currency = payment.currency || 'Ar';
      if (!paymentsByCurrency[currency]) {
        paymentsByCurrency[currency] = [];
      }
      paymentsByCurrency[currency].push(payment);
    });

    console.log('📈 RÉPARTITION PAR DEVISE :');
    Object.entries(paymentsByCurrency).forEach(([currency, payments]) => {
      console.log(`   • ${currency}: ${payments.length} paiements`);
    });
    console.log('');

    // Mettre à jour chaque paiement
    let updatedCount = 0;
    
    for (const payment of paymentsWithoutRates) {
      const currency = payment.currency || 'Ar';
      const amount = Number(payment.amount);
      
      // Déterminer le taux de change à utiliser
      let exchangeRate = currentExchangeRates[currency] || 1;
      let originalAmount = payment.originalAmount ? Number(payment.originalAmount) : amount;
      
      // Si pas d'originalAmount, le calculer selon la devise
      if (!payment.originalAmount) {
        if (currency === 'MGA' || currency === 'Ar') {
          originalAmount = amount;
        } else {
          // Pour les autres devises, l'originalAmount est le montant dans cette devise
          originalAmount = amount;
        }
      }

      console.log(`Mise à jour ${payment.order?.orderNumber || payment.id.substring(0, 8)}: ${amount} ${currency}`);
      console.log(`   Taux: ${exchangeRate}, Original: ${originalAmount}`);

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentExchangeRate: exchangeRate,
          originalAmount: originalAmount
        }
      });

      updatedCount++;
    }

    console.log(`\n✅ ${updatedCount} paiements mis à jour avec succès !\n`);

    // Vérifier le résultat
    const remainingPayments = await prisma.payment.count({
      where: {
        OR: [
          { paymentExchangeRate: null },
          { paymentExchangeRate: { equals: null } }
        ]
      }
    });

    console.log('📊 RÉSULTAT :');
    console.log(`   • Paiements mis à jour : ${updatedCount}`);
    console.log(`   • Paiements restants sans taux : ${remainingPayments}`);
    console.log('');

    if (remainingPayments === 0) {
      console.log('🎯 SUCCÈS : Tous les paiements ont maintenant un taux de change !');
    } else {
      console.log('⚠️  Il reste encore des paiements sans taux de change.');
    }

    console.log('');
    console.log('💡 TAUX UTILISÉS :');
    Object.entries(currentExchangeRates).forEach(([currency, rate]) => {
      console.log(`   • 1 MGA = ${rate} ${currency}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateMissingPaymentRates();
