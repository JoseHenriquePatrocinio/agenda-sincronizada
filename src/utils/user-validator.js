class UserValidator{
        static validateUsername(username) {
        if (
            typeof username !== "string" ||
            !/^[a-zA-Z0-9_.-]{3,50}$/.test(username)
        ) {
            return "O usuário deve ter de 3 a 50 caracteres: letras, números, ponto, hífen ou sublinhado.";
        }

        return null;
        }

        static validatePassword(password) {
        if (
            typeof password !== "string" ||
            password.length < 8 ||
            password.length > 72
        ) {
            return "A senha deve ter entre 8 e 72 caracteres.";
        }

        return null;
        }

        static validateRole(role) {
        if (!["ADMIN", "USER"].includes(role)) {
            return "Perfil de usuário inválido.";
        }

        return null;
        }

        static validateUserId(id) {
        const userId = Number(id);

        if (
            !Number.isSafeInteger(userId) ||
            userId <= 0
        ) {
            return null;
        }

        return userId;
        }
    }
    
module.exports = { UserValidator };  