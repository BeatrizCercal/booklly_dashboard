const LABELS_STATUS = {
  quero_ler: 'Quero Ler',
  lendo: 'Lendo',
  lido: 'Lido'
};

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


const listaLivros = document.getElementById('lista-livros');

if (listaLivros) {
  async function carregarLivros(status = '') {
    try {
      const url = status ? `/api/livros?status=${status}` : '/api/livros';
      const resposta = await fetch(url);
      if (resposta.status === 401) return verificarSessao();
      const livros = await resposta.json();
      renderizarLivros(livros);
    } catch (erro) {
      console.error('Erro ao carregar livros:', erro);
      listaLivros.innerHTML = '<p class="mensagem-vazio">Erro ao conectar com o servidor.</p>';
    }
  }

  function renderizarLivros(livros) {
    const mensagemVazio = document.getElementById('mensagem-vazio');

    if (livros.length === 0) {
      listaLivros.innerHTML = '';
      mensagemVazio.hidden = false;
      return;
    }

    mensagemVazio.hidden = true;

    listaLivros.innerHTML = livros.map(livro => `
      <article class="card-livro">
        ${livro.capa_url
          ? `<img class="card-capa" src="${escaparHtml(livro.capa_url)}" alt="Capa de ${escaparHtml(livro.titulo)}" onerror="this.outerHTML='<div class=\\'card-capa-vazia\\'>${escaparHtml(livro.titulo)}</div>'">`
          : `<div class="card-capa-vazia">${escaparHtml(livro.titulo)}</div>`
        }
        <div class="card-corpo">
          <span class="selo-status selo-${livro.status}">${LABELS_STATUS[livro.status]}</span>
          <h3 class="card-titulo">${escaparHtml(livro.titulo)}</h3>
          <p class="card-autor">${escaparHtml(livro.autor)}</p>
          ${livro.genero ? `<span class="card-genero">${escaparHtml(livro.genero)}</span>` : ''}
          ${livro.nota ? `<span class="card-nota">${'★'.repeat(livro.nota)}${'☆'.repeat(5 - livro.nota)}</span>` : ''}
          <div class="card-acoes">
            <a href="cadastrar.html?id=${livro.id}" class="botao botao-secundario botao-pequeno">Editar</a>
            <button class="botao botao-perigo botao-pequeno" onclick="excluirLivro(${livro.id})">Excluir</button>
          </div>
        </div>
      </article>
    `).join('');
  }

  function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  document.querySelectorAll('.filtro').forEach(botao => {
    botao.addEventListener('click', () => {
      document.querySelectorAll('.filtro').forEach(b => b.classList.remove('ativo'));
      botao.classList.add('ativo');
      carregarLivros(botao.dataset.status);
    });
  });

  carregarLivros();
}

async function excluirLivro(id) {
  if (!confirm('Tem certeza que deseja excluir este livro?')) return;

  try {
    const resposta = await fetch(`/api/livros/${id}`, { method: 'DELETE' });
    if (resposta.ok) {
      location.reload();
    } else {
      alert('Erro ao excluir o livro.');
    }
  } catch (erro) {
    console.error(erro);
    alert('Erro ao conectar com o servidor.');
  }
}

const botaoSair = document.getElementById('botao-sair');
if (botaoSair) {
  botaoSair.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    location.href = 'login.html';
  });
}


const formLivro = document.getElementById('form-livro');

if (formLivro) {
  const params = new URLSearchParams(location.search);
  const idEdicao = params.get('id');

  const campoStatus = document.getElementById('status');
  const camposLido = document.getElementById('campos-lido');

  function alternarCamposLido() {
    camposLido.hidden = campoStatus.value !== 'lido';
  }

  campoStatus.addEventListener('change', alternarCamposLido);

  if (idEdicao) {
    document.getElementById('titulo-pagina').textContent = '✏️ Editar Livro';
    document.getElementById('livro-id').value = idEdicao;

    fetch(`/api/livros/${idEdicao}`)
      .then(res => res.json())
      .then(livro => {
        document.getElementById('titulo').value = livro.titulo;
        document.getElementById('autor').value = livro.autor;
        document.getElementById('genero').value = livro.genero || '';
        document.getElementById('capa_url').value = livro.capa_url || '';
        campoStatus.value = livro.status;
        document.getElementById('nota').value = livro.nota || '';
        document.getElementById('data_leitura').value = livro.data_leitura
          ? livro.data_leitura.split('T')[0]
          : '';
        alternarCamposLido();
      })
      .catch(erro => console.error('Erro ao carregar livro:', erro));
  }

  formLivro.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const dados = {
      titulo: document.getElementById('titulo').value.trim(),
      autor: document.getElementById('autor').value.trim(),
      genero: document.getElementById('genero').value.trim(),
      capa_url: document.getElementById('capa_url').value.trim(),
      status: campoStatus.value,
      nota: document.getElementById('nota').value || null,
      data_leitura: document.getElementById('data_leitura').value || null
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

      if (resposta.ok) {
        location.href = 'index.html';
      } else {
        const erro = await resposta.json();
        alert(erro.erro || 'Erro ao salvar o livro.');
      }
    } catch (erro) {
      console.error(erro);
      alert('Erro ao conectar com o servidor.');
    }
  });
}

if (listaLivros || formLivro) verificarSessao();