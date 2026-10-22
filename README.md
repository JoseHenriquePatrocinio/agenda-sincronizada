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

3. Inicie o PostgreSQL/Redis:

   ```bash
   docker compose up -d
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

## Decisões técnicas

1. **Monólito primeiro:** abordagem inspirada nos princípios defendidos por Martin Fowler, priorizando uma aplicação única e centralizada para reduzir a complexidade inicial.
2. **Sem framework frontend:** reduzir a complexidade e evitar abstrações e arquivos desnecessários.
3. **WebSocket:** comunicação bidirecional para atualizações em tempo real, sem depender de polling constante.
4. **Dockerização dos bancos de dados:** padronizar o ambiente de desenvolvimento e aproximá-lo da infraestrutura utilizada em produção.
5. **Node.js:** escolhido pela versatilidade no desenvolvimento web e pelo ecossistema de bibliotecas para comunicação em tempo real.
6. **Prisma:** ORM que simplifica o acesso ao banco de dados e a implementação de operações CRUD.
7. **PostgreSQL:** banco de dados relacional robusto, confiável e bem documentado.
8. **Redis:** banco de dados em memória utilizado para armazenar sessões, oferecendo acesso rápido aos dados.
9. **Arquitetura em camadas (N-tier):** separação de responsabilidades para facilitar a manutenção, a organização e a evolução do sistema.

## Próximos passos

1. **Adicionar Nginx:** configurar um proxy reverso e preparar a aplicação para uma implantação mais estruturada.
