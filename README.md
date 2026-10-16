# agenda-sincronizada

Teste técnico - agenda clínica com atualização em tempo real.

## Pré-requisitos

- Node.js 20+
- Docker com Docker Compose

## Como executar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo de ambiente:

   ```bash
   cp .env.example .env
   ```

3. Inicie o PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

4. Gere o cliente e crie as tabelas:

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. Insira dados iniciais:

   ```bash
   node prisma/seed.js
   ```

6. Inicie a aplicação:

   ```bash
   npm run dev
   ```

Acesse `http://localhost:3000`.

## Login inicial

- Usuário: `admin`
- Senha: `admin123`