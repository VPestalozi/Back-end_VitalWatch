import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn', 'info']
})

prisma.$connect().catch((error) => {
  console.error('Erro ao conectar ao banco de dados:', error);
  process.exit(1);
})