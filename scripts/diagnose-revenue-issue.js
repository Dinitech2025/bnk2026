#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function diagnoseRevenue() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 DIAGNOSTIC DU CHIFFRE D\'AFFAIRES');
    console.log('===================================\n');

    // 1. Vérifier les paiements existants
    const allPayments = await prisma.payment.findMany({
      select: {
        id: true,
        amount: true,
        currency: true,
        paymentExchangeRate: true,
        originalAmount: true,
        status: true,
        createdAt: true,
        order: {
          select: {
            orderNumber: true,
            total: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`📊 TOTAL PAIEMENTS DANS LA BASE : ${allPayments.length}`);
    console.log('');

    if (allPayments.length === 0) {
      console.log('❌ AUCUN PAIEMENT TROUVÉ !');
      console.log('   Cela explique pourquoi le CA est à 0.');
      console.log('');
      
      // Vérifier les commandes
      const orders = await prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          paymentStatus: true
        },
        take: 5
      });
      
      console.log(`📋 COMMANDES EXISTANTES : ${orders.length}`);
      orders.forEach(order => {
        console.log(`   • ${order.orderNumber}: ${order.total} Ar (${order.status}/${order.paymentStatus})`);
      });
      
    } else {
      console.log('💰 DERNIERS PAIEMENTS :');
      
      let totalRevenue = 0;
      let validPayments = 0;
      
      allPayments.forEach((payment, index) => {
        const amount = Number(payment.amount);
        const currency = payment.currency || 'Ar';
        const rate = payment.paymentExchangeRate ? Number(payment.paymentExchangeRate) : 1;
        const originalAmount = payment.originalAmount ? Number(payment.originalAmount) : amount;
        
        console.log(`   ${index + 1}. ${payment.order?.orderNumber || 'N/A'}`);
        console.log(`      Montant: ${amount} ${currency}`);
        console.log(`      Statut: ${payment.status}`);
        console.log(`      Taux: ${rate}`);
        console.log(`      Original: ${originalAmount}`);
        
        // Calculer comme dans le code
        if (payment.status === 'completed' || payment.status === 'PAID') {
          validPayments++;
          if (currency === 'Ar') {
            totalRevenue += amount;
            console.log(`      → Ajouté au CA: +${amount} Ar`);
          } else {
            const converted = originalAmount * rate;
            totalRevenue += converted;
            console.log(`      → Ajouté au CA: +${converted} Ar (${originalAmount} × ${rate})`);
          }
        } else {
          console.log(`      → Ignoré (statut: ${payment.status})`);
        }
        console.log('');
      });
      
      console.log(`✅ PAIEMENTS VALIDES : ${validPayments}`);
      console.log(`💰 CA CALCULÉ : ${Math.round(totalRevenue)} Ar`);
      console.log(`💰 CA FORMATÉ : ${totalRevenue >= 1000000 ? `${(totalRevenue / 1000000).toFixed(1)}M` : `${Math.round(totalRevenue / 1000)}K`} Ar`);
    }

    // 2. Vérifier les statuts de paiement utilisés
    const paymentStatuses = await prisma.payment.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    console.log('📈 RÉPARTITION DES STATUTS DE PAIEMENT :');
    paymentStatuses.forEach(status => {
      console.log(`   • ${status.status}: ${status._count.status} paiements`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseRevenue();
