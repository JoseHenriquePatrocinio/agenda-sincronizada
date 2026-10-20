const userForm = document.getElementById("userForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const roleInput = document.getElementById("role");

const formMessage = document.getElementById("formMessage");
const listMessage = document.getElementById("listMessage");
const usersTableBody = document.getElementById("usersTableBody");

const saveButton = document.getElementById("saveButton");
const refreshButton = document.getElementById("refreshButton");
const agendaButton = document.getElementById("agendaButton");

function showFormMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle("error", isError);
}

function showListMessage(message, isError = false) {
  listMessage.textContent = message;
  listMessage.classList.toggle("error", isError);
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    window.location.replace("/login.html");
    throw new Error("Sua sessão expirou. Entre novamente.");
  }

  if (response.status === 403) {
    throw new Error(
      "Acesso negado. Esta área é exclusiva para administradores."
    );
  }

  if (!response.ok) {
    throw new Error(data.error || "Não foi possível concluir a operação.");
  }

  return data;
}

function createCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  return cell;
}

function renderUsers(users) {
  usersTableBody.replaceChildren();

  if (users.length === 0) {
    const row = document.createElement("tr");
    const cell = createCell("Nenhum usuário cadastrado.");

    cell.colSpan = 6;
    row.appendChild(cell);
    usersTableBody.appendChild(row);
    return;
  }

  for (const user of users) {
    const row = document.createElement("tr");

    row.appendChild(createCell(String(user.id)));
    row.appendChild(createCell(user.username));

    row.appendChild(
      createCell(
        user.role === "ADMIN" ? "Administrador" : "Usuário"
      )
    );

    const statusCell = createCell(
      user.isActive ? "Ativo" : "Inativo"
    );

    statusCell.classList.add(
      user.isActive ? "status-active" : "status-inactive"
    );

    row.appendChild(statusCell);
    row.appendChild(createCell(AgendaUtils.formatDateShort(user.createdAt)));

    const actionsCell = document.createElement("td");

    if (user.isActive && !user.isCurrentUser) {
      const deactivateButton = document.createElement("button");

      deactivateButton.type = "button";
      deactivateButton.className = "secondary";
      deactivateButton.textContent = "Desativar";

      deactivateButton.addEventListener("click", () => {
        deactivateUser(user, deactivateButton);
      });

      actionsCell.appendChild(deactivateButton);
    } else if (user.isCurrentUser) {
      actionsCell.textContent = "Conta atual";
    } else {
      actionsCell.textContent = "-";
    }

    row.appendChild(actionsCell);
    usersTableBody.appendChild(row);
  }
}

async function loadUsers() {
  refreshButton.disabled = true;
  showListMessage("Carregando usuários...");

  try {
    const data = await apiRequest("/api/users");

    renderUsers(data.users);

    showListMessage(
      `${data.users.length} usuário(s) encontrado(s).`
    );
  } catch (error) {
    usersTableBody.replaceChildren();

    const row = document.createElement("tr");
    const cell = createCell(error.message);

    cell.colSpan = 6;
    row.appendChild(cell);
    usersTableBody.appendChild(row);

    showListMessage(
      "Não foi possível carregar os usuários.",
      true
    );
  } finally {
    refreshButton.disabled = false;
  }
}

async function deactivateUser(user, button) {
  const confirmed = window.confirm(
    `Deseja realmente desativar o usuário "${user.username}"?`
  );

  if (!confirmed) return;

  button.disabled = true;
  showListMessage(`Desativando o usuário "${user.username}"...`);

  try {
    const data = await apiRequest(
      `/api/users/${encodeURIComponent(user.id)}/deactivate`,
      {
        method: "PATCH",
      }
    );

    showListMessage(data.message);

    await loadUsers();
  } catch (error) {
    showListMessage(error.message, true);
    button.disabled = false;
  }
}

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!userForm.reportValidity()) return;

  saveButton.disabled = true;
  showFormMessage("Cadastrando usuário...");

  const payload = {
    username: usernameInput.value.trim(),
    password: passwordInput.value,
    role: roleInput.value,
  };

  try {
    const data = await apiRequest("/api/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    userForm.reset();
    roleInput.value = "USER";

    showFormMessage(
      data.message || "Usuário cadastrado com sucesso."
    );

    await loadUsers();
  } catch (error) {
    showFormMessage(error.message, true);
  } finally {
    saveButton.disabled = false;
  }
});

refreshButton.addEventListener("click", loadUsers);

agendaButton.addEventListener("click", () => {
  window.location.href = "/";
});

loadUsers();