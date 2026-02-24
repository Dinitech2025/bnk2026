#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function fixIncorrectAmounts() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 CORRECTION DES MONTANTS INCORRECTS');
    console.log('====================================\n');

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
        paymentExchangeRate: true,
        order: {
          select: {
            orderNumber: true,
            total: true
          }
        }
      }
    });

    console.log(`🔍 PAIEMENTS SUSPECTS TROUVÉS : ${suspiciousPayments.length}\n`);

    if (suspiciousPayments.length === 0) {
      console.log('✅ Aucun paiement suspect trouvé.');
      return;
    }

    suspiciousPayments.forEach((payment, index) => {
      console.log(`${index + 1}. Paiement ID: ${payment.id}`);
      console.log(`   Commande: ${payment.order?.orderNumber}`);
      console.log(`   Montant: ${Number(payment.amount).toLocaleString()} EUR`);
      console.log(`   Original: ${payment.originalAmount ? Number(payment.originalAmount).toLocaleString() : 'N/A'}`);
      console.log(`   Taux: ${payment.paymentExchangeRate || 'N/A'}`);
      console.log('');
    });

    console.log('🎯 STRATÉGIE DE CORRECTION :');
    console.log('   Option 1: Convertir les montants EUR suspects en MGA');
    console.log('   Option 2: Marquer ces paiements comme invalides');
    console.log('   Option 3: Corriger manuellement les montants');
    console.log('');

    // Proposition de correction automatique
    console.log('💡 CORRECTION AUTOMATIQUE PROPOSÉE :');
    console.log('   Pour les montants > 100,000 EUR :');
    console.log('   • Supposer que ce sont des montants en Ariary mal étiquetés');
    console.log('   • Changer la devise de EUR vers MGA');
    console.log('   • Garder le même montant numérique');
    console.log('');

    // Simulation de la correction
    let totalBeforeEUR = 0;
    let totalAfterEUR = 0;
    
    suspiciousPayments.forEach(payment => {
      const amount = Number(payment.amount);
      totalBeforeEUR += amount;
      
      // Si on convertit en MGA, le montant reste le même mais en Ariary
      console.log(`   ${payment.order?.orderNumber}: ${amount.toLocaleString()} EUR → ${amount.toLocaleString()} Ar`);
    });

    console.log('');
    console.log('📊 IMPACT SUR LE CA :');
    console.log(`   Avant correction: ${totalBeforeEUR.toLocaleString()} EUR = ${(totalBeforeEUR / 1000000).toFixed(1)}M EUR`);
    console.log(`   Après correction: ${totalBeforeEUR.toLocaleString()} Ar = ${(totalBeforeEUR / 1000000).toFixed(1)}M Ar`);
    console.log('');

    // Calculer le nouveau CA total
    const normalPayments = await prisma.payment.findMany({
      where: {
        status: { in: ['COMPLETED', 'PAID'] },
        OR: [
          { currency: { not: 'EUR' } },
          { 
            currency: 'EUR',
            amount: { lte: 100000 }
          }
        ]
      },
      select: {
        amount: true,
        currency: true
      }
    });

    let newTotalAr = 0;
    normalPayments.forEach(payment => {
      if (payment.currency === 'Ar' || payment.currency === 'MGA') {
        newTotalAr += Number(payment.amount);
      }
    });

    // Ajouter les montants corrigés
    newTotalAr += totalBeforeEUR;

    console.log('🎯 NOUVEAU CA ESTIMÉ :');
    console.log(`   Total en Ariary: ${newTotalAr.toLocaleString()} Ar = ${(newTotalAr / 1000000).toFixed(1)}M Ar`);
    console.log('');

    console.log('⚠️  ATTENTION :');
    console.log('   Cette correction est basée sur une supposition.');
    console.log('   Vérifiez manuellement ces paiements avant d\'appliquer.');
    console.log('');

    console.log('🔧 POUR APPLIQUER LA CORRECTION :');
    console.log('   Décommentez le code de mise à jour ci-dessous');

    // Code de correction (commenté pour sécurité)
    /*
    for (const payment of suspiciousPayments) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          currency: 'MGA',
          // Garder le même montant mais changer la devise
        }
      });
    }
    console.log(`✅ ${suspiciousPayments.length} paiements corrigés.`);
    */

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixIncorrectAmounts();
