const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function getAdminUser() {
  try {
    // Chercher un utilisateur admin
    const admin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true
      }
    })

    if (admin) {
      console.log('✅ Utilisateur admin trouvé:')
      console.log(`   ID: ${admin.id}`)
      console.log(`   Email: ${admin.email}`)
      console.log(`   Nom: ${admin.name || `${admin.firstName} ${admin.lastName}`}`)
      console.log(`   Rôle: ${admin.role}`)
      return admin
    } else {
      console.log('❌ Aucun utilisateur admin trouvé')
      
      // Chercher n'importe quel utilisateur
      const anyUser = await prisma.user.findFirst({
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      })
      
      if (anyUser) {
        console.log('\n✅ Utilisateur trouvé:')
        console.log(`   ID: ${anyUser.id}`)
        console.log(`   Email: ${anyUser.email}`)
        console.log(`   Nom: ${anyUser.name}`)
        console.log(`   Rôle: ${anyUser.role}`)
        return anyUser
      } else {
        console.log('❌ Aucun utilisateur trouvé dans la base de données')
      }
    }
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

getAdminUser()

