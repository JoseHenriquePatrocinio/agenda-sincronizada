const professionalSelect = document.querySelector("#professionalId");
const dateInput = document.querySelector("#date");
const loadButton = document.querySelector("#loadButton");
const appointmentsContainer = document.querySelector("#appointments");
const message = document.querySelector("#message");
const newButton = document.querySelector("#newButton");
const appointmentDialog = document.querySelector("#appointmentDialog");
const appointmentForm = document.querySelector("#appointmentForm");
const appointmentProfessionalSelect = document.querySelector("#appointmentProfessionalId");
const dialogTitle = document.querySelector("#dialogTitle");
const formMessage = document.querySelector("#formMessage");
const saveButton = document.querySelector("#saveButton");
const closeDialog = document.querySelector("#closeDialog");
const connectionStatus = document.querySelector("#connection");

const socket = window.socket;
let professionals = [];

async function apiRequest(url, method = "GET", body = null) {
  const options = {
    method,
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  };

  if (body !== null) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (response.status === 401 || response.status === 403) {
    window.location.replace("/login.html");
    throw new Error("Sessão inválida ou expirada.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || "Não foi possível concluir a operação."
    );
  }

  return data;
}

function fillProfessionalOptions(selectedId = "") {
  appointmentProfessionalSelect.replaceChildren();

  for (const professional of professionals) {
    const option = document.createElement("option");
    option.value = String(professional.id);
    option.textContent = professional.name;
    appointmentProfessionalSelect.append(option);
  }

  if (selectedId) {
    appointmentProfessionalSelect.value = String(selectedId);
  }
}

function openCreateDialog() {
  appointmentForm.reset();
  delete appointmentForm.dataset.appointmentId;

  dialogTitle.textContent = "Novo agendamento";
  formMessage.textContent = "";
  saveButton.textContent = "Salvar";

  fillProfessionalOptions(professionalSelect.value);
  appointmentDialog.showModal();
}

function openEditDialog(appointment) {
  appointmentForm.reset();
  appointmentForm.dataset.appointmentId = String(appointment.id);

  dialogTitle.textContent = "Editar agendamento";
  formMessage.textContent = "";
  saveButton.textContent = "Salvar alterações";

  fillProfessionalOptions(appointment.professionalId);

  appointmentForm.elements.patientName.value = appointment.patientName;
  appointmentForm.elements.title.value = appointment.title;
  appointmentForm.elements.startAt.value = AgendaUtils.toDateTimeLocal(appointment.startAt);
  appointmentForm.elements.endAt.value = AgendaUtils.toDateTimeLocal(appointment.endAt);

  appointmentDialog.showModal();
}

function renderAppointments(appointments) {
  appointmentsContainer.replaceChildren();

  const formattedDate = AgendaUtils.formatDate(dateInput.value);

  if (appointments.length === 0) {
    message.textContent = `Nenhum compromisso encontrado para ${formattedDate}.`;
    return;
  }

  message.textContent = `${appointments.length} compromisso(s) encontrado(s) para ${formattedDate}.`;

  for (const appointment of appointments) {
    const card = document.createElement("article");
    card.className = "appointment";

    const isCancelled = appointment.status === "CANCELLED";

    if (isCancelled) {
      card.classList.add("cancelled");
    }

    const details = document.createElement("div");

    const patient = document.createElement("h3");
    patient.textContent = appointment.patientName;

    const description = document.createElement("p");
    description.textContent = appointment.title;

    const professional = document.createElement("p");
    professional.textContent = appointment.professional.name;

    details.append(patient, description, professional);

    const schedule = document.createElement("div");

    const time = document.createElement("strong");
    time.textContent =
      `${AgendaUtils.formatTime(appointment.startAt)} – ` +
      `${AgendaUtils.formatTime(appointment.endAt)}`;

    const status = document.createElement("p");
    status.textContent = isCancelled ? "Cancelado" : "Agendado";

    schedule.append(time, status);
    card.append(details, schedule);

    if (!isCancelled) {
      const actions = document.createElement("div");
      actions.className = "appointment-actions";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "secondary";
      editButton.textContent = "Editar";
      editButton.addEventListener("click", () => {
        openEditDialog(appointment);
      });

      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.className = "danger";
      cancelButton.textContent = "Cancelar";

      cancelButton.addEventListener("click", async () => {
        const confirmed = window.confirm(
          `Deseja cancelar o agendamento de ${appointment.patientName}?`
        );

        if (!confirmed) return;

        cancelButton.disabled = true;

        try {
          await apiRequest(
            `/api/appointments/${appointment.id}/cancel`,
            "PATCH"
          );

          await loadAppointments();
        } catch (error) {
          message.textContent = error.message;
          cancelButton.disabled = false;
        }
      });

      actions.append(editButton, cancelButton);
      card.append(actions);
    }

    appointmentsContainer.append(card);
  }
}

async function loadProfessionals() {
  professionalSelect.disabled = true;
  newButton.disabled = true;

  try {
    professionals = await apiRequest("/api/professionals");
    professionalSelect.replaceChildren();

    for (const professional of professionals) {
      const option = document.createElement("option");
      option.value = String(professional.id);
      option.textContent = professional.name;
      professionalSelect.append(option);
    }

    fillProfessionalOptions();

    if (professionals.length === 0) {
      message.textContent = "Nenhum profissional cadastrado.";
      loadButton.disabled = true;
      return;
    }

    const defaultProfessional =
      professionals.find((professional) => professional.id === 1) ||
      professionals[0];

    professionalSelect.value = String(defaultProfessional.id);
    appointmentProfessionalSelect.value = String(defaultProfessional.id);

    await loadAppointments();
  } finally {
    professionalSelect.disabled = false;
    newButton.disabled = professionals.length === 0;
  }
}

async function loadAppointments({ preserveList = false } = {}) {
  const professionalId = professionalSelect.value;
  const date = dateInput.value;

  if (!professionalId || !date) {
    message.textContent = "Selecione um profissional e uma data.";
    appointmentsContainer.replaceChildren();
    return;
  }

  loadButton.disabled = true;

  if (!preserveList) {
    message.textContent = "Carregando agenda...";
    appointmentsContainer.replaceChildren();
  }

  try {
    const params = new URLSearchParams({ professionalId, date });
    const appointments = await apiRequest(
      `/api/appointments?${params.toString()}`
    );

    renderAppointments(appointments);
  } catch (error) {
    message.textContent = error.message;
  } finally {
    loadButton.disabled = false;
  }
}

loadButton.addEventListener("click", loadAppointments);
professionalSelect.addEventListener("change", loadAppointments);
dateInput.addEventListener("change", loadAppointments);
newButton.addEventListener("click", openCreateDialog);

closeDialog.addEventListener("click", () => {
  appointmentDialog.close();
});

appointmentDialog.addEventListener("close", () => {
  appointmentForm.reset();
  delete appointmentForm.dataset.appointmentId;
  formMessage.textContent = "";
});

appointmentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!appointmentForm.reportValidity()) {
    return;
  }

  const appointmentId = appointmentForm.dataset.appointmentId;

  const result = AgendaUtils.validateAppointmentForm({
    professionalId: appointmentProfessionalSelect.value,
    patientName: appointmentForm.elements.patientName.value,
    title: appointmentForm.elements.title.value,
    startAt: appointmentForm.elements.startAt.value,
    endAt: appointmentForm.elements.endAt.value,
  });

  if (result.error) {
    formMessage.textContent = result.error;
    return;
  }

  saveButton.disabled = true;
  formMessage.textContent = "Salvando...";

  try {
    await apiRequest(
      appointmentId
        ? `/api/appointments/${appointmentId}`
        : "/api/appointments",
      appointmentId ? "PUT" : "POST",
      result.data
    );

    appointmentDialog.close();

    professionalSelect.value = String(result.data.professionalId);
    dateInput.value = result.selectedDate;

    await loadAppointments();
  } catch (error) {
    formMessage.textContent = error.message;
  } finally {
    saveButton.disabled = false;
  }
});

dateInput.value = AgendaUtils.getLocalDate();

loadProfessionals().catch((error) => {
  message.textContent = error.message;
});

socket.on("connect", () => {
  if (connectionStatus) {
    connectionStatus.textContent = "Conectado em tempo real";
  }
});

socket.on("disconnect", () => {
  if (connectionStatus) {
    connectionStatus.textContent = "Reconectando...";
  }
});

socket.on("connect_error", (error) => {
  if (connectionStatus) {
    connectionStatus.textContent =
      error.message === "Não autenticado."
        ? "Sessão inválida"
        : "Conexão indisponível";
  }
});

socket.on("agenda:changed", () => {
  loadAppointments({ preserveList: true });
});