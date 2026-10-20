class AgendaUtils {
    static TIME_ZONE = "America/Sao_Paulo";
  
    static getDateParts(value = new Date()) {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: this.TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).formatToParts(value);
  
      return Object.fromEntries(
        parts
          .filter((part) => part.type !== "literal")
          .map((part) => [part.type, part.value])
      );
    }
  
    static getLocalDate() {
      const { year, month, day } = this.getDateParts();
  
      return `${year}-${month}-${day}`;
    }
  
    static formatTime(value) {
      return new Intl.DateTimeFormat("pt-BR", {
        timeZone: this.TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date(value));
    }
  
    static formatDate(value) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  
      if (!match) {
        return value || "";
      }
  
      const [, year, month, day] = match;
      const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        12
      );
  
      return new Intl.DateTimeFormat("pt-BR", {
        timeZone: this.TIME_ZONE,
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    }
  
    static toDateTimeLocal(value) {
      const { year, month, day, hour, minute } =
        this.getDateParts(new Date(value));
  
      return `${year}-${month}-${day}T${hour}:${minute}`;
    }
  
    static toApiDateTime(value) {
      const match =
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value || "");
  
      if (!match) {
        throw new Error("Informe uma data e um horário válidos.");
      }
  
      const [, year, month, day, hour, minute] = match.map(Number);
  
      const localAsUtc = Date.UTC(
        year,
        month - 1,
        day,
        hour,
        minute
      );
  
      const parts = this.getDateParts(new Date(localAsUtc));
  
      const representedAsUtc = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second)
      );
  
      const offset = representedAsUtc - localAsUtc;
      const result = new Date(localAsUtc - offset);
  
      if (Number.isNaN(result.getTime())) {
        throw new Error("A data ou o horário informado é inválido.");
      }
  
      const converted = this.getDateParts(result);
  
      if (
        converted.year !== String(year).padStart(4, "0") ||
        converted.month !== String(month).padStart(2, "0") ||
        converted.day !== String(day).padStart(2, "0") ||
        converted.hour !== String(hour).padStart(2, "0") ||
        converted.minute !== String(minute).padStart(2, "0")
      ) {
        throw new Error(
          "O horário informado não é válido no fuso de São Paulo."
        );
      }
  
      return result.toISOString();
    }
  
    static validateAppointmentForm({
      professionalId,
      patientName,
      title,
      startAt,
      endAt,
    }) {
      const parsedProfessionalId = Number(professionalId);
      const normalizedPatientName =
        typeof patientName === "string" ? patientName.trim() : "";
      const normalizedTitle =
        typeof title === "string" ? title.trim() : "";
  
      if (
        !Number.isInteger(parsedProfessionalId) ||
        parsedProfessionalId <= 0
      ) {
        return { error: "Selecione um profissional válido." };
      }
  
      if (
        !normalizedPatientName ||
        normalizedPatientName.length > 150
      ) {
        return {
          error: "Informe o nome do paciente.",
        };
      }
  
      if (!normalizedTitle || normalizedTitle.length > 150) {
        return {
          error: "Informe uma descrição.",
        };
      }
  
      if (!startAt || !endAt) {
        return { error: "Informe a data e o horário do compromisso." };
      }
  
      try {
        const parsedStartAt = this.toApiDateTime(startAt);
        const parsedEndAt = this.toApiDateTime(endAt);
  
        if (new Date(parsedEndAt) <= new Date(parsedStartAt)) {
          return {
            error: "O horário final deve ser posterior ao inicial.",
          };
        }
  
        return {
          data: {
            professionalId: parsedProfessionalId,
            patientName: normalizedPatientName,
            title: normalizedTitle,
            startAt: parsedStartAt,
            endAt: parsedEndAt,
          },
          selectedDate: startAt.slice(0, 10),
        };
      } catch (error) {
        return {
          error: error.message || "A data ou o horário informado é inválido.",
        };
      }
    }
}