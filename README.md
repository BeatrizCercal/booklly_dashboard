# Booklly

Dashboard para controlar sua biblioteca pessoal, com livros que você quer ler, está lendo ou já concluiu.

Este projeto está hospedado na Vercel e utiliza Node.js, Express e MySQL.

## Tecnologias

- HTML + CSS + JavaScript
- Node.js + Express
- MySQL

## Como rodar o banco

1. Instale o MySQL localmente.
2. Crie o banco e as tabelas executando o arquivo `schema.sql`.
3. O projeto já usa a base padrão abaixo:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=dashboard_livros
```

Se o seu ambiente tiver outra configuração, ajuste essas variáveis antes de iniciar o servidor.

## Como rodar localmente

```bash
npm install
npm start
```

Depois, abra o projeto no navegador e comece a usar.

## Requisitos

- Node.js instalado
- MySQL rodando localmente
