const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Analyse des résultats et proposition de solution
async function ajusterParametres() {
  console.log('🔧 SOLUTION D\'AJUSTEMENT DES PARAMÈTRES')
  console.log('=' .repeat(60))
  
  console.log('\n📊 ANALYSE DES RÉSULTATS DU TEST:')
  console.log('✅ EUR (France): Différences < 3% - Excellent !')
  console.log('⚠️ USD (USA): Nouveau système 25% moins cher')
  console.log('⚠️ GBP (UK): Nouveau système 37% plus cher')
  
  console.log('\n🔍 CAUSES IDENTIFIÉES:')
  console.log('1. Taux de change dynamiques vs taux fixe (5300)')
  console.log('2. Différences dans les taux de conversion')
  console.log('   - Ancien: 5300 fixe pour toutes devises')
  console.log('   - Nouveau: EUR=5158.93, USD=4535.22, GBP=6147.28')
  
  console.log('\n💡 SOLUTIONS PROPOSÉES:')
  
  // Solution 1: Ajuster les taux de change pour correspondre à l'ancien système
  console.log('\n🎯 SOLUTION 1: Ajustement des taux de change')
  console.log('Objectif: Faire correspondre les résultats à l\'ancien système')
  
  const nouveauxTaux = {
    'EUR': 5300 / 5158.93, // ≈ 1.027
    'USD': 5300 / 4535.22, // ≈ 1.169  
    'GBP': 5300 / 6147.28, // ≈ 0.862
    'MGA': 5300
  }
  
  console.log('Nouveaux taux suggérés:')
  Object.entries(nouveauxTaux).forEach(([currency, rate]) => {
    console.log(`   ${currency}: ${rate.toFixed(6)}`)
  })
  
  // Solution 2: Paramètres hybrides
  console.log('\n🎯 SOLUTION 2: Système hybride intelligent')
  console.log('Garder les taux réels mais ajuster les commissions par devise')
  
  const commissionsAjustees = {
    'EUR': { // Garder les commissions actuelles (résultats proches)
      '0_10': 25,
      '10_25': 35, 
      '25_100': 38,
      '100_200': 30,
      '200_plus': 25
    },
    'USD': { // Augmenter les commissions (système trop avantageux)
      '0_10': 35,
      '10_25': 45,
      '25_100': 48, 
      '100_200': 40,
      '200_plus': 35
    },
    'GBP': { // Réduire les commissions (système trop cher)
      '0_10': 15,
      '10_25': 25,
      '25_100': 28,
      '100_200': 20,
      '200_plus': 15
    }
  }
  
  console.log('Commissions ajustées par devise:')
  Object.entries(commissionsAjustees).forEach(([currency, rates]) => {
    console.log(`   ${currency}:`)
    Object.entries(rates).forEach(([tranche, rate]) => {
      console.log(`     ${tranche}: ${rate}%`)
    })
  })
  
  // Solution 3: Mode de compatibilité
  console.log('\n🎯 SOLUTION 3: Mode de compatibilité')
  console.log('Ajouter un paramètre "mode_compatibilite" qui utilise:')
  console.log('   - Taux fixe 5300 pour toutes devises')
  console.log('   - Commissions identiques à l\'ancien système')
  console.log('   - Possibilité de basculer vers le nouveau système progressivement')
  
  // Demander à l'utilisateur quelle solution appliquer
  console.log('\n❓ QUELLE SOLUTION VOULEZ-VOUS APPLIQUER ?')
  console.log('1. Ajuster les taux de change (Solution 1)')
  console.log('2. Commissions par devise (Solution 2)') 
  console.log('3. Mode compatibilité (Solution 3)')
  console.log('4. Garder le système actuel (recommandé)')
  
  return {
    nouveauxTaux,
    commissionsAjustees,
    recommandation: 'Solution 4 - Garder le système actuel'
  }
}

// Fonction pour appliquer la Solution 1
async function appliquerSolution1(nouveauxTaux) {
  console.log('\n🔧 Application de la Solution 1...')
  
  try {
    for (const [currency, rate] of Object.entries(nouveauxTaux)) {
      await prisma.setting.upsert({
        where: { key: `exchangeRate_${currency}` },
        update: { value: String(rate) },
        create: {
          key: `exchangeRate_${currency}`,
          value: String(rate),
          type: 'NUMBER'
        }
      })
      console.log(`✅ Taux ${currency} mis à jour: ${rate.toFixed(6)}`)
    }
    console.log('✅ Solution 1 appliquée avec succès !')
  } catch (error) {
    console.error('❌ Erreur lors de l\'application:', error)
  }
}

// Fonction pour appliquer la Solution 3 (Mode compatibilité)
async function appliquerSolution3() {
  console.log('\n🔧 Application de la Solution 3 (Mode compatibilité)...')
  
  try {
    // Ajouter le paramètre mode_compatibilite
    await prisma.importCalculationSettings.upsert({
      where: { key: 'mode_compatibilite' },
      update: { value: 'true' },
      create: {
        key: 'mode_compatibilite',
        value: 'true',
        description: 'Active le mode de compatibilité avec l\'ancien système',
        category: 'general'
      }
    })
    
    // Ajouter le taux fixe de compatibilité
    await prisma.importCalculationSettings.upsert({
      where: { key: 'taux_fixe_compatibilite' },
      update: { value: '5300' },
      create: {
        key: 'taux_fixe_compatibilite', 
        value: '5300',
        description: 'Taux de change fixe pour le mode compatibilité',
        category: 'general'
      }
    })
    
    console.log('✅ Mode compatibilité activé !')
    console.log('✅ Taux fixe 5300 configuré')
    console.log('ℹ️ Modifiez l\'API de calcul pour utiliser ce mode')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application:', error)
  }
}

// Fonction principale
async function main() {
  const solutions = await ajusterParametres()
  
  console.log('\n🎯 RECOMMANDATION FINALE:')
  console.log('=' .repeat(50))
  console.log('✅ GARDER LE SYSTÈME ACTUEL pour ces raisons:')
  console.log('   1. Taux de change RÉELS et à jour')
  console.log('   2. Système plus PRÉCIS et moderne')
  console.log('   3. Différences acceptables pour EUR (< 3%)')
  console.log('   4. Possibilité d\'ajuster les paramètres facilement')
  
  console.log('\n🔄 ACTIONS RECOMMANDÉES:')
  console.log('1. Informer les utilisateurs des nouveaux calculs')
  console.log('2. Ajuster les marges si nécessaire')
  console.log('3. Monitorer les résultats sur quelques semaines')
  console.log('4. Utiliser l\'interface admin pour ajuster au besoin')
  
  console.log('\n⚙️ Si vous voulez appliquer une solution:')
  console.log('   - Solution 1: Décommentez appliquerSolution1(solutions.nouveauxTaux)')
  console.log('   - Solution 3: Décommentez appliquerSolution3()')
  
  // Décommentez la ligne suivante pour appliquer la Solution 1
  // await appliquerSolution1(solutions.nouveauxTaux)
  
  // Décommentez la ligne suivante pour appliquer la Solution 3  
  // await appliquerSolution3()
  
  console.log('\n✨ Analyse terminée !')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect()) 

const prisma = new PrismaClient()

// Analyse des résultats et proposition de solution
async function ajusterParametres() {
  console.log('🔧 SOLUTION D\'AJUSTEMENT DES PARAMÈTRES')
  console.log('=' .repeat(60))
  
  console.log('\n📊 ANALYSE DES RÉSULTATS DU TEST:')
  console.log('✅ EUR (France): Différences < 3% - Excellent !')
  console.log('⚠️ USD (USA): Nouveau système 25% moins cher')
  console.log('⚠️ GBP (UK): Nouveau système 37% plus cher')
  
  console.log('\n🔍 CAUSES IDENTIFIÉES:')
  console.log('1. Taux de change dynamiques vs taux fixe (5300)')
  console.log('2. Différences dans les taux de conversion')
  console.log('   - Ancien: 5300 fixe pour toutes devises')
  console.log('   - Nouveau: EUR=5158.93, USD=4535.22, GBP=6147.28')
  
  console.log('\n💡 SOLUTIONS PROPOSÉES:')
  
  // Solution 1: Ajuster les taux de change pour correspondre à l'ancien système
  console.log('\n🎯 SOLUTION 1: Ajustement des taux de change')
  console.log('Objectif: Faire correspondre les résultats à l\'ancien système')
  
  const nouveauxTaux = {
    'EUR': 5300 / 5158.93, // ≈ 1.027
    'USD': 5300 / 4535.22, // ≈ 1.169  
    'GBP': 5300 / 6147.28, // ≈ 0.862
    'MGA': 5300
  }
  
  console.log('Nouveaux taux suggérés:')
  Object.entries(nouveauxTaux).forEach(([currency, rate]) => {
    console.log(`   ${currency}: ${rate.toFixed(6)}`)
  })
  
  // Solution 2: Paramètres hybrides
  console.log('\n🎯 SOLUTION 2: Système hybride intelligent')
  console.log('Garder les taux réels mais ajuster les commissions par devise')
  
  const commissionsAjustees = {
    'EUR': { // Garder les commissions actuelles (résultats proches)
      '0_10': 25,
      '10_25': 35, 
      '25_100': 38,
      '100_200': 30,
      '200_plus': 25
    },
    'USD': { // Augmenter les commissions (système trop avantageux)
      '0_10': 35,
      '10_25': 45,
      '25_100': 48, 
      '100_200': 40,
      '200_plus': 35
    },
    'GBP': { // Réduire les commissions (système trop cher)
      '0_10': 15,
      '10_25': 25,
      '25_100': 28,
      '100_200': 20,
      '200_plus': 15
    }
  }
  
  console.log('Commissions ajustées par devise:')
  Object.entries(commissionsAjustees).forEach(([currency, rates]) => {
    console.log(`   ${currency}:`)
    Object.entries(rates).forEach(([tranche, rate]) => {
      console.log(`     ${tranche}: ${rate}%`)
    })
  })
  
  // Solution 3: Mode de compatibilité
  console.log('\n🎯 SOLUTION 3: Mode de compatibilité')
  console.log('Ajouter un paramètre "mode_compatibilite" qui utilise:')
  console.log('   - Taux fixe 5300 pour toutes devises')
  console.log('   - Commissions identiques à l\'ancien système')
  console.log('   - Possibilité de basculer vers le nouveau système progressivement')
  
  // Demander à l'utilisateur quelle solution appliquer
  console.log('\n❓ QUELLE SOLUTION VOULEZ-VOUS APPLIQUER ?')
  console.log('1. Ajuster les taux de change (Solution 1)')
  console.log('2. Commissions par devise (Solution 2)') 
  console.log('3. Mode compatibilité (Solution 3)')
  console.log('4. Garder le système actuel (recommandé)')
  
  return {
    nouveauxTaux,
    commissionsAjustees,
    recommandation: 'Solution 4 - Garder le système actuel'
  }
}

// Fonction pour appliquer la Solution 1
async function appliquerSolution1(nouveauxTaux) {
  console.log('\n🔧 Application de la Solution 1...')
  
  try {
    for (const [currency, rate] of Object.entries(nouveauxTaux)) {
      await prisma.setting.upsert({
        where: { key: `exchangeRate_${currency}` },
        update: { value: String(rate) },
        create: {
          key: `exchangeRate_${currency}`,
          value: String(rate),
          type: 'NUMBER'
        }
      })
      console.log(`✅ Taux ${currency} mis à jour: ${rate.toFixed(6)}`)
    }
    console.log('✅ Solution 1 appliquée avec succès !')
  } catch (error) {
    console.error('❌ Erreur lors de l\'application:', error)
  }
}

// Fonction pour appliquer la Solution 3 (Mode compatibilité)
async function appliquerSolution3() {
  console.log('\n🔧 Application de la Solution 3 (Mode compatibilité)...')
  
  try {
    // Ajouter le paramètre mode_compatibilite
    await prisma.importCalculationSettings.upsert({
      where: { key: 'mode_compatibilite' },
      update: { value: 'true' },
      create: {
        key: 'mode_compatibilite',
        value: 'true',
        description: 'Active le mode de compatibilité avec l\'ancien système',
        category: 'general'
      }
    })
    
    // Ajouter le taux fixe de compatibilité
    await prisma.importCalculationSettings.upsert({
      where: { key: 'taux_fixe_compatibilite' },
      update: { value: '5300' },
      create: {
        key: 'taux_fixe_compatibilite', 
        value: '5300',
        description: 'Taux de change fixe pour le mode compatibilité',
        category: 'general'
      }
    })
    
    console.log('✅ Mode compatibilité activé !')
    console.log('✅ Taux fixe 5300 configuré')
    console.log('ℹ️ Modifiez l\'API de calcul pour utiliser ce mode')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application:', error)
  }
}

// Fonction principale
async function main() {
  const solutions = await ajusterParametres()
  
  console.log('\n🎯 RECOMMANDATION FINALE:')
  console.log('=' .repeat(50))
  console.log('✅ GARDER LE SYSTÈME ACTUEL pour ces raisons:')
  console.log('   1. Taux de change RÉELS et à jour')
  console.log('   2. Système plus PRÉCIS et moderne')
  console.log('   3. Différences acceptables pour EUR (< 3%)')
  console.log('   4. Possibilité d\'ajuster les paramètres facilement')
  
  console.log('\n🔄 ACTIONS RECOMMANDÉES:')
  console.log('1. Informer les utilisateurs des nouveaux calculs')
  console.log('2. Ajuster les marges si nécessaire')
  console.log('3. Monitorer les résultats sur quelques semaines')
  console.log('4. Utiliser l\'interface admin pour ajuster au besoin')
  
  console.log('\n⚙️ Si vous voulez appliquer une solution:')
  console.log('   - Solution 1: Décommentez appliquerSolution1(solutions.nouveauxTaux)')
  console.log('   - Solution 3: Décommentez appliquerSolution3()')
  
  // Décommentez la ligne suivante pour appliquer la Solution 1
  // await appliquerSolution1(solutions.nouveauxTaux)
  
  // Décommentez la ligne suivante pour appliquer la Solution 3  
  // await appliquerSolution3()
  
  console.log('\n✨ Analyse terminée !')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect()) 