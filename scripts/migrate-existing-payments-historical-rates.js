#!/usr/bin/env node

/**
 * Script de migration : Ajouter les taux historiques aux paiements existants
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Taux de change par défaut (actuels)
const defaultExchangeRates = {
  'MGA': 1.0,
  'Ar': 1.0,
  'EUR': 0.000196,  // 1 MGA = 0.000196 EUR
  'USD': 0.000214,  // 1 MGA = 0.000214 USD
  'GBP': 0.000168   // 1 MGA = 0.000168 GBP
};

async function migrateExistingPayments() {
  try {
    console.log('🔄 MIGRATION DES TAUX HISTORIQUES POUR LES PAIEMENTS EXISTANTS');
    console.log('==============================================================\n');

    // Trouver tous les paiements sans taux historiques
    const paymentsToMigrate = await prisma.payment.findMany({
      where: {
        OR: [
          { paymentDisplayCurrency: null },
          { paymentBaseCurrency: null },
          { 
            AND: [
              { paymentExchangeRate: 1 },
              { currency: { not: 'MGA' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        originalAmount: true,
        paymentExchangeRate: true,
        paymentDisplayCurrency: true,
        paymentBaseCurrency: true,
        createdAt: true,
        status: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 PAIEMENTS À MIGRER : ${paymentsToMigrate.length}`);
    console.log('');

    if (paymentsToMigrate.length === 0) {
      console.log('✅ Aucun paiement à migrer. Tous les paiements ont déjà des taux historiques.');
      return;
    }

    console.log('🔍 ANALYSE DES PAIEMENTS :');
    console.log('');

    let migratedCount = 0;
    const updates = [];

    for (const payment of paymentsToMigrate) {
      console.log(`Paiement ${payment.id}:`);
      console.log(`  Montant: ${payment.amount} ${payment.currency}`);
      console.log(`  Date: ${payment.createdAt.toISOString().split('T')[0]}`);
      console.log(`  Statut: ${payment.status}`);
      
      // Déterminer les valeurs à mettre à jour
      const paymentCurrency = payment.currency || 'MGA';
      const normalizedCurrency = paymentCurrency === 'Ar' ? 'MGA' : paymentCurrency;
      
      let updateData = {
        paymentBaseCurrency: normalizedCurrency
      };

      // Si le paiement n'a pas de devise d'affichage, utiliser la devise du paiement
      if (!payment.paymentDisplayCurrency) {
        updateData.paymentDisplayCurrency = normalizedCurrency;
      }

      // Si le taux de change est 1 et que ce n'est pas MGA, corriger
      if (payment.paymentExchangeRate === 1 && normalizedCurrency !== 'MGA') {
        const correctRate = defaultExchangeRates[normalizedCurrency] || 1;
        updateData.paymentExchangeRate = correctRate;
        console.log(`  ⚠️  Correction du taux: 1 → ${correctRate}`);
      }

      // Si pas de montant original, utiliser le montant actuel
      if (!payment.originalAmount) {
        updateData.originalAmount = payment.amount;
      }

      updates.push({
        id: payment.id,
        data: updateData
      });

      console.log(`  ✅ Préparé pour migration`);
      console.log('');
      migratedCount++;
    }

    // Confirmation avant exécution
    console.log(`🎯 RÉSUMÉ DE LA MIGRATION :`);
    console.log(`   Paiements à traiter: ${migratedCount}`);
    console.log('');
    
    console.log('📝 MODIFICATIONS QUI SERONT APPLIQUÉES :');
    updates.slice(0, 3).forEach((update, index) => {
      console.log(`   Paiement ${index + 1}:`);
      Object.entries(update.data).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
      console.log('');
    });
    
    if (updates.length > 3) {
      console.log(`   ... et ${updates.length - 3} autres paiements`);
      console.log('');
    }

    // Exécuter les mises à jour
    console.log('🚀 EXÉCUTION DE LA MIGRATION...');
    console.log('');

    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      try {
        await prisma.payment.update({
          where: { id: update.id },
          data: update.data
        });
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`   ✅ ${successCount}/${updates.length} paiements migrés...`);
        }
      } catch (error) {
        console.error(`   ❌ Erreur pour le paiement ${update.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('');
    console.log('🎉 MIGRATION TERMINÉE !');
    console.log('======================');
    console.log(`✅ Succès: ${successCount} paiements`);
    if (errorCount > 0) {
      console.log(`❌ Erreurs: ${errorCount} paiements`);
    }
    console.log('');

    console.log('📊 IMPACT :');
    console.log('   • Les paiements existants ont maintenant des taux historiques');
    console.log('   • Les montants seront plus stables lors des changements de taux');
    console.log('   • La cohérence comptable est améliorée');
    console.log('');

    console.log('🔍 VÉRIFICATION :');
    console.log('   1. Consultez une commande avec des paiements');
    console.log('   2. Changez la devise dans l\'en-tête');
    console.log('   3. Vérifiez que les montants restent cohérents');

  } catch (error) {
    console.error('❌ ERREUR LORS DE LA MIGRATION:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
migrateExistingPayments();
