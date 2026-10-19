const express = require("express");

function createAppointmentsRouter(prisma, requireAuth) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/professionals", async (req, res, next) => {
    try {
      const professionals = await prisma.professional.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      });

      res.json(professionals);
    } catch (error) {
      next(error);
    }
  });

  router.get("/appointments", async (req, res, next) => {
    try {
      const professionalId = Number(req.query.professionalId);
      const date = req.query.date;

      if (
        !Number.isInteger(professionalId) ||
        professionalId < 1
      ) {
        return res.status(400).json({
          error: "Informe um profissional válido.",
        });
      }

      if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
      ) {
        return res.status(400).json({
          error: "Informe uma data válida no formato AAAA-MM-DD.",
        });
      }

      const startOfDay = new Date(`${date}T00:00:00-03:00`);

      if (
        Number.isNaN(startOfDay.getTime()) ||
        startOfDay.toISOString().slice(0, 10) !== date
      ) {
        return res.status(400).json({
          error: "A data informada é inválida.",
        });
      }

      const endOfDay = new Date(
        startOfDay.getTime() + 24 * 60 * 60 * 1000
      );

      const appointments = await prisma.appointment.findMany({
        where: {
          professionalId,
          startAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        orderBy: {
          startAt: "asc",
        },
        select: {
          id: true,
          title: true,
          patientName: true,
          startAt: true,
          endAt: true,
          status: true,
          professional: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.json(appointments);
    } catch (error) {
      next(error);
    }
  });

  router.use((req, res, next) => {
    requireAuth(req, res, next);
  });

  return router;
}

module.exports = { createAppointmentsRouter };