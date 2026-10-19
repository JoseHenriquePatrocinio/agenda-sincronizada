require("dotenv").config();

const bcrypt = require("bcrypt");
const { prisma } = require("../src/config/prisma");

function dateAt(dayOffset, time) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return new Date(`${year}-${month}-${day}T${time}:00-03:00`);
}

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

  const firstProfessional = await prisma.professional.findUnique({
    where: { id: 1 },
  });

  const professional1 = firstProfessional
    ? await prisma.professional.update({
        where: { id: 1 },
        data: { name: "Dra. Maria da Silva" },
      })
    : await prisma.professional.create({
        data: { name: "Dra. Maria da Silva" },
      });

  async function getOrCreateProfessional(name) {
    const existing = await prisma.professional.findFirst({
      where: { name },
    });

    if (existing) return existing;

    return prisma.professional.create({
      data: { name },
    });
  }

  const professional2 = await getOrCreateProfessional(
    "Dr. João Oliveira"
  );

  const professional3 = await getOrCreateProfessional(
    "Dra. Ana Costa"
  );

  await prisma.appointment.deleteMany({
    where: {
      patientName: {
        startsWith: "Paciente demonstração",
      },
    },
  });

  const schedules = [
    {
      professionalId: professional1.id,
      day: 0,
      start: "08:00",
      end: "08:30",
      patient: "Paciente demonstração 01",
      title: "Consulta inicial",
    },
    {
      professionalId: professional1.id,
      day: 0,
      start: "09:00",
      end: "09:30",
      patient: "Paciente demonstração 02",
      title: "Retorno",
    },
    {
      professionalId: professional1.id,
      day: 0,
      start: "10:30",
      end: "11:00",
      patient: "Paciente demonstração 03",
      title: "Avaliação clínica",
    },
    {
      professionalId: professional1.id,
      day: 1,
      start: "08:30",
      end: "09:00",
      patient: "Paciente demonstração 04",
      title: "Consulta inicial",
    },
    {
      professionalId: professional1.id,
      day: 2,
      start: "14:00",
      end: "14:30",
      patient: "Paciente demonstração 05",
      title: "Retorno",
    },
    {
      professionalId: professional1.id,
      day: 4,
      start: "10:00",
      end: "10:45",
      patient: "Paciente demonstração 06",
      title: "Avaliação clínica",
    },
    {
      professionalId: professional2.id,
      day: 0,
      start: "08:30",
      end: "09:00",
      patient: "Paciente demonstração 07",
      title: "Consulta inicial",
    },
    {
      professionalId: professional2.id,
      day: 0,
      start: "10:00",
      end: "10:30",
      patient: "Paciente demonstração 08",
      title: "Retorno",
    },
    {
      professionalId: professional2.id,
      day: 1,
      start: "13:30",
      end: "14:00",
      patient: "Paciente demonstração 09",
      title: "Consulta de acompanhamento",
    },
    {
      professionalId: professional2.id,
      day: 3,
      start: "09:00",
      end: "09:30",
      patient: "Paciente demonstração 10",
      title: "Consulta inicial",
    },
    {
      professionalId: professional2.id,
      day: 5,
      start: "15:00",
      end: "15:30",
      patient: "Paciente demonstração 11",
      title: "Retorno",
    },
    {
      professionalId: professional3.id,
      day: 0,
      start: "09:00",
      end: "09:45",
      patient: "Paciente demonstração 12",
      title: "Avaliação clínica",
    },
    {
      professionalId: professional3.id,
      day: 0,
      start: "11:00",
      end: "11:30",
      patient: "Paciente demonstração 13",
      title: "Consulta inicial",
    },
    {
      professionalId: professional3.id,
      day: 2,
      start: "08:00",
      end: "08:30",
      patient: "Paciente demonstração 14",
      title: "Retorno",
    },
    {
      professionalId: professional3.id,
      day: 3,
      start: "14:30",
      end: "15:00",
      patient: "Paciente demonstração 15",
      title: "Consulta de acompanhamento",
    },
    {
      professionalId: professional3.id,
      day: 6,
      start: "10:00",
      end: "10:30",
      patient: "Paciente demonstração 16",
      title: "Consulta inicial",
    },
  ];

  for (const item of schedules) {
    await prisma.appointment.create({
      data: {
        professionalId: item.professionalId,
        title: item.title,
        patientName: item.patient,
        startAt: dateAt(item.day, item.start),
        endAt: dateAt(item.day, item.end),
        status: "SCHEDULED",
      },
    });
  }

  await prisma.appointment.create({
    data: {
      professionalId: professional1.id,
      title: "Consulta cancelada",
      patientName: "Paciente demonstração 17",
      startAt: dateAt(0, "15:00"),
      endAt: dateAt(0, "15:30"),
      status: "CANCELLED",
    },
  });

  console.log("Seed executada com sucesso.");
  console.log("Usuários: admin e admin2");
  console.log("Profissionais: 3");
  console.log("Compromissos de demonstração: 17");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });