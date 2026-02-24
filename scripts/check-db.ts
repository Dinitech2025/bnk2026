import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  console.log('Utilisateurs dans la base de données:')
  console.log(JSON.stringify(users, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect()) 