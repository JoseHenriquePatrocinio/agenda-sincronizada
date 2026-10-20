function createAppointmentService(prisma) {
    function includeProfessional() {
      return {
        professional: {
          select: { id: true, name: true },
        },
      };
    }
  
    async function findProfessional(professionalId) {
      return prisma.professional.findUnique({
        where: { id: professionalId },
        select: { id: true },
      });
    }
  
    async function findConflict(data, excludeId = null) {
      return prisma.appointment.findFirst({
        where: {
          professionalId: data.professionalId,
          status: "SCHEDULED",
          startAt: { lt: data.endAt },
          endAt: { gt: data.startAt },
          ...(excludeId !== null
            ? { id: { not: excludeId } }
            : {}),
        },
        select: { id: true },
      });
    }
  
    async function findProfessionals() {
      return prisma.professional.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      });
    }
  
    async function findAppointments(professionalId, date) {
      return prisma.appointment.findMany({
        where: {
          professionalId,
          startAt: {
            gte: date.startOfDay,
            lt: date.endOfDay,
          },
        },
        orderBy: { startAt: "asc" },
        include: includeProfessional(),
      });
    }
  
    async function create(data) {
      const professional = await findProfessional(
        data.professionalId
      );
  
      if (!professional) {
        const error = new Error(
          "O profissional selecionado não existe."
        );
        error.status = 400;
        throw error;
      }
  
      const conflict = await findConflict(data);
  
      if (conflict) {
        const error = new Error(
          "Esse profissional já possui um compromisso nesse horário."
        );
        error.status = 409;
        throw error;
      }
  
      return prisma.appointment.create({
        data,
        include: includeProfessional(),
      });
    }
  
    async function update(id, data) {
      const existing = await prisma.appointment.findUnique({
        where: { id },
      });
  
      if (!existing) {
        const error = new Error("Compromisso não encontrado.");
        error.status = 404;
        throw error;
      }
  
      if (existing.status === "CANCELLED") {
        const error = new Error(
          "Não é possível editar um compromisso cancelado."
        );
        error.status = 409;
        throw error;
      }
  
      const professional = await findProfessional(
        data.professionalId
      );
  
      if (!professional) {
        const error = new Error(
          "O profissional selecionado não existe."
        );
        error.status = 400;
        throw error;
      }
  
      const conflict = await findConflict(data, id);
  
      if (conflict) {
        const error = new Error(
          "Esse profissional já possui um compromisso nesse horário."
        );
        error.status = 409;
        throw error;
      }
  
      return prisma.appointment.update({
        where: { id },
        data,
        include: includeProfessional(),
      });
    }
  
    async function cancel(id) {
      const existing = await prisma.appointment.findUnique({
        where: { id },
      });
  
      if (!existing) {
        const error = new Error("Compromisso não encontrado.");
        error.status = 404;
        throw error;
      }
  
      if (existing.status === "CANCELLED") {
        const error = new Error(
          "Esse compromisso já está cancelado."
        );
        error.status = 409;
        throw error;
      }
  
      return prisma.appointment.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: includeProfessional(),
      });
    }
  
    return {
      findProfessionals,
      findAppointments,
      create,
      update,
      cancel,
    };
  }
  
  module.exports = { createAppointmentService };  