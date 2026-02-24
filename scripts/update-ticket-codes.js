const { PrismaClient } = require('@prisma/client');

async function updateTicketCodes() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Mise à jour des codes de tickets dans l\'historique...');

    // Récupérer tous les enregistrements d'historique sans code
    const historyRecords = await prisma.dailyTicketHistory.findMany({
      where: {
        type: 'USED',
        code: null,
        reason: {
          contains: 'Code'
        }
      }
    });

    console.log(`📋 Trouvé ${historyRecords.length} enregistrements à mettre à jour`);

    let updatedCount = 0;
    for (const record of historyRecords) {
      try {
        // Extraire le code depuis la raison
        let extractedCode = null;
        
        if (record.reason) {
          // Format: "Code coupon: XXXXXX" ou "Ticket utilisé - Code: XXXXXX"
          const codeMatch = record.reason.match(/Code[:\s]+([A-Za-z0-9]+)/);
          if (codeMatch) {
            extractedCode = codeMatch[1];
          }
        }

        if (extractedCode) {
          await prisma.dailyTicketHistory.update({
            where: { id: record.id },
            data: { code: extractedCode }
          });
          
          console.log(`✅ Mis à jour: ${record.id} -> Code: ${extractedCode}`);
          updatedCount++;
        } else {
          console.log(`⚠️ Impossible d'extraire le code pour: ${record.id} - Raison: ${record.reason}`);
        }
      } catch (error) {
        console.error(`❌ Erreur pour l'enregistrement ${record.id}:`, error.message);
      }
    }

    console.log(`\n📊 Résumé:`);
    console.log(`🔍 Enregistrements analysés: ${historyRecords.length}`);
    console.log(`✅ Enregistrements mis à jour: ${updatedCount}`);
    console.log(`⚠️ Enregistrements non mis à jour: ${historyRecords.length - updatedCount}`);

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
updateTicketCodes()
  .then(() => {
    console.log('✨ Mise à jour terminée avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }); 
 