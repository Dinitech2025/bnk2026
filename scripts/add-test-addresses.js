const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addTestAddresses() {
  try {
    console.log('🏠 Ajout d\'adresses de test...')

    // Trouver l'utilisateur DINY Oili
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'dinyoili@outlook.com' },
          { phone: '+261325550444' },
          { firstName: 'DINY' }
        ]
      }
    })

    if (!user) {
      console.log('❌ Utilisateur DINY Oili non trouvé')
      return
    }

    console.log('👤 Utilisateur trouvé:', user.firstName, user.lastName, user.email)

    // Vérifier les adresses existantes
    const existingAddresses = await prisma.address.findMany({
      where: { userId: user.id }
    })

    console.log('📍 Adresses existantes:', existingAddresses.length)

    if (existingAddresses.length === 0) {
      // Créer des adresses de test
      const billingAddress = await prisma.address.create({
        data: {
          userId: user.id,
          type: 'BILLING',
          street: '123 Rue Principale',
          city: 'Antananarivo',
          state: 'Analamanga',
          zipCode: '101',
          country: 'Madagascar',
          isDefault: true,
          phoneNumber: '+261325550444'
        }
      })

      const shippingAddress = await prisma.address.create({
        data: {
          userId: user.id,
          type: 'SHIPPING',
          street: '456 Avenue de l\'Indépendance',
          city: 'Antananarivo',
          state: 'Analamanga',
          zipCode: '101',
          country: 'Madagascar',
          isDefault: true,
          phoneNumber: '+261325550444'
        }
      })

      console.log('✅ Adresse de facturation créée:', billingAddress.id)
      console.log('✅ Adresse de livraison créée:', shippingAddress.id)

      // Ajouter une adresse secondaire
      const secondaryAddress = await prisma.address.create({
        data: {
          userId: user.id,
          type: 'BILLING',
          street: '789 Boulevard Ratsimilaho',
          city: 'Fianarantsoa',
          state: 'Haute Matsiatra',
          zipCode: '301',
          country: 'Madagascar',
          isDefault: false,
          phoneNumber: '+261325550444'
        }
      })

      console.log('✅ Adresse secondaire créée:', secondaryAddress.id)

    } else {
      console.log('📍 L\'utilisateur a déjà des adresses:')
      existingAddresses.forEach(addr => {
        console.log(`  - ${addr.type}: ${addr.street}, ${addr.city} (défaut: ${addr.isDefault})`)
      })
    }

    // Afficher toutes les adresses finales
    const finalAddresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: 'desc' }
    })

    console.log('\n📊 Adresses finales pour cet utilisateur:')
    finalAddresses.forEach(addr => {
      console.log(`  ${addr.type}: ${addr.street}, ${addr.city}, ${addr.zipCode} - ${addr.country}`)
      console.log(`    Par défaut: ${addr.isDefault ? 'Oui' : 'Non'}`)
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTestAddresses()
