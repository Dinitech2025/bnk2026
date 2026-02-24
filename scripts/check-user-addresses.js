const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUserAddresses() {
  try {
    console.log('🔍 Vérification des adresses utilisateur...')

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

    // Récupérer toutes les adresses
    const addresses = await prisma.address.findMany({
      where: { userId: user.id }
    })

    console.log('\n📍 Adresses trouvées:', addresses.length)
    
    if (addresses.length > 0) {
      addresses.forEach((addr, index) => {
        console.log(`\n📋 Adresse ${index + 1}:`)
        console.log(`   ID: ${addr.id}`)
        console.log(`   Type: "${addr.type}"`)
        console.log(`   Rue: ${addr.street}`)
        console.log(`   Ville: ${addr.city}`)
        console.log(`   Code postal: ${addr.zipCode}`)
        console.log(`   Pays: ${addr.country}`)
        console.log(`   Par défaut: ${addr.isDefault}`)
        console.log(`   Téléphone: ${addr.phoneNumber || 'Non défini'}`)
      })

      // Compter par type
      const typeCount = {}
      addresses.forEach(addr => {
        typeCount[addr.type] = (typeCount[addr.type] || 0) + 1
      })

      console.log('\n📊 Répartition par type:')
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} adresse(s)`)
      })

      // Vérifier les types attendus par le checkout
      const billingAddresses = addresses.filter(addr => addr.type === 'BILLING')
      const shippingAddresses = addresses.filter(addr => addr.type === 'SHIPPING')

      console.log('\n🎯 Pour le checkout:')
      console.log(`   Adresses BILLING: ${billingAddresses.length}`)
      console.log(`   Adresses SHIPPING: ${shippingAddresses.length}`)

      if (billingAddresses.length === 0 && shippingAddresses.length === 0) {
        console.log('\n⚠️  PROBLÈME: Aucune adresse BILLING ou SHIPPING trouvée!')
        console.log('   Le checkout ne peut pas afficher le sélecteur d\'adresses.')
        
        // Proposer de convertir les adresses existantes
        console.log('\n💡 Solution: Convertir les adresses existantes en BILLING/SHIPPING')
        
        for (const addr of addresses) {
          if (addr.type !== 'BILLING' && addr.type !== 'SHIPPING') {
            console.log(`\n🔄 Conversion de l'adresse "${addr.type}" en BILLING et SHIPPING...`)
            
            // Créer une adresse BILLING
            await prisma.address.create({
              data: {
                userId: user.id,
                type: 'BILLING',
                street: addr.street,
                city: addr.city,
                state: addr.state,
                zipCode: addr.zipCode,
                country: addr.country,
                isDefault: true,
                phoneNumber: addr.phoneNumber
              }
            })
            
            // Créer une adresse SHIPPING
            await prisma.address.create({
              data: {
                userId: user.id,
                type: 'SHIPPING',
                street: addr.street,
                city: addr.city,
                state: addr.state,
                zipCode: addr.zipCode,
                country: addr.country,
                isDefault: true,
                phoneNumber: addr.phoneNumber
              }
            })
            
            console.log('✅ Adresses BILLING et SHIPPING créées')
          }
        }
      }
    } else {
      console.log('❌ Aucune adresse trouvée pour cet utilisateur')
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserAddresses()
