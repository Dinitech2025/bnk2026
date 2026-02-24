const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateExchangeRates() {
  console.log('🔄 Mise à jour des taux de change avec MGA comme devise de base...');
  
  const rates = {
    'MGA': 1.0,
    'EUR': 0.000196,  // 1 MGA = 0.000196 EUR (1 EUR ≈ 5100 MGA)
    'USD': 0.000214,  // 1 MGA = 0.000214 USD (1 USD ≈ 4680 MGA)
    'GBP': 0.000168,  // 1 MGA = 0.000168 GBP (1 GBP ≈ 5950 MGA)
    'CHF': 0.000204,  // 1 MGA = 0.000204 CHF (1 CHF ≈ 4900 MGA)
    'CAD': 0.000290   // 1 MGA = 0.000290 CAD (1 CAD ≈ 3450 MGA)
  };
  
  for (const [currency, rate] of Object.entries(rates)) {
    await prisma.setting.upsert({
      where: { key: `exchangeRate_${currency}` },
      update: { value: String(rate) },
      create: {
        key: `exchangeRate_${currency}`,
        value: String(rate),
        type: 'NUMBER'
      }
    });
    console.log(`✅ ${currency}: ${rate}`);
  }
  
  // Mettre à jour la date de dernière mise à jour
  await prisma.setting.upsert({
    where: { key: 'exchange_rates_last_update' },
    update: { value: new Date().toISOString() },
    create: {
      key: 'exchange_rates_last_update',
      value: new Date().toISOString(),
      type: 'DATE'
    }
  });
  
  console.log('🎉 Taux de change mis à jour avec succès!');
  console.log('');
  console.log('📊 Test de conversion:');
  console.log('- 5100 MGA = 1 EUR');
  console.log('- 4680 MGA = 1 USD');
  console.log('- 5950 MGA = 1 GBP');
  console.log('- 4900 MGA = 1 CHF');
  
  await prisma.$disconnect();
}

updateExchangeRates().catch(console.error); 
const prisma = new PrismaClient();

async function updateExchangeRates() {
  console.log('🔄 Mise à jour des taux de change avec MGA comme devise de base...');
  
  const rates = {
    'MGA': 1.0,
    'EUR': 0.000196,  // 1 MGA = 0.000196 EUR (1 EUR ≈ 5100 MGA)
    'USD': 0.000214,  // 1 MGA = 0.000214 USD (1 USD ≈ 4680 MGA)
    'GBP': 0.000168,  // 1 MGA = 0.000168 GBP (1 GBP ≈ 5950 MGA)
    'CHF': 0.000204,  // 1 MGA = 0.000204 CHF (1 CHF ≈ 4900 MGA)
    'CAD': 0.000290   // 1 MGA = 0.000290 CAD (1 CAD ≈ 3450 MGA)
  };
  
  for (const [currency, rate] of Object.entries(rates)) {
    await prisma.setting.upsert({
      where: { key: `exchangeRate_${currency}` },
      update: { value: String(rate) },
      create: {
        key: `exchangeRate_${currency}`,
        value: String(rate),
        type: 'NUMBER'
      }
    });
    console.log(`✅ ${currency}: ${rate}`);
  }
  
  // Mettre à jour la date de dernière mise à jour
  await prisma.setting.upsert({
    where: { key: 'exchange_rates_last_update' },
    update: { value: new Date().toISOString() },
    create: {
      key: 'exchange_rates_last_update',
      value: new Date().toISOString(),
      type: 'DATE'
    }
  });
  
  console.log('🎉 Taux de change mis à jour avec succès!');
  console.log('');
  console.log('📊 Test de conversion:');
  console.log('- 5100 MGA = 1 EUR');
  console.log('- 4680 MGA = 1 USD');
  console.log('- 5950 MGA = 1 GBP');
  console.log('- 4900 MGA = 1 CHF');
  
  await prisma.$disconnect();
}

updateExchangeRates().catch(console.error); 