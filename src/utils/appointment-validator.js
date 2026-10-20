class AppointmentValidator {
    static parseId(value) {
      const id = Number(value);
  
      return Number.isInteger(id) && id > 0 ? id : null;
    }
  
    static validateAppointment(body = {}) {
      const professionalId = this.parseId(body.professionalId);
  
      const patientName =
        typeof body.patientName === "string"
          ? body.patientName.trim()
          : "";
  
      const title =
        typeof body.title === "string"
          ? body.title.trim()
          : "";
  
      if (!professionalId) {
        return {
          error: "Selecione um profissional válido.",
        };
      }
  
      if (!patientName || patientName.length > 150) {
        return {
          error: "Informe o nome do paciente.",
        };
      }
  
      if (!title || title.length > 150) {
        return {
          error: "Informe uma descrição.",
        };
      }
  
      if (
        typeof body.startAt !== "string" ||
        typeof body.endAt !== "string" ||
        !body.startAt ||
        !body.endAt
      ) {
        return {
          error: "Informe horários válidos.",
        };
      }
  
      const startAt = new Date(body.startAt);
      const endAt = new Date(body.endAt);
  
      if (
        Number.isNaN(startAt.getTime()) ||
        Number.isNaN(endAt.getTime())
      ) {
        return {
          error: "Informe horários válidos.",
        };
      }
  
      if (endAt <= startAt) {
        return {
          error: "O horário final deve ser posterior ao inicial.",
        };
      }
  
      return {
        data: {
          professionalId,
          patientName,
          title,
          startAt,
          endAt,
        },
      };
    }
  
    static validateDate(date) {
      if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
      ) {
        return {
          error: "Informe a data no formato AAAA-MM-DD.",
        };
      }
  
      const startOfDay = new Date(`${date}T00:00:00-03:00`);
  
      if (
        Number.isNaN(startOfDay.getTime()) ||
        startOfDay.toISOString().slice(0, 10) !== date
      ) {
        return {
          error: "A data informada é inválida.",
        };
      }
  
      const endOfDay = new Date(
        startOfDay.getTime() + 24 * 60 * 60 * 1000
      );
  
      return {
        data: {
          startOfDay,
          endOfDay,
        },
      };
    }
  }
  
module.exports = { AppointmentValidator };  