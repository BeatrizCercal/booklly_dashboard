CREATE DATABASE IF NOT EXISTS dashboard_livros;
USE dashboard_livros;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(160) NOT NULL,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS livros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    genero VARCHAR(100),
    capa_url VARCHAR(500),
    status ENUM('quero_ler', 'lendo', 'lido') NOT NULL DEFAULT 'quero_ler',
    nota TINYINT UNSIGNED DEFAULT NULL,
    data_leitura DATE DEFAULT NULL,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

USE dashboard_livros;

INSERT INTO usuarios (nome, email, senha_hash)
VALUES (
  'Admin',
  'admin@gmail.com',
  '123456'
);
