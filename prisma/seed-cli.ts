import prisma from '../lib/prisma'
import { seedDemoData } from './seed'

seedDemoData()
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
