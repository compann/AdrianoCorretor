/* =====================================================================
   ADRIANO MIRANDA · site público
   Lê os imóveis e o perfil do Supabase. Se as chaves ainda não estiverem
   preenchidas em config.js, o site roda com um catálogo de demonstração
   para você poder apresentar o layout antes de ligar o banco.
   ===================================================================== */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const CFG = window.CONFIG || {};
const CONFIGURADO = /^https:\/\/.+\.supabase\.co/.test(CFG.SUPABASE_URL || '')
                 && (CFG.SUPABASE_ANON_KEY || '').length > 40;

const sb = CONFIGURADO ? createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY) : null;

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

let perfil  = { ...CFG.FALLBACK };
let imoveis = [];
let filtro  = { finalidade: '', tipo: '', busca: '', quartos: '' };

/* ── Formatação ─────────────────────────────────────────────────────── */
const moeda = v => Number(v || 0).toLocaleString('pt-BR',
  { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const TIPOS = {
  apartamento: 'Apartamento', casa: 'Casa', casa_condominio: 'Casa em condomínio',
  terreno: 'Terreno', comercial: 'Sala comercial', galpao: 'Galpão', rural: 'Rural'
};
const STATUS = { disponivel: '', reservado: 'Reservado', vendido: 'Vendido', alugado: 'Alugado' };

const local = i => [i.bairro, i.cidade].filter(Boolean).join(' · ');
const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function linkZap(texto) {
  const num = (perfil.whatsapp || '').replace(/\D/g, '');
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`;
}

/* ── Catálogo de demonstração ───────────────────────────────────────── */
const DEMO = [
  { id: 'd1', codigo: 'AM-0001', titulo: 'Apartamento com vista livre', finalidade: 'venda',
    tipo: 'apartamento', status: 'disponivel', preco: 1250000, condominio: 980,
    quartos: 3, suites: 1, banheiros: 3, vagas: 2, area_util: 142,
    bairro: 'Sudoeste', cidade: 'Brasília', fotos: [], destaque: true,
    caracteristicas: ['Vista livre', 'Armários planejados', 'Andar alto', 'Portaria 24h'],
    descricao: 'Andar alto, sol da manhã e vista desimpedida para o Parque da Cidade. Reformado com marcenaria planejada e piso em porcelanato acetinado.' },
  { id: 'd2', codigo: 'AM-0002', titulo: 'Casa térrea em condomínio fechado', finalidade: 'venda',
    tipo: 'casa_condominio', status: 'disponivel', preco: 890000,
    quartos: 4, suites: 2, banheiros: 4, vagas: 4, area_util: 260, area_total: 600,
    bairro: 'Jardim Botânico', cidade: 'Brasília', fotos: [],
    caracteristicas: ['Lote de 600 m²', 'Piscina', 'Churrasqueira', 'Segurança 24h'],
    descricao: 'Terreno plano, casa em um único piso e área gourmet integrada ao jardim.' },
  { id: 'd3', codigo: 'AM-0003', titulo: 'Apartamento pronto para morar', finalidade: 'aluguel',
    tipo: 'apartamento', status: 'disponivel', preco: 3200, condominio: 620, iptu: 180,
    quartos: 2, suites: 1, banheiros: 2, vagas: 1, area_util: 68,
    bairro: 'Águas Claras', cidade: 'Brasília', fotos: [],
    caracteristicas: ['Mobiliado', 'Aceita pet', 'Próximo ao metrô'],
    descricao: 'Mobiliado e disponível para entrada imediata. Condomínio com academia e piscina.' },
  { id: 'd4', codigo: 'AM-0004', titulo: 'Sala comercial de esquina', finalidade: 'aluguel',
    tipo: 'comercial', status: 'disponivel', preco: 4500, condominio: 900,
    quartos: 0, banheiros: 2, vagas: 2, area_util: 96,
    bairro: 'Asa Norte', cidade: 'Brasília', fotos: [],
    caracteristicas: ['Fachada dupla', 'Ar-condicionado instalado', 'Estacionamento rotativo'],
    descricao: 'Sala de esquina com fachada dupla e boa circulação de pedestres.' },
  { id: 'd5', codigo: 'AM-0005', titulo: 'Casa com quintal amplo', finalidade: 'venda',
    tipo: 'casa', status: 'vendido', preco: 520000,
    quartos: 3, suites: 1, banheiros: 2, vagas: 3, area_util: 180, area_total: 400,
    bairro: 'Valparaíso de Goiás', cidade: 'Valparaíso', uf: 'GO', fotos: [],
    caracteristicas: ['Quintal amplo', 'Garagem coberta'],
    descricao: 'Vendida em 2026. Mantida no portfólio como referência de negociação.' }
];

/* ── Carregamento ───────────────────────────────────────────────────── */
async function carregar() {
  if (!CONFIGURADO) {
    imoveis = DEMO;
    aplicarPerfil();
    render();
    console.info('[site] Rodando em modo demonstração — preencha config.js para ligar o Supabase.');
    return;
  }

  const [rPerfil, rImoveis] = await Promise.all([
    sb.from('perfil').select('*').eq('id', 1).maybeSingle(),
    sb.from('imoveis').select('*').eq('publicado', true)
      .order('destaque', { ascending: false })
      .order('ordem', { ascending: true })
      .order('criado_em', { ascending: false })
  ]);

  if (rPerfil.data) perfil = { ...perfil, ...limpar(rPerfil.data) };
  aplicarPerfil();

  if (rImoveis.error) {
    $('#contagem').textContent = 'Não consegui carregar o catálogo agora. Recarregue a página em instantes.';
    console.error(rImoveis.error);
    return;
  }
  imoveis = rImoveis.data || [];
  render();
}

const limpar = obj => Object.fromEntries(
  Object.entries(obj).filter(([, v]) => v !== null && v !== ''));

/* ── Perfil na página ───────────────────────────────────────────────── */
function aplicarPerfil() {
  const arroba = '@' + String(perfil.instagram || '').replace('@', '');
  const valores = { ...perfil, instagram_arroba: arroba };

  $$('[data-perfil]').forEach(el => {
    const v = valores[el.dataset.perfil];
    if (v) el.textContent = v;
  });

  const zap = linkZap(`Olá, ${perfil.nome}! Vim pelo site e gostaria de falar sobre um imóvel.`);
  ['#zap', '#link-zap-topo', '#link-zap-capa', '#canal-zap'].forEach(s => {
    const el = $(s); if (el) el.href = zap;
  });
  $('#canal-email').href = `mailto:${perfil.email}`;
  $('#canal-instagram').href = `https://instagram.com/${String(perfil.instagram || '').replace('@', '')}`;

  if (perfil.foto_url) {
    const img = $('#foto-corretor');
    img.src = perfil.foto_url;
    img.alt = `Retrato de ${perfil.nome}`;
    img.hidden = false;
    $('#foto-corretor-vazio').hidden = true;
  }
  $('#ano').textContent = `© ${new Date().getFullYear()} ${perfil.nome}`;
  document.title = `${perfil.nome} · Corretor de Imóveis em Brasília`;
}

/* ── Filtro e listagem ──────────────────────────────────────────────── */
function filtrados() {
  const busca = filtro.busca.trim().toLowerCase();
  return imoveis.filter(i => {
    if (filtro.finalidade && i.finalidade !== filtro.finalidade) return false;
    if (filtro.tipo && i.tipo !== filtro.tipo) return false;
    if (filtro.quartos && Number(i.quartos || 0) < Number(filtro.quartos)) return false;
    if (busca) {
      const alvo = `${i.bairro || ''} ${i.cidade || ''} ${i.titulo || ''} ${i.codigo || ''}`.toLowerCase();
      if (!alvo.includes(busca)) return false;
    }
    return true;
  });
}

function cartao(i) {
  const foto = (i.fotos || [])[0];
  const rotuloStatus = STATUS[i.status];
  const specs = [
    i.quartos ? `<span><b>${i.quartos}</b> ${i.quartos > 1 ? 'quartos' : 'quarto'}</span>` : '',
    i.suites ? `<span><b>${i.suites}</b> ${i.suites > 1 ? 'suítes' : 'suíte'}</span>` : '',
    i.vagas ? `<span><b>${i.vagas}</b> ${i.vagas > 1 ? 'vagas' : 'vaga'}</span>` : '',
    i.area_util ? `<span><b>${Number(i.area_util)}</b> m²</span>` : ''
  ].filter(Boolean).join('');

  return `
  <article class="cartao" tabindex="0" role="button" data-id="${esc(i.id)}"
           aria-label="Ver ficha do imóvel ${esc(i.titulo)}">
    <div class="cartao-foto">
      ${foto
        ? `<img src="${esc(foto)}" alt="${esc(i.titulo)}, ${esc(local(i))}" loading="lazy">`
        : `<div class="vazio">Fotos em breve</div>`}
      ${rotuloStatus ? `<span class="selo encerrado">${rotuloStatus}</span>`
                     : `<span class="selo">${i.finalidade === 'aluguel' ? 'Aluguel' : 'Venda'}</span>`}
      ${(i.fotos || []).length > 1 ? `<span class="contagem-fotos">${i.fotos.length} fotos</span>` : ''}
    </div>
    <div>
      <div class="cartao-topo">
        <div>
          <h3>${esc(i.titulo)}</h3>
          <p class="local">${esc(TIPOS[i.tipo] || '')} · ${esc(local(i))}</p>
        </div>
        <p class="preco">${moeda(i.preco)}${i.finalidade === 'aluguel'
          ? '<small>por mês</small>' : '<small>&nbsp;</small>'}</p>
      </div>
      ${specs ? `<div class="specs">${specs}</div>` : ''}
    </div>
  </article>`;
}

function render() {
  const lista = filtrados();
  const grade = $('#grade');

  if (!lista.length) {
    grade.innerHTML = `
      <div class="vazio-catalogo" style="grid-column:1/-1">
        <strong>Nada nesse recorte</strong>
        Ajuste os filtros ou me chame no WhatsApp — tenho imóveis que ainda não entraram no site.
      </div>`;
    $('#contagem').textContent = 'Nenhum imóvel encontrado';
    return;
  }

  $('#contagem').textContent = lista.length === 1
    ? '1 imóvel encontrado'
    : `${lista.length} imóveis encontrados`;
  grade.innerHTML = lista.map(cartao).join('');
  revelar();
}

/* animação de entrada ao rolar */
let observador;
function revelar() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('.cartao').forEach(c => c.classList.add('visivel'));
    return;
  }
  observador?.disconnect();
  observador = new IntersectionObserver((entradas) => {
    entradas.forEach((e, n) => {
      if (!e.isIntersecting) return;
      setTimeout(() => e.target.classList.add('visivel'), n * 70);
      observador.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  $$('.cartao').forEach(c => observador.observe(c));
}

/* ── Ficha do imóvel ────────────────────────────────────────────────── */
let fotoAtual = 0;
let imovelAberto = null;

function abrirFicha(id) {
  const i = imoveis.find(x => String(x.id) === String(id));
  if (!i) return;
  imovelAberto = i;
  fotoAtual = 0;

  const specs = [
    ['quartos', i.quartos, 'Quartos'], ['suites', i.suites, 'Suítes'],
    ['banheiros', i.banheiros, 'Banheiros'], ['vagas', i.vagas, 'Vagas'],
    ['area_util', i.area_util, 'm² úteis'], ['area_total', i.area_total, 'm² total']
  ].filter(([, v]) => v).map(([, v, l]) => `<div><b>${Number(v)}</b><span>${l}</span></div>`).join('');

  const encargos = [
    i.condominio ? `Condomínio ${moeda(i.condominio)}` : '',
    i.iptu ? `IPTU ${moeda(i.iptu)}` : ''
  ].filter(Boolean).join('  ·  ');

  const msg = `Olá, ${perfil.nome}! Tenho interesse no imóvel ${i.codigo || ''} — `
            + `${i.titulo}, ${local(i)}. Ele ainda está disponível?`;

  $('#ficha-corpo').innerHTML = `
    <div class="ficha-fechar">
      <span class="codigo">${esc(i.codigo || '')} · ${i.finalidade === 'aluguel' ? 'Locação' : 'Venda'}</span>
      <button type="button" data-fechar>Fechar ✕</button>
    </div>
    <div class="galeria" id="galeria">${galeriaHTML(i)}</div>
    ${(i.fotos || []).length > 1
      ? `<div class="miniaturas" id="miniaturas">${i.fotos.map((f, n) =>
          `<img src="${esc(f)}" alt="Foto ${n + 1}" data-n="${n}" aria-current="${n === 0}">`).join('')}</div>`
      : ''}
    <div class="ficha-conteudo">
      <p class="rotulo">${esc(TIPOS[i.tipo] || '')} · ${esc(local(i))}</p>
      <h2 id="ficha-titulo">${esc(i.titulo)}</h2>
      <p class="ficha-preco">${moeda(i.preco)}${i.finalidade === 'aluguel' ? ' <span style="font-size:.9rem">/mês</span>' : ''}</p>
      ${encargos ? `<p class="ficha-encargos">${encargos}</p>` : ''}
      ${STATUS[i.status] ? `<p class="ficha-encargos" style="color:var(--champanhe);margin-top:10px">Este imóvel já foi ${STATUS[i.status].toLowerCase()}</p>` : ''}
      ${specs ? `<div class="ficha-specs">${specs}</div>` : ''}
      ${i.descricao ? `<p>${esc(i.descricao)}</p>` : ''}
      ${(i.caracteristicas || []).length
        ? `<ul class="tags">${i.caracteristicas.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      ${i.video_url ? `<iframe class="ficha-video" src="${esc(embed(i.video_url))}"
          title="Vídeo do imóvel" allowfullscreen loading="lazy"></iframe>` : ''}
      <div class="ficha-acoes">
        <a class="btn btn-cheio" href="${linkZap(msg)}" target="_blank" rel="noopener">Tenho interesse</a>
        <button class="btn" type="button" id="btn-compartilhar">Compartilhar</button>
      </div>
    </div>`;

  const ficha = $('#ficha');
  ficha.setAttribute('open', '');
  document.body.style.overflow = 'hidden';
  $('#ficha-corpo').scrollTop = 0;
  $('.ficha-fechar button')?.focus();
}

function galeriaHTML(i) {
  const fotos = i.fotos || [];
  if (!fotos.length) {
    return `<div style="display:grid;place-items:center;height:100%;color:var(--aco);
      font-family:var(--rotulo);letter-spacing:.24em;font-size:.66rem;text-transform:uppercase">
      Fotos em breve</div>`;
  }
  return `<img src="${esc(fotos[fotoAtual])}" alt="${esc(i.titulo)} — foto ${fotoAtual + 1}">
    ${fotos.length > 1 ? `<div class="nav">
      <button type="button" data-passo="-1" aria-label="Foto anterior">‹</button>
      <button type="button" data-passo="1" aria-label="Próxima foto">›</button>
    </div>` : ''}`;
}

function trocarFoto(passo) {
  const fotos = imovelAberto?.fotos || [];
  if (fotos.length < 2) return;
  fotoAtual = (fotoAtual + passo + fotos.length) % fotos.length;
  $('#galeria').innerHTML = galeriaHTML(imovelAberto);
  $$('#miniaturas img').forEach((m, n) => m.setAttribute('aria-current', String(n === fotoAtual)));
}

function fecharFicha() {
  $('#ficha').removeAttribute('open');
  document.body.style.overflow = '';
  imovelAberto = null;
}

function embed(url) {
  const yt = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

/* ── Eventos ────────────────────────────────────────────────────────── */
document.addEventListener('click', e => {
  const cartaoEl = e.target.closest('.cartao');
  if (cartaoEl) return abrirFicha(cartaoEl.dataset.id);

  if (e.target.closest('[data-fechar]')) return fecharFicha();

  const passo = e.target.closest('[data-passo]');
  if (passo) return trocarFoto(Number(passo.dataset.passo));

  const mini = e.target.closest('#miniaturas img');
  if (mini) {
    fotoAtual = Number(mini.dataset.n);
    $('#galeria').innerHTML = galeriaHTML(imovelAberto);
    $$('#miniaturas img').forEach((m, n) => m.setAttribute('aria-current', String(n === fotoAtual)));
    return;
  }

  if (e.target.id === 'btn-compartilhar' && imovelAberto) {
    const dados = {
      title: `${imovelAberto.titulo} · ${perfil.nome}`,
      text: `${imovelAberto.titulo} — ${local(imovelAberto)} · ${moeda(imovelAberto.preco)}`,
      url: location.href
    };
    if (navigator.share) navigator.share(dados).catch(() => {});
    else {
      navigator.clipboard?.writeText(`${dados.text} — ${dados.url}`);
      e.target.textContent = 'Link copiado';
      setTimeout(() => (e.target.textContent = 'Compartilhar'), 2200);
    }
  }
});

document.addEventListener('keydown', e => {
  if (!$('#ficha').hasAttribute('open')) return;
  if (e.key === 'Escape') fecharFicha();
  if (e.key === 'ArrowLeft') trocarFoto(-1);
  if (e.key === 'ArrowRight') trocarFoto(1);
});

document.addEventListener('keypress', e => {
  const c = e.target.closest?.('.cartao');
  if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrirFicha(c.dataset.id); }
});

$$('.alternador button').forEach(b => b.addEventListener('click', () => {
  $$('.alternador button').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
  filtro.finalidade = b.dataset.finalidade;
  render();
}));

$('#f-tipo').addEventListener('change', e => { filtro.tipo = e.target.value; render(); });
$('#f-quartos').addEventListener('change', e => { filtro.quartos = e.target.value; render(); });

let atraso;
$('#f-bairro').addEventListener('input', e => {
  clearTimeout(atraso);
  atraso = setTimeout(() => { filtro.busca = e.target.value; render(); }, 220);
});

$('#f-limpar').addEventListener('click', () => {
  filtro = { finalidade: '', tipo: '', busca: '', quartos: '' };
  $('#f-tipo').value = ''; $('#f-quartos').value = ''; $('#f-bairro').value = '';
  $$('.alternador button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.finalidade === '')));
  render();
});

/* filtros recolhidos no celular */
const btnFiltros = $('#btn-filtros');
btnFiltros.addEventListener('click', () => {
  const aberto = $('#catalogo').classList.toggle('expandido');
  btnFiltros.setAttribute('aria-expanded', String(aberto));
  btnFiltros.textContent = aberto ? 'Menos filtros' : 'Mais filtros';
});

/* menu e cabeçalho */
const btnMenu = $('#btn-menu');
btnMenu.addEventListener('click', () => {
  const aberto = $('#menu').classList.toggle('aberto');
  btnMenu.setAttribute('aria-expanded', String(aberto));
});
$$('#menu a').forEach(a => a.addEventListener('click', () => {
  $('#menu').classList.remove('aberto');
  btnMenu.setAttribute('aria-expanded', 'false');
}));

addEventListener('scroll', () => {
  $('#topo').classList.toggle('fixo', scrollY > 40);
}, { passive: true });

carregar();
