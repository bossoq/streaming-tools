import { PrismaClient } from '@prisma/client'
import { logger } from '../logger'

const prisma = new PrismaClient()

prisma.$on('beforeExit', async () => {
  logger.info('[PRISMA] Prisma Client is disconnecting...')
})

export default prisma
