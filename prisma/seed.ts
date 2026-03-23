import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD

  if (!username || !password) {
    console.error("Missing ADMIN_USERNAME or ADMIN_PASSWORD in .env")
    process.exit(1)
  }

  await prisma.admin.upsert({
    where: { username },
    update: { password },
    create: { username, password },
  })

  console.log(`Seed completed: admin account "${username}" ready`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
