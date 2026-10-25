const LABELS_STATUS = {
  quero_ler: 'Quero Ler',
  lendo: 'Lendo',
  lido: 'Lido'
};

/* ---------- Funções de apoio ---------- */

function escaparHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizar(texto) {
  return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function mostrarAviso(texto, tipo = 'erro') {
  let aviso = document.getElementById('aviso');
  if (!aviso) {
    aviso = document.createElement('div');
    aviso.id = 'aviso';
    aviso.setAttribute('role', 'status');
    document.body.appendChild(aviso);
  }
  aviso.textContent = texto;
  aviso.className = `aviso aviso-${tipo} visivel`;
  clearTimeout(mostrarAviso.timer);
  mostrarAviso.timer = setTimeout(() => aviso.classList.remove('visivel'), 3500);
}

async function verificarSessao() {
  if (location.pathname.endsWith('login.html') || location.pathname.endsWith('criar-conta.html')) return true;
  try {
    const resposta = await fetch('/api/auth/me');
    if (!resposta.ok) {
      location.href = 'login.html';
      return false;
    }
    return true;
  } catch {
    location.href = 'login.html';
    return false;
  }
}

/* ---------- Criar conta ---------- */

const formCadastro = document.getElementById('form-cadastro');

if (formCadastro) {
  formCadastro.addEventListener('submit', async evento => {
    evento.preventDefault();
    const mensagem = document.getElementById('mensagem-cadastro');
    const botao = formCadastro.querySelector('button');
    botao.disabled = true;
    mensagem.hidden = true;

    try {
      const resposta = await fetch('/api/auth/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: document.getElementById('nome').value,
          email: document.getElementById('email').value,
          senha: document.getElementById('senha-cadastro').value
        })
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível criar sua conta.');
      location.href = 'login.html?cadastro=sucesso';
    } catch (erro) {
      mensagem.textContent = erro.message;
      mensagem.hidden = false;
      botao.disabled = false;
    }
  });
}

/* ---------- Login ---------- */

const formLogin = document.getElementById('form-login');

if (formLogin) {
  fetch('/api/auth/me').then(resposta => {
    if (resposta.ok) location.href = 'index.html';
  });

  formLogin.addEventListener('submit', async evento => {
    evento.preventDefault();
    const mensagem = document.getElementById('mensagem-login');
    const botao = formLogin.querySelector('button');
    botao.disabled = true;
    mensagem.hidden = true;

    try {
      const resposta = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: document.getElementById('usuario').value,
          senha: document.getElementById('senha').value
        })
      });
      if (!resposta.ok) throw new Error((await resposta.json()).erro);
      location.href = 'index.html';
    } catch (erro) {
      mensagem.textContent = erro.message || 'Não foi possível entrar agora.';
      mensagem.hidden = false;
      botao.disabled = false;
    }
  });
}

/* ---------- Lista de livros (index.html) ---------- */

const listaLivros = document.getElementById('lista-livros');
let todosLivros = [];
let filtroStatus = '';
let termoBusca = '';

async function carregarLivros() {
  listaLivros.hidden = false;
  listaLivros.innerHTML = '<p class="mensagem-carregando">Carregando seus livros...</p>';
  try {
    const resposta = await fetch('/api/livros');
    if (resposta.status === 401) return verificarSessao();
    if (!resposta.ok) throw new Error('Erro ao buscar livros');
    todosLivros = await resposta.json();
    atualizarPainel();
    renderizarLivros();
  } catch (erro) {
    console.error('Erro ao carregar livros:', erro);
    listaLivros.innerHTML = '<p class="mensagem-carregando">Erro ao conectar com o servidor.</p>';
  }
}

function atualizarPainel() {
  if (!document.getElementById('painel')) return;
  const notas = todosLivros.map(livro => Number(livro.nota)).filter(nota => nota > 0);
  const media = notas.length
    ? (notas.reduce((soma, nota) => soma + nota, 0) / notas.length).toFixed(1).replace('.', ',')
    : '–';

  document.getElementById('total-livros').textContent = todosLivros.length;
  document.getElementById('total-lidos').textContent = todosLivros.filter(livro => livro.status === 'lido').length;
  document.getElementById('total-lendo').textContent = todosLivros.filter(livro => livro.status === 'lendo').length;
  document.getElementById('media-notas').textContent = media;
}

function renderizarLivros() {
  const mensagemVazio = document.getElementById('mensagem-vazio');
  const termo = normalizar(termoBusca.trim());

  const livros = todosLivros.filter(livro =>
    (!filtroStatus || livro.status === filtroStatus) &&
    (!termo || normalizar(livro.titulo).includes(termo) || normalizar(livro.autor).includes(termo))
  );

  if (livros.length === 0) {
    listaLivros.innerHTML = '';
    listaLivros.hidden = true;
    mensagemVazio.textContent = todosLivros.length === 0
      ? 'Nenhum livro cadastrado ainda. Que tal adicionar o primeiro?'
      : 'Nenhum livro encontrado com esse filtro.';
    mensagemVazio.hidden = false;
    return;
  }

  listaLivros.hidden = false;
  mensagemVazio.hidden = true;

  listaLivros.innerHTML = livros.map(livro => {
    const nota = Math.min(5, Math.max(0, Number(livro.nota) || 0));
    return `
      <article class="card-livro">
        ${livro.capa_url
          ? `<img class="card-capa" src="${escaparHtml(livro.capa_url)}" alt="Capa de ${escaparHtml(livro.titulo)}" data-titulo="${escaparHtml(livro.titulo)}">`
          : `<div class="card-capa-vazia">${escaparHtml(livro.titulo)}</div>`
        }
        <div class="card-corpo">
          <span class="selo-status selo-${escaparHtml(livro.status)}">${LABELS_STATUS[livro.status] || ''}</span>
          <h3 class="card-titulo">${escaparHtml(livro.titulo)}</h3>
          <p class="card-autor">${escaparHtml(livro.autor)}</p>
          ${livro.genero ? `<span class="card-genero">${escaparHtml(livro.genero)}</span>` : ''}
          ${nota ? `<span class="card-nota" aria-label="Nota ${nota} de 5">${'★'.repeat(nota)}${'☆'.repeat(5 - nota)}</span>` : ''}
          <div class="card-acoes">
            <a href="cadastrar.html?id=${livro.id}" class="botao botao-secundario botao-pequeno">Editar</a>
            <button type="button" class="botao botao-perigo botao-pequeno" data-excluir="${livro.id}">Excluir</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Se a capa não carregar, troca pela capa com o título
  listaLivros.querySelectorAll('.card-capa').forEach(img => {
    img.addEventListener('error', () => {
      const capaVazia = document.createElement('div');
      capaVazia.className = 'card-capa-vazia';
      capaVazia.textContent = img.dataset.titulo;
      img.replaceWith(capaVazia);
    }, { once: true });
  });
}

async function excluirLivro(id) {
  if (!confirm('Tem certeza que deseja excluir este livro?')) return;

  try {
    const resposta = await fetch(`/api/livros/${id}`, { method: 'DELETE' });
    if (resposta.status === 401) return verificarSessao();
    if (!resposta.ok) throw new Error('Erro ao excluir o livro.');
    todosLivros = todosLivros.filter(livro => livro.id !== id);
    atualizarPainel();
    renderizarLivros();
    mostrarAviso('Livro removido.', 'sucesso');
  } catch (erro) {
    console.error(erro);
    mostrarAviso(erro instanceof TypeError ? 'Erro ao conectar com o servidor.' : erro.message);
  }
}

if (listaLivros) {
  document.querySelectorAll('.filtro').forEach(botao => {
    botao.addEventListener('click', () => {
      document.querySelectorAll('.filtro').forEach(b => {
        b.classList.remove('ativo');
        b.setAttribute('aria-pressed', 'false');
      });
      botao.classList.add('ativo');
      botao.setAttribute('aria-pressed', 'true');
      filtroStatus = botao.dataset.status;
      renderizarLivros();
    });
  });

  document.getElementById('busca').addEventListener('input', evento => {
    termoBusca = evento.target.value;
    renderizarLivros();
  });

  listaLivros.addEventListener('click', evento => {
    const botao = evento.target.closest('[data-excluir]');
    if (botao) excluirLivro(Number(botao.dataset.excluir));
  });

  carregarLivros();
}

/* ---------- Sair ---------- */

const botaoSair = document.getElementById('botao-sair');
if (botaoSair) {
  botaoSair.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    location.href = 'login.html';
  });
}

/* ---------- Formulário de livro (cadastrar.html) ---------- */

const formLivro = document.getElementById('form-livro');

if (formLivro) {
  const params = new URLSearchParams(location.search);
  const idEdicao = params.get('id');

  const campoTitulo = document.getElementById('titulo');
  const campoAutor = document.getElementById('autor');
  const campoGenero = document.getElementById('genero');
  const campoCapa = document.getElementById('capa_url');
  const campoStatus = document.getElementById('status');
  const campoNota = document.getElementById('nota');
  const campoData = document.getElementById('data_leitura');
  const camposLido = document.getElementById('campos-lido');
  const previewCapa = document.getElementById('preview-capa');
  const mensagemLivro = document.getElementById('mensagem-livro');
  const botaoBuscar = document.getElementById('botao-buscar-livro');
  const resultadosBusca = document.getElementById('resultados-busca');
  const botoesEstrela = document.querySelectorAll('.estrela');

  function mostrarErroForm(texto) {
    mensagemLivro.textContent = texto;
    mensagemLivro.hidden = false;
  }

  function esconderErroForm() {
    mensagemLivro.hidden = true;
  }

  function alternarCamposLido() {
    camposLido.hidden = campoStatus.value !== 'lido';
  }

  function atualizarPreview() {
    const url = campoCapa.value.trim();
    previewCapa.hidden = !url;
    if (url) previewCapa.src = url;
  }

  function definirNota(valor) {
    const nota = Number(valor) || 0;
    campoNota.value = nota || '';
    botoesEstrela.forEach(botao => {
      const valorBotao = Number(botao.dataset.valor);
      botao.classList.toggle('ativa', valorBotao <= nota);
      botao.setAttribute('aria-pressed', String(valorBotao === nota));
    });
  }

  campoStatus.addEventListener('change', alternarCamposLido);
  campoCapa.addEventListener('input', atualizarPreview);
  previewCapa.addEventListener('error', () => { previewCapa.hidden = true; });

  // Clicar na mesma estrela de novo apaga a nota
  botoesEstrela.forEach(botao => {
    botao.addEventListener('click', () => {
      const valor = Number(botao.dataset.valor);
      definirNota(Number(campoNota.value) === valor ? 0 : valor);
    });
  });

  // Busca de capa e dados na API do Google Books
  function capaHttps(info) {
    return info.imageLinks.thumbnail.replace('http://', 'https://');
  }

  botaoBuscar.addEventListener('click', async () => {
    const titulo = campoTitulo.value.trim();
    const autor = campoAutor.value.trim();
    if (!titulo) return mostrarErroForm('Digite o título antes de buscar.');

    esconderErroForm();
    botaoBuscar.disabled = true;
    botaoBuscar.textContent = 'Buscando...';

    try {
      const consulta = `intitle:${titulo}${autor ? ` inauthor:${autor}` : ''}`;
      const resposta = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(consulta)}&maxResults=8&printType=books`);
      if (!resposta.ok) throw new Error();
      const dados = await resposta.json();
      const opcoes = (dados.items || [])
        .map(item => item.volumeInfo)
        .filter(info => info.imageLinks && info.imageLinks.thumbnail);

      if (opcoes.length === 0) {
        resultadosBusca.hidden = true;
        return mostrarErroForm('Nenhuma capa encontrada. Tente ajustar o título ou o autor.');
      }

      resultadosBusca.innerHTML = opcoes.map((info, indice) => `
        <button type="button" class="resultado-livro" data-indice="${indice}">
          <img src="${escaparHtml(capaHttps(info))}" alt="">
          <span>${escaparHtml(info.title)}</span>
          <small>${escaparHtml((info.authors || []).join(', '))}</small>
        </button>
      `).join('');
      resultadosBusca.hidden = false;

      resultadosBusca.onclick = evento => {
        const botao = evento.target.closest('.resultado-livro');
        if (!botao) return;
        const info = opcoes[botao.dataset.indice];
        campoCapa.value = capaHttps(info);
        if (!campoAutor.value.trim() && info.authors) campoAutor.value = info.authors.join(', ');
        if (!campoGenero.value.trim() && info.categories) campoGenero.value = info.categories[0];
        atualizarPreview();
        resultadosBusca.hidden = true;
      };
    } catch {
      mostrarErroForm('Não foi possível buscar agora. Tente de novo em instantes.');
    } finally {
      botaoBuscar.disabled = false;
      botaoBuscar.textContent = 'Buscar capa e dados';
    }
  });

  // Modo edição
  if (idEdicao) {
    document.getElementById('titulo-pagina').textContent = 'Editar livro';
    document.title = 'Booklly - Editar Livro';
    document.getElementById('livro-id').value = idEdicao;

    fetch(`/api/livros/${encodeURIComponent(idEdicao)}`)
      .then(resposta => {
        if (resposta.status === 401) {
          verificarSessao();
          return null;
        }
        if (!resposta.ok) throw new Error(resposta.status === 404 ? 'nao-encontrado' : 'erro');
        return resposta.json();
      })
      .then(livro => {
        if (!livro) return;
        campoTitulo.value = livro.titulo;
        campoAutor.value = livro.autor;
        campoGenero.value = livro.genero || '';
        campoCapa.value = livro.capa_url || '';
        campoStatus.value = livro.status;
        campoData.value = livro.data_leitura ? livro.data_leitura.split('T')[0] : '';
        definirNota(livro.nota);
        atualizarPreview();
        alternarCamposLido();
      })
      .catch(erro => {
        console.error('Erro ao carregar livro:', erro);
        formLivro.hidden = true;
        const aviso = document.createElement('p');
        aviso.className = 'mensagem-vazio';
        aviso.innerHTML = (erro.message === 'nao-encontrado'
          ? 'Livro não encontrado.'
          : 'Não foi possível carregar o livro.') + ' <a href="index.html">Voltar para a biblioteca</a>';
        formLivro.after(aviso);
      });
  }

  formLivro.addEventListener('submit', async evento => {
    evento.preventDefault();
    esconderErroForm();

    const botaoSalvar = formLivro.querySelector('button[type="submit"]');
    botaoSalvar.disabled = true;

    const dados = {
      titulo: campoTitulo.value.trim(),
      autor: campoAutor.value.trim(),
      genero: campoGenero.value.trim(),
      capa_url: campoCapa.value.trim(),
      status: campoStatus.value,
      nota: campoNota.value || null,
      data_leitura: campoData.value || null
    };

    const id = document.getElementById('livro-id').value;
    const url = id ? `/api/livros/${id}` : '/api/livros';
    const metodo = id ? 'PUT' : 'POST';

    try {
      const resposta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      if (resposta.status === 401) return verificarSessao();
      if (!resposta.ok) {
        const erro = await resposta.json().catch(() => ({}));
        throw new Error(erro.erro || 'Erro ao salvar o livro.');
      }
      location.href = 'index.html';
    } catch (erro) {
      console.error(erro);
      mostrarErroForm(erro instanceof TypeError ? 'Erro ao conectar com o servidor.' : erro.message);
      botaoSalvar.disabled = false;
    }
  });
}

if (listaLivros || formLivro) verificarSessao();