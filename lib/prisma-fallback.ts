/**
 * Fallback temporaire pour Prisma quand le compte est bloqué
 * À SUPPRIMER une fois le problème résolu
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Wrapper pour gérer les erreurs Prisma Cloud
export async function safePrismaQuery<T>(
  queryFn: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  try {
    return await queryFn()
  } catch (error: any) {
    if (error.code === 'P5000' || error.code === 'P6003') {
      console.warn('⚠️ Prisma Cloud bloqué, utilisation du fallback')
      return fallbackValue
    }
    throw error
  }
}







