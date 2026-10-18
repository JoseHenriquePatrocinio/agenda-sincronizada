const logoutButton = document.querySelector("#logoutButton");

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });

    if (response.ok) {
      window.location.replace("/login.html");
      return;
    }

    alert("Não foi possível encerrar a sessão.");
  } catch (error) {
    alert("Erro de conexão ao encerrar a sessão.");
  } finally {
    logoutButton.disabled = false;
  }
});