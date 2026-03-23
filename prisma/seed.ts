import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: "admin123",
    },
  })
  console.log("Seed completed: admin/admin123")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
