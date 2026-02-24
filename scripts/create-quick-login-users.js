const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createQuickLoginUsers() {
  console.log('🔧 Création des utilisateurs pour connexion rapide...\n')

  try {
    // Utilisateurs à créer (identiques au modal d'authentification)
    const users = [
      {
        email: 'admin@test.com',
        password: 'test123',
        firstName: 'Admin',
        lastName: 'Test',
        name: 'Admin Test',
        role: 'ADMIN',
      },
      {
        email: 'staff@test.com',
        password: 'test123',
        firstName: 'Staff',
        lastName: 'Test',
        name: 'Staff Test',
        role: 'STAFF',
      },
      {
        email: 'client@test.com',
        password: 'test123',
        firstName: 'Client',
        lastName: 'Test',
        name: 'Client Test',
        role: 'CLIENT',
      },
    ]

    for (const userData of users) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (existingUser) {
        console.log(`✅ ${userData.role}: ${userData.email} existe déjà (ID: ${existingUser.id})`)
        continue
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(userData.password, 10)

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          emailVerified: new Date(),
        }
      })

      console.log(`✅ ${userData.role} créé: ${user.email} (ID: ${user.id})`)
      console.log(`   Mot de passe: ${userData.password}`)
    }

    console.log('\n✨ Utilisateurs de connexion rapide prêts!')
    console.log('\n📋 Résumé des identifiants:')
    console.log('   Admin:  admin@test.com  / test123')
    console.log('   Staff:  staff@test.com  / test123')
    console.log('   Client: client@test.com / test123')
    console.log('\n💡 Vous pouvez maintenant utiliser les boutons de connexion rapide du modal!')

  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createQuickLoginUsers()

