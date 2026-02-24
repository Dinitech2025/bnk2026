const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCurrencyAutoSync() {
  console.log('🧪 Test de la synchronisation automatique des taux de change\n')
  
  try {
    // 1. Vérifier les taux actuels en base
    console.log('1️⃣ Taux de change actuels en base de données:')
    const currentSettings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'exchangeRate_'
        }
      }
    })
    
    if (currentSettings.length === 0) {
      console.log('   ❌ Aucun taux de change trouvé en base')
    } else {
      currentSettings.forEach(setting => {
        const currency = setting.key.replace('exchangeRate_', '')
        console.log(`   ${currency}: ${setting.value}`)
      })
    }
    
    // 2. Vérifier la dernière synchronisation
    console.log('\n2️⃣ Dernière synchronisation:')
    const lastSync = await prisma.setting.findUnique({
      where: { key: 'lastExchangeRateSync' }
    })
    
    if (lastSync) {
      const lastSyncDate = new Date(lastSync.value)
      const now = new Date()
      const diffHours = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60)
      
      console.log(`   📅 Dernière sync: ${lastSyncDate.toLocaleString('fr-FR')}`)
      console.log(`   ⏰ Il y a ${diffHours.toFixed(1)} heures`)
      
      if (diffHours >= 5) {
        console.log('   ✅ Synchronisation nécessaire (> 5 heures)')
      } else {
        console.log('   ℹ️ Synchronisation pas encore nécessaire (< 5 heures)')
      }
    } else {
      console.log('   ❌ Aucune synchronisation précédente trouvée')
    }
    
    // 3. Test de l'API de synchronisation manuelle
    console.log('\n3️⃣ Test de l\'API de synchronisation manuelle:')
    
    try {
      const response = await fetch('http://localhost:3000/api/admin/currency/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=test' // Simuler une session admin
        },
        body: JSON.stringify({ force: true })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('   ✅ API de synchronisation accessible')
        console.log(`   📊 Réponse: ${JSON.stringify(data, null, 2)}`)
      } else {
        console.log(`   ❌ Erreur API: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.log(`   ❌ Erreur de connexion à l'API: ${error.message}`)
      console.log('   ℹ️ Assurez-vous que le serveur Next.js est démarré (npm run dev)')
    }
    
    // 4. Vérifier la configuration de synchronisation automatique
    console.log('\n4️⃣ Configuration de synchronisation automatique:')
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'non défini'}`)
    console.log(`   ENABLE_CURRENCY_SYNC: ${process.env.ENABLE_CURRENCY_SYNC || 'non défini'}`)
    
    const shouldAutoSync = process.env.NODE_ENV === 'production' || process.env.ENABLE_CURRENCY_SYNC === 'true'
    console.log(`   🔄 Synchronisation automatique: ${shouldAutoSync ? 'ACTIVÉE' : 'DÉSACTIVÉE'}`)
    
    if (!shouldAutoSync) {
      console.log('\n💡 Pour activer la synchronisation automatique en développement:')
      console.log('   Créez un fichier .env.local avec: ENABLE_CURRENCY_SYNC=true')
    }
    
    // 5. Recommandations
    console.log('\n📋 Recommandations:')
    console.log('   • La synchronisation se fait automatiquement toutes les 5 heures')
    console.log('   • Utilisez l\'interface admin pour forcer une synchronisation manuelle')
    console.log('   • Les taux sont récupérés depuis FXRateAPI avec MGA comme devise de base')
    console.log('   • En cas d\'échec, les taux par défaut sont conservés')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le test
testCurrencyAutoSync() 

const prisma = new PrismaClient()

async function testCurrencyAutoSync() {
  console.log('🧪 Test de la synchronisation automatique des taux de change\n')
  
  try {
    // 1. Vérifier les taux actuels en base
    console.log('1️⃣ Taux de change actuels en base de données:')
    const currentSettings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'exchangeRate_'
        }
      }
    })
    
    if (currentSettings.length === 0) {
      console.log('   ❌ Aucun taux de change trouvé en base')
    } else {
      currentSettings.forEach(setting => {
        const currency = setting.key.replace('exchangeRate_', '')
        console.log(`   ${currency}: ${setting.value}`)
      })
    }
    
    // 2. Vérifier la dernière synchronisation
    console.log('\n2️⃣ Dernière synchronisation:')
    const lastSync = await prisma.setting.findUnique({
      where: { key: 'lastExchangeRateSync' }
    })
    
    if (lastSync) {
      const lastSyncDate = new Date(lastSync.value)
      const now = new Date()
      const diffHours = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60)
      
      console.log(`   📅 Dernière sync: ${lastSyncDate.toLocaleString('fr-FR')}`)
      console.log(`   ⏰ Il y a ${diffHours.toFixed(1)} heures`)
      
      if (diffHours >= 5) {
        console.log('   ✅ Synchronisation nécessaire (> 5 heures)')
      } else {
        console.log('   ℹ️ Synchronisation pas encore nécessaire (< 5 heures)')
      }
    } else {
      console.log('   ❌ Aucune synchronisation précédente trouvée')
    }
    
    // 3. Test de l'API de synchronisation manuelle
    console.log('\n3️⃣ Test de l\'API de synchronisation manuelle:')
    
    try {
      const response = await fetch('http://localhost:3000/api/admin/currency/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=test' // Simuler une session admin
        },
        body: JSON.stringify({ force: true })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('   ✅ API de synchronisation accessible')
        console.log(`   📊 Réponse: ${JSON.stringify(data, null, 2)}`)
      } else {
        console.log(`   ❌ Erreur API: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.log(`   ❌ Erreur de connexion à l'API: ${error.message}`)
      console.log('   ℹ️ Assurez-vous que le serveur Next.js est démarré (npm run dev)')
    }
    
    // 4. Vérifier la configuration de synchronisation automatique
    console.log('\n4️⃣ Configuration de synchronisation automatique:')
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'non défini'}`)
    console.log(`   ENABLE_CURRENCY_SYNC: ${process.env.ENABLE_CURRENCY_SYNC || 'non défini'}`)
    
    const shouldAutoSync = process.env.NODE_ENV === 'production' || process.env.ENABLE_CURRENCY_SYNC === 'true'
    console.log(`   🔄 Synchronisation automatique: ${shouldAutoSync ? 'ACTIVÉE' : 'DÉSACTIVÉE'}`)
    
    if (!shouldAutoSync) {
      console.log('\n💡 Pour activer la synchronisation automatique en développement:')
      console.log('   Créez un fichier .env.local avec: ENABLE_CURRENCY_SYNC=true')
    }
    
    // 5. Recommandations
    console.log('\n📋 Recommandations:')
    console.log('   • La synchronisation se fait automatiquement toutes les 5 heures')
    console.log('   • Utilisez l\'interface admin pour forcer une synchronisation manuelle')
    console.log('   • Les taux sont récupérés depuis FXRateAPI avec MGA comme devise de base')
    console.log('   • En cas d\'échec, les taux par défaut sont conservés')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le test
testCurrencyAutoSync() 