require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const USUARIO_LOGIN = process.env.LOGIN_USER || 'admin@booklly.com';
const SENHA_LOGIN = process.env.LOGIN_PASSWORD || 'booklly2026';
const SEGREDO_SESSAO = process.env.SESSION_SECRET || 'booklly-segredo-local';

function criarHashSenha(senha) {
  return new Promise((resolve, reject) => {
    const sal = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(senha, sal, 64, (erro, derivada) => {
      if (erro) return reject(erro);
      resolve(`${sal}:${derivada.toString('hex')}`);
    });
  });
}

function verificarSenha(senha, senhaArmazenada) {
  return new Promise(resolve => {
    const [sal, hash] = (senhaArmazenada || '').split(':');
    if (!sal || !hash) return resolve(false);
    crypto.scrypt(senha, sal, 64, (erro, derivada) => {
      if (erro) return resolve(false);
      const hashRecebido = Buffer.from(hash, 'hex');
      resolve(hashRecebido.length === derivada.length && crypto.timingSafeEqual(hashRecebido, derivada));
    });
  });
}

function criarTokenSessao(usuario) {
  const dados = Buffer.from(JSON.stringify({ usuario, expira: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
  const assinatura = crypto.createHmac('sha256', SEGREDO_SESSAO).update(dados).digest('base64url');
  return `${dados}.${assinatura}`;
}

function sessaoValida(req) {
  const cookies = (req.headers.cookie || '').split(';').reduce((resultado, item) => {
    const [chave, ...valor] = item.trim().split('=');
    if (chave) resultado[chave] = valor.join('=');
    return resultado;
  }, {});
  const [dados, assinatura] = (cookies.booklly_sessao || '').split('.');
  if (!dados || !assinatura) return false;
  const assinaturaEsperada = crypto.createHmac('sha256', SEGREDO_SESSAO).update(dados).digest('base64url');
  if (assinatura.length !== assinaturaEsperada.length || !crypto.timingSafeEqual(Buffer.from(assinatura), Buffer.from(assinaturaEsperada))) return false;
  try {
    return JSON.parse(Buffer.from(dados, 'base64url').toString()).expira > Date.now();
  } catch {
    return false;
  }
}

function exigirSessao(req, res, next) {
  if (sessaoValida(req)) return next();
  res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/auth/login', async (req, res) => {
  const email = (req.body.usuario || '').trim().toLowerCase();
  const senha = req.body.senha || '';
  let autenticado = email === USUARIO_LOGIN.toLowerCase() && senha === SENHA_LOGIN;
  try {
    const [usuarios] = await pool.query('SELECT email, senha_hash FROM usuarios WHERE email = ?', [email]);
    if (usuarios.length > 0) autenticado = await verificarSenha(senha, usuarios[0].senha_hash);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao conectar com o banco de dados.' });
  }
  if (!autenticado) return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
  res.setHeader('Set-Cookie', `booklly_sessao=${criarTokenSessao(email)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`);
  res.json({ usuario: email });
});

app.post('/api/auth/cadastro', async (req, res) => {
  const nome = (req.body.nome || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const senha = req.body.senha || '';
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
  if (senha.length < 6) return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
  try {
    const senhaHash = await criarHashSenha(senha);
    await pool.query('INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)', [nome, email, senhaHash]);
    res.status(201).json({ mensagem: 'Conta criada com sucesso.' });
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    console.error(erro);
    res.status(500).json({ erro: 'Não foi possível criar sua conta.' });
  }
});

app.get('/api/auth/me', (req, res) => {
  res.status(sessaoValida(req) ? 200 : 401).json({ autenticado: sessaoValida(req) });
});

app.post('/api/auth/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'booklly_sessao=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  res.json({ mensagem: 'Sessão encerrada.' });
});

app.get('/api/livros', exigirSessao, async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM livros';
    const params = [];
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY data_cadastro DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar livros' });
  }
});

app.get('/api/livros/:id', exigirSessao, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM livros WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ erro: 'Livro não encontrado' });
    res.json(rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar livro' });
  }
});

app.post('/api/livros', exigirSessao, async (req, res) => {
  try {
    const { titulo, autor, genero, capa_url, status, nota, data_leitura } = req.body;
    if (!titulo || !autor) return res.status(400).json({ erro: 'Título e autor são obrigatórios' });
    const [resultado] = await pool.query(
      `INSERT INTO livros (titulo, autor, genero, capa_url, status, nota, data_leitura)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [titulo, autor, genero || null, capa_url || null, status || 'quero_ler', nota || null, data_leitura || null]
    );
    res.status(201).json({ id: resultado.insertId, mensagem: 'Livro criado com sucesso' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao criar livro' });
  }
});

app.put('/api/livros/:id', exigirSessao, async (req, res) => {
  try {
    const { titulo, autor, genero, capa_url, status, nota, data_leitura } = req.body;
    const [resultado] = await pool.query(
      'UPDATE livros SET titulo = ?, autor = ?, genero = ?, capa_url = ?, status = ?, nota = ?, data_leitura = ? WHERE id = ?',
      [titulo, autor, genero || null, capa_url || null, status, nota || null, data_leitura || null, req.params.id]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Livro não encontrado' });
    res.json({ mensagem: 'Livro atualizado com sucesso' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao atualizar livro' });
  }
});

app.delete('/api/livros/:id', exigirSessao, async (req, res) => {
  try {
    const [resultado] = await pool.query('DELETE FROM livros WHERE id = ?', [req.params.id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Livro não encontrado' });
    res.json({ mensagem: 'Livro removido com sucesso' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao remover livro' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
