const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedSettings() {
  console.log('🌱 Initialisation des paramètres généraux...')

  const defaultSettings = [
    { key: 'siteName', value: 'BoutikNaka', type: 'STRING' },
    { key: 'siteDescription', value: 'Votre boutique en ligne pour tous vos besoins', type: 'TEXT' },
    { key: 'siteTagline', value: 'Qualité et service à prix abordable', type: 'STRING' },
    { key: 'contactEmail', value: 'contact@boutiknaka.com', type: 'STRING' },
    { key: 'contactPhone', value: '+261 34 00 000 00', type: 'STRING' },
    { key: 'address', value: 'Antananarivo, Madagascar', type: 'TEXT' },
    { key: 'logoUrl', value: '/images/logo.png', type: 'IMAGE' },
    { key: 'faviconUrl', value: '/favicon.ico', type: 'IMAGE' },
    { key: 'adminLogoUrl', value: '/images/admin-logo.png', type: 'IMAGE' },
    { key: 'currency', value: 'MGA', type: 'STRING' },
    { key: 'currencySymbol', value: 'Ar', type: 'STRING' },
    { key: 'baseCurrency', value: 'EUR', type: 'STRING' },
    { key: 'exchangeRates', value: JSON.stringify({
      EUR: 1.0,
      USD: 0.92,
      MGA: 0.00022, // Approximativement 1 EUR = 4545 MGA
    }), type: 'JSON' },
    { key: 'facebookUrl', value: 'https://facebook.com/boutiknaka', type: 'STRING' },
    { key: 'instagramUrl', value: 'https://instagram.com/boutiknaka', type: 'STRING' },
    { key: 'twitterUrl', value: 'https://twitter.com/boutiknaka', type: 'STRING' },
    { key: 'youtubeUrl', value: '', type: 'STRING' },
    { key: 'footerText', value: '© 2023 BoutikNaka. Tous droits réservés.', type: 'TEXT' },
    { key: 'metaTitle', value: 'BoutikNaka - Votre boutique en ligne', type: 'STRING' },
    { key: 'metaDescription', value: 'BoutikNaka est votre boutique en ligne pour tous vos besoins numériques et électroniques.', type: 'TEXT' },
    { key: 'metaKeywords', value: 'boutique, e-commerce, madagascar, streaming, produits, services', type: 'STRING' },
    { key: 'sloganMG', value: 'Kalitao sy serivisy amin\'ny vidiny mora', type: 'STRING' },
    { key: 'sloganFR', value: 'Qualité et service à prix abordable', type: 'STRING' },
    { key: 'useSiteLogo', value: 'true', type: 'STRING' },
  ]

  // Supprimer les paramètres existants
  await prisma.setting.deleteMany({})

  // Insérer les nouveaux paramètres
  for (const setting of defaultSettings) {
    await prisma.setting.create({
      data: setting
    })
  }

  console.log('✅ Paramètres généraux initialisés avec succès!')
}

// Exécuter la fonction si appelée directement
seedSettings()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Erreur lors de l\'initialisation des paramètres:', e)
    await prisma.$disconnect()
    process.exit(1)
  }) 
 
 
 