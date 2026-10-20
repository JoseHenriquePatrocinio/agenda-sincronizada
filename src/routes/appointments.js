const express = require("express");
const { AppointmentValidator } = require("../utils/appointment-validator");
const { createAppointmentService } = require("../services/appointment-service");

function createAppointmentsRouter(prisma, requireAuth) {
  const router = express.Router();
  const appointmentService = createAppointmentService(prisma);

  router.use(requireAuth);

  function emitAgendaChanged(req, appointment, action) {
    const io = req.app.get("io");

    if (!io) {
      console.error("Socket.IO não está configurado.");
      return;
    }

    try {
      io.emit("agenda:changed", {
        action,
        appointmentId: appointment.id,
        professionalId: appointment.professionalId,
        startAt: appointment.startAt,
      });
    } catch (error) {
      console.error("Erro ao emitir atualização da agenda:", error);
    }
  }

  function handleError(error, next, res) {
    if (error.status) {
      return res.status(error.status).json({
        error: error.message,
      });
    }

    next(error);
  }

  router.get("/professionals", async (req, res, next) => {
    try {
      const professionals =
        await appointmentService.findProfessionals();

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

      const appointments =
        await appointmentService.findAppointments(
          professionalId,
          dateResult.data
        );

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

      const appointment = await appointmentService.create(
        result.data
      );

      emitAgendaChanged(req, appointment, "created");
      res.status(201).json(appointment);
    } catch (error) {
      handleError(error, next, res);
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

      const result = AppointmentValidator.validateAppointment(
        req.body || {}
      );

      if (result.error) {
        return res.status(400).json({
          error: result.error,
        });
      }

      const appointment = await appointmentService.update(
        id,
        result.data
      );

      emitAgendaChanged(req, appointment, "updated");
      res.json(appointment);
    } catch (error) {
      handleError(error, next, res);
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

      const appointment = await appointmentService.cancel(id);

      emitAgendaChanged(req, appointment, "cancelled");
      res.json(appointment);
    } catch (error) {
      handleError(error, next, res);
    }
  });

  return router;
}

module.exports = { createAppointmentsRouter };