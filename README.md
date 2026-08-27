## Booklly

A full-stack book tracking dashboard where you can manage your reading list — books you want to read, are currently reading, or have already finished.

Built as a CRUD application with a REST API backend, relational database, and a vanilla JavaScript front-end (no frameworks).

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

---

## Overview

Booklly lets you keep track of your personal library with three reading states — **Want to Read**, **Reading**, and **Read** — plus ratings and reading dates for finished books. It was built to practice designing and consuming a REST API from scratch, without relying on a front-end framework.

## Features

- Full CRUD (Create, Read, Update, Delete) for books;
- Filter books by reading status;
- Star rating and reading date for finished books;
- Optional cover image via URL, with a styled fallback when none is provided;
- Responsive card-based layout.

## Tech Stack

| Layer | Technology |
|---|---|
| Front-end | HTML5, CSS3, vanilla JavaScript (Fetch API) |
| Back-end | Node.js, Express |
| Database | MySQL |

No front-end framework was used intentionally, to focus on core JavaScript and DOM manipulation fundamentals.

### Prerequisites
- Node.js v18+;
- MySQL Server running locally.

### Login

Execute o script `schema.sql` no MySQL antes de iniciar o servidor. Abra `login.html` para entrar ou clique em **Criar conta** para cadastrar um novo usuário. No ambiente local, o acesso demo usa `admin@booklly.com` e `booklly2026`. Para trocar esses valores, defina `LOGIN_USER`, `LOGIN_PASSWORD` e `SESSION_SECRET` no ambiente antes de iniciar o servidor.

## Roadmap

- [ ] Search by title/author;
- [ ] Pagination for large libraries;
- [ ] Cover image upload instead of URL only;
- [ ] Automated API tests;
- [ ] Deployment (Render/Railway).
