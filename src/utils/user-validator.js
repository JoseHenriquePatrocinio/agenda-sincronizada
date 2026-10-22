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
        
            const commonPasswords = [
                "12345678",
                "87654321",
                "123456789",
                "password",
                "password123",
                "qwerty123",
                "abcdefgh",
                "11111111",
                "00000000",
                "876543210"
            ];
        
            if (commonPasswords.includes(password.toLowerCase())) {
                return "Escolha uma senha mais segura.";
            }
        
            if (
                /0123456789|9876543210|abcdefghijklmnopqrstuvwxyz|zyxwvutsrqponmlkjihgfedcba/i.test(password)
            ) {
                return "A senha não pode conter sequências previsíveis.";
            }
        
            if (/^(.)\1+$/.test(password)) {
                return "A senha não pode conter apenas caracteres repetidos.";
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