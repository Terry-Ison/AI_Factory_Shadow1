import { PrismaClient } from '@prisma/client'

/** @type {PrismaClient | undefined} */
let prisma

export function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient()
  }
  return prisma
}

export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect()
    prisma = undefined
  }
}
