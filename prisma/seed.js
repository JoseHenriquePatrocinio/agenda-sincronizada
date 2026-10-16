require("dotenv").config();
const bcrypt = require("bcrypt");
const { prisma } = require("../src/db/prisma");

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", passwordHash },
  });

  await prisma.professional.upsert({
    where: { id: 1 },
    update: { name: "Dra. Maria da Silva" },
    create: { id: 1, name: "Dra. Maria da Silva" },
  });

  console.log("Usuário inicial teste: admin / admin123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });