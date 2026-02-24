import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  const email = 'admin@boutiknaka.com'
  const password = 'Admin@2025' // À changer après la première connexion
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const admin = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: hashedPassword,
        name: 'Admin',
        role: 'ADMIN',
      },
    })
    
    console.log('Compte administrateur créé avec succès:', admin.email)
  } catch (error) {
    console.error('Erreur lors de la création du compte admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin() 