require("dotenv").config();
const bcrypt = require("bcrypt");
const { prisma } = require("../src/config/prisma");

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);
  const passwordHash2 = await bcrypt.hash("admin1234", 12);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash,
    },
  });

  await prisma.user.upsert({
    where: { username: "admin2" },
    update: {},
    create: {
      username: "admin2",
      passwordHash: passwordHash2,
    },
  });

  await prisma.professional.upsert({
    where: { id: 1 },
    update: { name: "Dra. Maria da Silva" },
    create: { id: 1, name: "Dra. Maria da Silva" },
  });

  console.log("Usuários iniciais:");
  console.log("- admin / admin123");
  console.log("- admin2 / admin1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });