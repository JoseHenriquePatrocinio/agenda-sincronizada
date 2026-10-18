const loginForm = document.querySelector("#loginForm");
const loginButton = document.querySelector("#loginButton");
const message = document.querySelector("#message");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  message.textContent = "";
  loginButton.disabled = true;

  const formData = new FormData(loginForm);

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      message.textContent =
        data.error || "Não foi possível realizar o login.";
      return;
    }

    window.location.replace("/agenda.html");
  } catch (error) {
    message.textContent = "Erro de conexão com o servidor.";
  } finally {
    loginButton.disabled = false;
  }
});