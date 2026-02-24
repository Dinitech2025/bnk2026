import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Initialisation de la base de données Netlify...')

  try {
    // Supprimer les données existantes
    await prisma.user.deleteMany()
    await prisma.setting.deleteMany()
    console.log('✅ Base de données nettoyée')

    // Créer l'administrateur
    const adminPassword = await bcrypt.hash('admin123', 12)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@boutiknaka.com',
        name: 'Admin',
        firstName: 'Admin',
        lastName: 'System',
        password: adminPassword,
        role: 'ADMIN',
        preferredLanguage: 'fr',
        customerType: 'INDIVIDUAL',
      },
    })
    console.log('✅ Administrateur créé:', admin.email)

    // Créer le staff
    const staffPassword = await bcrypt.hash('staff123', 12)
    const staff = await prisma.user.create({
      data: {
        email: 'staff@boutiknaka.com',
        name: 'Staff',
        firstName: 'Staff',
        lastName: 'Member',
        password: staffPassword,
        role: 'STAFF',
        preferredLanguage: 'fr',
        customerType: 'INDIVIDUAL',
      },
    })
    console.log('✅ Staff créé:', staff.email)

    // Créer le client test
    const clientPassword = await bcrypt.hash('client123', 12)
    const client = await prisma.user.create({
      data: {
        email: 'client@example.com',
        name: 'Client',
        firstName: 'John',
        lastName: 'Doe',
        password: clientPassword,
        role: 'CLIENT',
        preferredLanguage: 'fr',
        customerType: 'INDIVIDUAL',
      },
    })
    console.log('✅ Client créé:', client.email)

    // Création des paramètres système
    console.log('🔧 Initialisation des paramètres système...')

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
    ]

    for (const setting of defaultSettings) {
      await prisma.setting.create({
        data: setting
      })
    }

    console.log('✅ Paramètres système initialisés')
    console.log('✨ Initialisation terminée avec succès!')
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 
main() 
main() 