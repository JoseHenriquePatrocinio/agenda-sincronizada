const professionalSelect = document.querySelector("#professionalId");

const dateInput = document.querySelector("#date");
const loadButton = document.querySelector("#loadButton");
const appointmentsContainer = document.querySelector("#appointments");

const message = document.querySelector("#message");

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(`${value}T12:00:00-03:00`));
}

async function apiGet(url) {
  const response = await fetch(url, {
    method: "GET",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 401 || response.status === 403) {
    window.location.replace("/login.html");
    throw new Error("Sessão inválida ou expirada.");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro ao consultar o servidor.");
  }

  return data;
}

function renderAppointments(appointments) {
  appointmentsContainer.replaceChildren();

  if (appointments.length === 0) {
    message.textContent =
      "Nenhum compromisso encontrado para esta data.";
    return;
  }

  message.textContent = `${appointments.length} compromisso(s) encontrado(s).`;

  for (const appointment of appointments) {
    const card = document.createElement("article");
    card.className = "appointment";

    if (appointment.status === "CANCELLED") {
      card.classList.add("cancelled");
    }

    const details = document.createElement("div");

    const title = document.createElement("h3");
    title.textContent = appointment.patientName;

    const description = document.createElement("p");
    description.textContent = appointment.title;

    const professional = document.createElement("p");
    professional.textContent =
      appointment.professional.name;

    details.append(title, description, professional);

    const schedule = document.createElement("div");

    const time = document.createElement("strong");
    time.textContent =
      `${formatTime(appointment.startAt)} – ` +
      `${formatTime(appointment.endAt)}`;

    const status = document.createElement("p");
    status.textContent =
      appointment.status === "CANCELLED"
        ? "Cancelado"
        : "Agendado";

    schedule.append(time, status);
    card.append(details, schedule);

    appointmentsContainer.append(card);
  }
}

async function loadProfessionals() {
  professionalSelect.disabled = true;

  const professionals = await apiGet("/api/professionals");

  professionalSelect.replaceChildren();

  for (const professional of professionals) {
    const option = document.createElement("option");

    option.value = String(professional.id);
    option.textContent = professional.name;

    professionalSelect.append(option);
  }

  professionalSelect.disabled = false;

  if (professionals.length === 0) {
    message.textContent = "Nenhum profissional cadastrado.";
    loadButton.disabled = true;
    return;
  }

  const firstProfessional = professionals.find(
    (professional) => professional.id === 1
  );

  if (firstProfessional) {
    professionalSelect.value = "1";
  }

  await loadAppointments();
}

async function loadAppointments() {
  const professionalId = professionalSelect.value;
  const date = dateInput.value;

  if (!professionalId || !date) {
    message.textContent = "Selecione um profissional e uma data.";
    return;
  }

  loadButton.disabled = true;
  message.textContent = "Carregando agenda...";
  appointmentsContainer.replaceChildren();

  try {
    const params = new URLSearchParams({
      professionalId,
      date,
    });

    const appointments = await apiGet(
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

professionalSelect.addEventListener(
  "change",
  loadAppointments
);

dateInput.addEventListener("change", loadAppointments);

dateInput.value = getLocalDate();

loadProfessionals().catch((error) => {
  message.textContent = error.message;
});