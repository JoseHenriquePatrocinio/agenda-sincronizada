const express = require("express");
const { AppointmentValidator } = require("../utils/appointment-validator");

function createAppointmentsRouter(prisma, requireAuth) {
  const router = express.Router();
  router.use(requireAuth);

  async function findConflict(data, excludeId = null) {
    return prisma.appointment.findFirst({
      where: {
        professionalId: data.professionalId,
        status: "SCHEDULED",
        startAt: { lt: data.endAt },
        endAt: { gt: data.startAt },
        ...(excludeId !== null ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
  }

  async function findProfessional(professionalId) {
    return prisma.professional.findUnique({
      where: { id: professionalId },
      select: { id: true },
    });
  }

  function includeProfessional() {
    return {
      professional: {
        select: { id: true, name: true },
      },
    };
  }

  router.get("/professionals", async (req, res, next) => {
    try {
      const professionals = await prisma.professional.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      });

      res.json(professionals);
    } catch (error) {
      next(error);
    }
  });

  router.get("/appointments", async (req, res, next) => {
    try {
      const professionalId = AppointmentValidator.parseId(
        req.query.professionalId
      );

      if (!professionalId) {
        return res.status(400).json({
          error: "Informe um profissional válido.",
        });
      }

      const dateResult = AppointmentValidator.validateDate(
        req.query.date
      );

      if (dateResult.error) {
        return res.status(400).json({
          error: dateResult.error,
        });
      }

      const { startOfDay, endOfDay } = dateResult.data;

      const appointments = await prisma.appointment.findMany({
        where: {
          professionalId,
          startAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        orderBy: { startAt: "asc" },
        include: includeProfessional(),
      });

      res.json(appointments);
    } catch (error) {
      next(error);
    }
  });

  router.post("/appointments", async (req, res, next) => {
    try {
      const result = AppointmentValidator.validateAppointment(
        req.body || {}
      );

      if (result.error) {
        return res.status(400).json({
          error: result.error,
        });
      }

      const professional = await findProfessional(
        result.data.professionalId
      );

      if (!professional) {
        return res.status(400).json({
          error: "O profissional selecionado não existe.",
        });
      }

      const conflict = await findConflict(result.data);

      if (conflict) {
        return res.status(409).json({
          error:
            "Esse profissional já possui um compromisso nesse horário.",
        });
      }

      const appointment = await prisma.appointment.create({
        data: result.data,
        include: includeProfessional(),
      });

      res.status(201).json(appointment);
    } catch (error) {
      next(error);
    }
  });

  router.put("/appointments/:id", async (req, res, next) => {
    try {
      const id = AppointmentValidator.parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error: "ID do compromisso inválido.",
        });
      }

      const existing = await prisma.appointment.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({
          error: "Compromisso não encontrado.",
        });
      }

      if (existing.status === "CANCELLED") {
        return res.status(409).json({
          error: "Não é possível editar um compromisso cancelado.",
        });
      }

      const result = AppointmentValidator.validateAppointment(
        req.body || {}
      );

      if (result.error) {
        return res.status(400).json({
          error: result.error,
        });
      }

      const professional = await findProfessional(
        result.data.professionalId
      );

      if (!professional) {
        return res.status(400).json({
          error: "O profissional selecionado não existe.",
        });
      }

      const conflict = await findConflict(result.data, id);

      if (conflict) {
        return res.status(409).json({
          error:
            "Esse profissional já possui um compromisso nesse horário.",
        });
      }

      const appointment = await prisma.appointment.update({
        where: { id },
        data: result.data,
        include: includeProfessional(),
      });

      res.json(appointment);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/appointments/:id/cancel", async (req, res, next) => {
    try {
      const id = AppointmentValidator.parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error: "ID do compromisso inválido.",
        });
      }

      const existing = await prisma.appointment.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({
          error: "Compromisso não encontrado.",
        });
      }

      if (existing.status === "CANCELLED") {
        return res.status(409).json({
          error: "Esse compromisso já está cancelado.",
        });
      }

      const appointment = await prisma.appointment.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: includeProfessional(),
      });

      res.json(appointment);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createAppointmentsRouter };