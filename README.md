# Minhas Economias

Aplicação de controle financeiro com frontend React/Vite e API Express. A API armazena cada conta de usuário e seus dados financeiros em um banco SQLite local.

## Requisitos

- Node.js 20.19+ ou 22.12+
- npm

## Executar localmente

1. Instale as dependências:
   ```sh
   npm install
   ```
2. Opcionalmente, copie `.env.example` para `.env` e ajuste `PORT` ou `DB_FILE`.
3. Inicie a API e o frontend:
   ```sh
   npm run dev
   ```
4. Abra http://localhost:3000 e crie uma conta. A senha deve ter pelo menos 10 caracteres.

O frontend encaminha as chamadas `/api` para o servidor Express na porta 3001. O banco é criado automaticamente em `data/minhas-economias.sqlite`.

## Dados e autenticação

- Cadastro e login são servidos por `/api/auth/register` e `/api/auth/login`.
- Senhas são armazenadas com hash scrypt; tokens de sessão aleatórios expiram em 30 dias e ficam armazenados como hash no banco.
- Cada usuário tem seu próprio conjunto de contas, categorias, transações e sonhos.
- No primeiro cadastro neste navegador, os dados que ainda estiverem no `localStorage` são copiados para a nova conta.
- Após o login, a API SQLite é a fonte persistente; as alterações são sincronizadas automaticamente.
- A sessão do navegador é encerrada pelo item **Sair** no menu do usuário.

Para validar tipos e gerar o frontend:

```sh
npm run lint
npm run build
```

Antes de publicar na internet, configure HTTPS, backups do arquivo SQLite e proteção contra tentativas automatizadas de login. Esta configuração é adequada para desenvolvimento local; uma implantação multiusuário de produção também deve usar banco gerenciado e controles operacionais apropriados.
