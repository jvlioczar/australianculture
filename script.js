/* Australian Culture · interações
   Cada página tem <body data-page="...">. A moldura (topo, rodapé, busca, navegação entre
   paradas) é montada aqui a partir da lista CH; o resto só roda se o elemento existir. */
(function(){
'use strict';
const A = window.AC, MAP = window.AC_MAP;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
/* Idioma: o mesmo script serve as páginas em português (raiz) e em inglês australiano (/en/) */
const EN = document.documentElement.lang.startsWith('en');
const t = (pt, en) => EN ? en : pt;
const LOC = t('pt-BR', 'en-AU');
const fmt = n => n.toLocaleString(LOC);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wiki = it => `https://${t('pt', 'en')}.wikipedia.org/w/index.php?search=` + encodeURIComponent(it.w || it.n);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const PAGE = document.body.dataset.page;
let rio; // observer de revelação ao rolar, criado no primeiro uso

/* Paradas: id, arquivo, nome, descrição, cor, cor do texto · arquivo, nome e descrição em inglês */
const CH_ALL = [
  ['famosos', 'famosos.html', 'Famosos', 'Atores, modelos e criadores digitais', '#7b4bc4', '#fff8ea', 'famous-aussies.html', 'Famous Aussies', 'Actors, models and content creators'],
  ['musica', 'musica.html', 'Música', 'Do AC/DC ao Tame Impala', '#f5b700', '#1b120c', 'music.html', 'Music', 'From AC/DC to Tame Impala'],
  ['telas', 'filmes-e-series.html', 'Filmes e séries', 'De Mad Max a Bluey, com animações', '#0b5d8c', '#fff8ea', 'film-and-tv.html', 'Film and TV', 'From Mad Max to Bluey, animation included'],
  ['marcas', 'marcas.html', 'Marcas', 'E as gêmeas brasileiras', '#ef6f5e', '#1b120c', 'brands.html', 'Brands', 'From Qantas to Canva'],
  ['comida', 'comida.html', 'Comida', 'Vegemite, Tim Tam, meat pie', '#c2410c', '#fff8ea', 'food.html', 'Food', 'Vegemite, Tim Tams, pies'],
  ['invencoes', 'invencoes.html', 'Invenções', 'Wi-Fi, caixa-preta, ultrassom', '#9fd3e6', '#1b120c', 'inventions.html', 'Inventions', 'Wi-Fi, the black box, ultrasound'],
  ['virais', 'virais-e-memes.html', 'Virais e memes', 'Memes, lendas e comediantes', '#f2a7b8', '#1b120c', 'virals-and-memes.html', 'Virals and memes', 'Memes, legends and comedians'],
  ['recordes', 'recordes.html', 'Recordes', 'A maior cerca do mundo e mais', '#1f6f4a', '#fff8ea', 'records.html', 'Records', 'The world’s longest fence and more'],
  ['curiosidades', 'curiosidades.html', 'Curiosidades', 'Mais canguru que gente', '#ff8a3d', '#1b120c', 'fun-facts.html', 'Fun facts', 'More roos than people'],
  ['natureza', 'natureza.html', 'Fauna e flora', 'Bichos e plantas nativos', '#8fb573', '#1b120c', 'wildlife-and-plants.html', 'Wildlife and plants', 'Native animals and plants'],
  ['cidades', 'cidades.html', 'Cidades', 'As 25 maiores, no mapa', '#1b2340', '#fff8ea', 'cities.html', 'Cities', 'The biggest 25, on the map'],
  ['lugares', 'lugares.html', 'Lugares', 'Praias, parques, pontes e monumentos', '#e0b36b', '#1b120c', 'places.html', 'Places', 'Beaches, parks, bridges and landmarks'],
  ['historia', 'historia.html', 'História', '65 mil anos em 30 momentos', '#8b3a1a', '#fff8ea', 'history.html', 'History', '65,000 years in 30 moments'],
  ['politica', 'politica-e-economia.html', 'Política e economia', 'Sistema, partidos, dinheiro e ativistas', '#b23a48', '#fff8ea', 'politics-and-economy.html', 'Politics and economy', 'The system, parties, money and activists'],
  ['sites', 'sites.html', 'Para conhecer mais', 'Os sites que explicam o país', '#0f766e', '#fff8ea', 'websites.html', 'Find out more', 'The websites that explain the country'],
  ['quiz', 'quiz.html', 'Quiz', 'Você é true blue?', '#c6dd52', '#1b120c', 'quiz.html', 'Quiz', 'Are you true blue?']
];
const CH = CH_ALL.map(c => EN ? [c[0], c[6], c[7], c[8], c[4], c[5]] : c.slice(0, 6));
const ABOUT = t('sobre.html', 'about.html');
/* a mesma página no outro idioma (o inglês fica em /en/) */
const otherLang = id => {
  if (id === 'inicio') return EN ? '../' : 'en/';
  if (id === 'sobre') return EN ? '../sobre.html' : 'en/about.html';
  const c = CH_ALL.find(x => x[0] === id);
  return c ? (EN ? '../' + c[1] : 'en/' + c[6]) : (EN ? '../' : 'en/');
};
const chOf = id => CH.find(c => c[0] === id);
/* listas que moram dentro da página de outra parada */
const PAGE_OF = {vistos: 'telas', comediantes: 'virais', sistema: 'politica', econ: 'politica', economia: 'politica', magnatas: 'politica', partidos: 'politica', politicos: 'politica', ativistas: 'politica'};
const pad = n => String(n).padStart(2, '0');

/* Ilustrações das paradas (viewBox 200×200). Classes em styles.css:
   o = contorno · k = tinta · w = creme · y = amarelo · r = vermelho · c = cor da parada · s = só traço.
   Os grupos a-* são as partes que se mexem (ver "ATUAÇÃO DAS ILUSTRAÇÕES" no CSS). */
const ART = {
  famosos: `<g class="a-star"><path class="y o" d="M100 20l22 50 54 5-41 36 13 53-48-28-48 28 13-53-41-36 54-5z"/><path class="k" d="M70 96h26v9a10 10 0 0 1-10 10h-6a10 10 0 0 1-10-10zM104 96h26v9a10 10 0 0 1-10 10h-6a10 10 0 0 1-10-10z"/><path class="s" d="M96 100h8"/><path class="s" d="M84 130q16 10 32 0"/></g><g class="a-tw1"><path class="w o" d="M168 24l5 12 12 5-12 5-5 12-5-12-12-5 12-5z"/></g><g class="a-tw2"><path class="w o" d="M30 140l4 9 9 4-9 4-4 9-4-9-9-4 9-4z"/></g>`,
  musica: `<g class="a-spin"><circle class="k o" cx="100" cy="104" r="78"/><circle class="g" cx="100" cy="104" r="64"/><circle class="g" cx="100" cy="104" r="52"/><circle class="y o" cx="100" cy="104" r="30"/><path class="k" d="M106 82l-18 26h12l-6 20 20-28h-12z"/><circle class="w" cx="100" cy="104" r="3"/></g><g class="a-note"><path class="w o" d="M160 22v40a11 11 0 1 1-7-10V34l22-6v10z"/></g>`,
  telas: `<g class="a-board"><rect class="w o" x="36" y="84" width="128" height="86" rx="8"/><rect class="k" x="36" y="84" width="128" height="20"/><path class="w" d="M56 84l-12 20h12l12-20zM88 84l-12 20h12l12-20zM120 84l-12 20h12l12-20zM152 84l-12 20h12l12-20z"/><path class="s" d="M56 126h88M56 148h54"/></g><g class="a-clap"><g transform="rotate(-16 40 78)"><rect class="k o" x="36" y="56" width="128" height="22" rx="4"/><path class="w" d="M56 56l-12 22h12l12-22zM88 56l-12 22h12l12-22zM120 56l-12 22h12l12-22zM152 56l-10 22h10l10-22z"/></g></g>`,
  marcas: `<path class="s" d="M142 52c14-24 34-28 46-26"/><g class="a-swing"><path class="w o" d="M34 96l58-58h66a8 8 0 0 1 8 8v66l-58 58a10 10 0 0 1-14 0l-60-60a10 10 0 0 1 0-14z"/><circle class="c o" cx="142" cy="62" r="10"/><text class="k t" x="98" y="128" transform="rotate(-45 98 118)">A$</text></g>`,
  comida: `<ellipse class="w o" cx="100" cy="158" rx="80" ry="18"/><g class="a-pie"><path class="y o" d="M42 112h116l-12 38H54z"/><path class="y o" d="M38 114c0-32 28-50 62-50s62 18 62 50z"/><path class="s" d="M42 114q8 9 16 0q8 9 16 0q8 9 16 0q8 9 16 0q8 9 16 0q8 9 16 0q8 9 16 0"/><path class="r o" d="M76 72c12-16 38-16 46 0 4 10-8 14-14 9-8 7-26 7-32-9z"/></g><g class="a-steam"><path class="sw" d="M80 50c-9-9 9-15 0-24"/></g><g class="a-steam2"><path class="sw" d="M112 48c-9-9 9-15 0-24"/></g>`,
  invencoes: `<g class="a-bulb"><path class="y o" d="M100 28a46 46 0 0 1 28 82c-6 6-8 12-8 20H80c0-8-2-14-8-20a46 46 0 0 1 28-82z"/><rect class="w o" x="78" y="134" width="44" height="13" rx="4"/><rect class="w o" x="83" y="151" width="34" height="13" rx="4"/><g class="a-wifi"><path class="s" d="M78 82a30 30 0 0 1 44 0"/><path class="s" d="M87 93a17 17 0 0 1 26 0"/></g><circle class="k" cx="100" cy="104" r="6"/></g><g class="a-rays"><path class="s" d="M100 6v10M40 28l8 8M160 28l-8 8M18 78h12M170 78h12"/></g>`,
  virais: `<g class="a-earl"><circle class="w o" cx="50" cy="70" r="32"/><circle class="e" cx="50" cy="70" r="15"/></g><g class="a-earr"><circle class="w o" cx="150" cy="70" r="32"/><circle class="e" cx="150" cy="70" r="15"/></g><ellipse class="w o" cx="100" cy="114" rx="62" ry="56"/><path class="k" d="M100 92c17 0 21 15 19 33-2 16-10 23-19 23s-17-7-19-23c-2-18 2-33 19-33z"/><g class="a-blink"><circle class="k" cx="70" cy="106" r="6"/><circle class="k" cx="130" cy="106" r="6"/></g><path class="s" d="M56 90l22 9M144 90l-22 9"/><path class="w o" d="M88 154l5 12 5-12zM102 154l5 12 5-12z"/>`,
  recordes: `<g class="a-hop"><path class="y o" d="M58 30h84v42a42 42 0 0 1-84 0z"/><path class="s" d="M58 44H40a20 20 0 0 0 20 36M142 44h18a20 20 0 0 1-20 36"/><rect class="y o" x="89" y="114" width="22" height="22"/><text class="k t" x="100" y="90">1</text><path class="a-shine sw" d="M70 40l-4 20"/></g><rect class="k o" x="60" y="136" width="80" height="28" rx="4"/><rect class="w" x="80" y="145" width="40" height="10" rx="2"/>`,
  curiosidades: `<g class="a-scan"><path class="k o" d="M128 128l42 42" style="stroke-width:16"/><circle class="w o" cx="86" cy="86" r="54"/><circle class="s" cx="86" cy="86" r="40"/><text class="k t" x="86" y="108">?</text><path class="sw" d="M58 62a36 36 0 0 1 18-14"/></g>`,
  cidades: `<circle class="y a-sun" cx="150" cy="46" r="24"/><g class="a-wave"><path class="sw" d="M-46 176q15-10 30 0t30 0 30 0 30 0 30 0 30 0 30 0 30 0"/></g><rect class="k" x="22" y="142" width="156" height="14" rx="3"/><path class="w o" d="M36 142c4-40 24-64 58-76-10 26-12 52-8 76z"/><path class="w o" d="M82 142c6-44 28-72 66-84-14 30-18 58-14 84z"/><path class="w o" d="M128 142c6-28 22-44 46-50-8 18-10 34-8 50z"/>`,
  historia: `<g class="a-flip"><rect class="k o" x="50" y="22" width="100" height="16" rx="4"/><rect class="k o" x="50" y="162" width="100" height="16" rx="4"/><path class="w o" d="M64 38h72c0 40-30 46-30 62s30 22 30 62H64c0-40 30-46 30-62s-30-22-30-62z"/><path class="y" d="M74 52h52c-4 20-22 28-26 40-4-12-22-20-26-40z"/><path class="y" d="M72 158c4-20 20-26 28-30 8 4 24 10 28 30z"/><path class="sy a-sand" d="M100 94v34"/></g>`,
  sites: `<circle class="w o" cx="100" cy="104" r="72"/><circle class="s" cx="100" cy="104" r="58"/><g class="a-needle"><path class="r o" d="M100 46l14 58H86z"/><path class="k o" d="M100 162l14-58H86z"/></g><circle class="y o" cx="100" cy="104" r="9"/><path class="s" d="M100 32v8M100 168v8M28 104h8M164 104h8"/>`,
  natureza: `<path class="s" d="M26 182C66 142 112 96 178 28"/><path class="lf o a-leaf" style="--d:0s" d="M62 148c-30-6-46-30-48-56 26 6 44 26 48 56z"/><path class="lf o a-leaf" style="--d:.15s" d="M96 112c-6-30 6-58 28-74 8 26 0 54-28 74z"/><path class="lf o a-leaf" style="--d:.3s" d="M128 80c-28-10-40-34-40-58 26 8 40 30 40 58z"/><path class="lf o a-leaf" style="--d:.45s" d="M152 56c8-26 28-42 44-44-2 24-22 40-44 44z"/><g class="a-wattle"><circle class="y o" cx="112" cy="152" r="11"/><circle class="y o" cx="136" cy="136" r="10"/><circle class="y o" cx="132" cy="164" r="9"/><circle class="y o" cx="156" cy="118" r="9"/><circle class="y o" cx="158" cy="148" r="10"/></g>`,
  sobre: `<circle class="y o a-sunrise" cx="132" cy="66" r="34"/><path class="r o" d="M22 150c6-18 14-36 30-46 18-12 50-16 90-16 30 0 56 6 66 18 10 12 16 28 18 44z"/><path class="s" d="M60 108c4 14 2 30 6 42M100 92c4 20 2 40 6 58M140 92c4 20 2 40 6 58"/><rect class="k" x="8" y="150" width="184" height="16" rx="4"/>`,
  politica: `<rect class="k" x="10" y="170" width="180" height="12" rx="4"/><path class="y o" d="M18 170c22-30 142-30 164 0z"/><rect class="w o" x="34" y="142" width="132" height="28" rx="4"/><path class="s" d="M56 170v-28M78 170v-28M122 170v-28M144 170v-28"/><path class="s" d="M78 142l22-108 22 108M88 142l12-60 12 60"/><g class="a-flag"><path class="r o" d="M100 30h50l-12 15 12 15h-50z"/></g><path class="s" d="M100 26v40"/>`,
  lugares: `<circle class="y a-sun" cx="156" cy="44" r="22"/><g class="a-wave"><path class="sw" d="M-46 150q15-10 30 0t30 0 30 0 30 0 30 0 30 0 30 0 30 0"/></g><path class="y o" d="M8 176c40-16 144-16 184 0v10H8z"/><path class="s" d="M92 66l20 108"/><path class="r o" d="M30 92c10-36 46-58 86-50s66 40 66 70c-20-14-40-14-56-4-14-14-36-18-52-10-16-10-32-10-44-6z"/><path class="w" d="M74 52c-6 20-6 34-4 46-10-2-18 0-26 4 4-22 14-40 30-50zM132 50c12 14 18 32 18 52-8-2-16-2-24 2 4-20 6-38 6-54z"/><circle class="k" cx="96" cy="62" r="5"/>`,
  quem: `<circle class="w o" cx="100" cy="74" r="34"/><path class="w o" d="M40 178c4-48 32-68 60-68s56 20 60 68z"/><path class="s" d="M86 82q14 10 28 0"/><circle class="k" cx="88" cy="68" r="4"/><circle class="k" cx="112" cy="68" r="4"/>`,
  quiz: `<g class="a-target"><circle class="w o" cx="92" cy="108" r="72"/><circle class="r o" cx="92" cy="108" r="52"/><circle class="w o" cx="92" cy="108" r="32"/><circle class="r o" cx="92" cy="108" r="12"/></g><g class="a-arrow"><path class="s" d="M92 108l78-78" style="stroke-width:7"/><path class="k o" d="M158 30l16-16 6 22-22-6z"/></g>`
};
const art = id => `<svg class="art" viewBox="0 0 200 200" aria-hidden="true">${ART[id] || ''}</svg>`;

const ICON = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>'
};

/* ---------- moldura comum ---------- */
const me = chOf(PAGE), myIdx = CH.indexOf(me), N = CH.length;
if (me) { document.body.style.setProperty('--c', me[4]); document.body.style.setProperty('--fg', me[5]); }

$('top').innerHTML = `<div class="wrap">
  <a class="logo" href="./" aria-label="${t('Australian Culture, início', 'Australian Culture, home')}">
    <svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="#c2410c"/><circle cx="40" cy="27" r="13" fill="#ffd36b"/><path d="M0 46c8-1 10-9 18-10s9 4 16 4 9-7 17-7 9 6 13 7v24H0z" fill="#7c2d12"/><path d="M0 52c10-2 20 2 32 0s22-3 32 0v12H0z" fill="#1e1712" opacity=".35"/></svg>
    <b>Australian Culture</b>
  </a>
  <span class="spacer"></span>
  <button class="tbtn" id="menuBtn" type="button" aria-expanded="false" aria-controls="menu">${ICON.menu}<span class="lbl">${t('Paradas', 'Stops')}</span></button>
  <button class="tbtn" id="searchBtn" type="button" aria-label="${t('Buscar no guia', 'Search the guide')}">${ICON.search}<span class="lbl">${t('Buscar', 'Search')}</span><kbd>/</kbd></button>
  <a class="tbtn lang" href="${otherLang(PAGE)}" hreflang="${t('en-AU', 'pt-BR')}" lang="${t('en-AU', 'pt-BR')}" aria-label="${t('Read in English', 'Ler em português')}">${t('EN', 'PT')}</a>
  <button class="tbtn" id="themeBtn" type="button" aria-label="${t('Alternar tema', 'Toggle theme')}"></button>
</div>`;
/* idioma: o <head> de cada página redireciona pela escolha guardada (ou pelo navegador na primeira visita);
   trocar pelo botão do cabeçalho grava a nova escolha */
document.querySelector('#top .lang').addEventListener('click', () => { try { localStorage.setItem('ac-lang', EN ? 'pt' : 'en'); } catch (e) {} });
/* transição entre páginas interrompida (clique rápido, voltar) não é erro: só silencia as promessas */
['pageswap', 'pagereveal'].forEach(ev => addEventListener(ev, e => {
  const vt = e.viewTransition;
  if (vt) [vt.ready, vt.finished, vt.updateCallbackDone].forEach(p => p && p.catch(() => {}));
}));
/* atalho de teclado para pular a moldura */
const mainEl = document.querySelector('main');
if (mainEl) {
  mainEl.id ||= 'conteudo';
  mainEl.tabIndex = -1;
  document.body.insertAdjacentHTML('afterbegin', `<a class="skip" href="#${mainEl.id}">${t('Pular para o conteúdo', 'Skip to content')}</a>`);
}
/* o menu fica fora do cabeçalho: o backdrop-filter dele prenderia um position:fixed */
$('top').insertAdjacentHTML('afterend', `<nav class="menu" id="menu" aria-label="${t('Paradas', 'Stops')}" hidden>
  <div class="wrap"><ol>
    <li style="--k:0"><a href="./" style="--c:#2a1209;--fg:#fff8ea"${PAGE === 'inicio' ? ' aria-current="page"' : ''}><span class="lq">${t('começo', 'start')}</span><div><b>${t('Início', 'Home')}</b><small>${t('A terra, o tempo, as pessoas', 'The land, time and people')}</small></div>${art('sobre')}</a></li>
    ${CH.map(([id, f, n, d, c, fg], i) =>
    `<li style="--k:${i + 1}"><a href="${f}" style="--c:${c};--fg:${fg}"${id === PAGE ? ' aria-current="page"' : ''}><span class="mono">${pad(i + 1)}</span><div><b>${n}</b><small>${d}</small></div>${art(id)}</a></li>`).join('')}
    <li style="--k:${N + 1}"><a href="${ABOUT}" style="--c:#c2410c;--fg:#fff8ea"${PAGE === 'sobre' ? ' aria-current="page"' : ''}><span class="lq">${t('quem fez', 'who made it')}</span><div><b>${t('Sobre', 'About')}</b><small>${t('E outros projetos para visitar', 'And other projects to visit')}</small></div>${art('quem')}</a></li>
  </ol></div>
</nav>`);
$('menuBtn').onclick = () => {
  const m = $('menu'), open = m.hidden;
  // abre logo abaixo do cabeçalho (no topo da página ele ainda está abaixo da superbar)
  if (open) m.style.top = Math.max(0, $('top').getBoundingClientRect().bottom) + 'px';
  m.hidden = !open; $('menuBtn').setAttribute('aria-expanded', open);
  document.body.classList.toggle('menu-open', open);
};
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('menu').hidden) $('menuBtn').click(); });

if (me) {
  $('phArt').innerHTML = art(PAGE);
  const nx = CH[myIdx + 1];
  const ns = $('nextStop');
  if (nx) {
    ns.href = nx[1];
    ns.style.setProperty('--c', nx[4]); ns.style.setProperty('--fg', nx[5]);
    ns.innerHTML = `<div class="wrap"><div><span class="mono">${t('Próxima parada', 'Next stop')} · ${pad(myIdx + 2)}</span><b>${nx[2]}</b><span class="d">${nx[3]}</span><span class="go">${t('Seguir viagem', 'Keep travelling')} →</span></div>${art(nx[0])}</div>`;
  } else {
    ns.href = ABOUT;
    ns.style.setProperty('--c', '#c2410c'); ns.style.setProperty('--fg', '#fff8ea');
    ns.innerHTML = `<div class="wrap"><div><span class="mono">${t('Fim da viagem', 'End of the road')}</span><b>Cheers, mate!</b><span class="d">${t('Obrigado por viajar com a gente. Conheça quem fez o guia e outros projetos.', 'Thanks for travelling with us. Meet the people behind the guide and our other projects.')}</span><span class="go">${t('Sobre o guia', 'About the guide')} →</span></div>${art('sobre')}</div>`;
  }
  /* barra de paradas colada embaixo do cabeçalho: mostra onde a pessoa está na viagem */
  const pv = CH[myIdx - 1];
  $('top').insertAdjacentHTML('afterend', `<nav class="levels" aria-label="${t('Paradas', 'Stops')}"><div class="wrap">
    ${pv ? `<a class="lv-arr" href="${pv[1]}" aria-label="${t('Parada anterior', 'Previous stop')}: ${pv[2]}">${ICON.prev}</a>` : `<a class="lv-arr" href="./" aria-label="${t('Início', 'Home')}">${ICON.prev}</a>`}
    <ol class="lv-list" id="lvList">${CH.map(([id, f, n, , c, fg], i) => {
      const here = id === PAGE, done = i < myIdx;
      return `<li><a href="${f}" style="--c:${c};--fg:${fg}" class="${here ? 'now' : done ? 'done' : ''}" title="${pad(i + 1)} · ${n}"${here ? ' aria-current="page"' : ''}><span class="n">${pad(i + 1)}</span>${here ? `<span class="nm">${n}</span>` : `<span class="sr">${n}</span>`}</a></li>`;
    }).join('')}</ol>
    ${nx ? `<a class="lv-arr" href="${nx[1]}" aria-label="${t('Próxima parada', 'Next stop')}: ${nx[2]}">${ICON.next}</a>` : `<a class="lv-arr" href="./" aria-label="${t('Início', 'Home')}">${ICON.next}</a>`}
  </div></nav>`);
  const now = $('lvList').querySelector('.now');
  if (now) $('lvList').scrollLeft = now.offsetLeft - $('lvList').clientWidth / 2 + now.offsetWidth / 2;
}

/* página Sobre: ilustração e convite para começar a viagem */
if (PAGE === 'sobre') {
  $('phArt').innerHTML = art('sobre');
  const f = CH[0], ns = $('nextStop');
  ns.href = f[1]; ns.style.setProperty('--c', f[4]); ns.style.setProperty('--fg', f[5]);
  ns.innerHTML = `<div class="wrap"><div><span class="mono">${t('Comece a viagem', 'Start the journey')} · 01</span><b>${f[2]}</b><span class="d">${f[3]}</span><span class="go">${t('Seguir viagem', 'Keep travelling')} →</span></div>${art(f[0])}</div>`;
}

/* fontes de cada parada, no fim do texto que as usa */
const cites = A.fontes[PAGE];
if (cites && document.querySelector('.page')) document.querySelector('.page').insertAdjacentHTML('beforeend',
  `<p class="cite">${t('Fontes', 'Sources')}: ${cites.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(n)}</a>`).join(', ')}.</p>`);

$('foot').innerHTML = `<div class="wrap">
  <p class="foot-big">Cheers, <em>mate.</em></p>
  <p class="lead">${t('O projeto <strong>Australian Culture</strong> foi idealizado por Julio Cesar Prava e é um projeto especial da <strong>BiblioVerse</strong>.', '<strong>Australian Culture</strong> was created by Julio Cesar Prava and is a special project of <strong>BiblioVerse</strong>.')}</p>
  <div class="acts">
    <a href="${ABOUT}">${t('Sobre', 'About')}</a>
    <a href="https://www.linkedin.com/company/biblioverse.org" rel="noopener noreferrer" target="_blank">LinkedIn</a>
    <button id="favBtn" type="button">${t('Favoritar', 'Bookmark')}</button>
    <button id="shareBtn" type="button">${t('Compartilhar', 'Share')}</button>
    <a href="https://biblioverse.org" rel="noopener noreferrer" target="_blank">BiblioVerse</a>
  </div>
  <p class="small">${t('Última atualização', 'Last updated')}: ${esc(A.updated)} · ${t('Acesse as bibliotecas de outros temas no BiblioVerse. Obrigado pela visita!', 'Explore libraries on other topics at BiblioVerse. Thanks for visiting!')}</p>
  <p class="small ack">${t('Reconhecemos os Guardiões Tradicionais das terras da Austrália e prestamos respeito aos Anciãos do passado e do presente.', 'We acknowledge the Traditional Custodians of the lands across Australia and pay our respects to Elders past and present.')}</p>
</div>`;
document.body.insertAdjacentHTML('beforeend', `
<dialog class="search" id="searchDlg" aria-label="${t('Buscar no guia', 'Search the guide')}">
  <div class="in">${ICON.search}<input id="q" type="text" role="searchbox" enterkeyhint="search" placeholder="${t('Busque um nome, comida, marca, ano...', 'Search a name, food, brand, year...')}" autocomplete="off"/><button class="x" id="qClose" type="button">Esc</button></div>
  <ul id="qRes"></ul>
</dialog>
<button class="totop" id="toTop" type="button" aria-label="${t('Voltar ao topo', 'Back to top')}">${ICON.up}</button>
<div class="toast" id="toast" role="status"></div>`);

/* ================= INÍCIO: a narrativa ================= */

/* Movimento: as curvas seguem os princípios clássicos de animação.
   OUT = desaceleração (chegadas), IN = aceleração (saídas), SPRING = passa do ponto e volta (exagero). */
const EASE = {OUT: 'cubic-bezier(.16,1,.3,1)', IN: 'cubic-bezier(.7,0,.84,0)', INOUT: 'cubic-bezier(.65,0,.35,1)', SPRING: 'cubic-bezier(.34,1.56,.64,1)'};
const anim = (el, kf, o) => (reduced || !el || !el.animate) ? null : el.animate(kf, Object.assign({fill: 'both'}, o));
/* comprimir ao tocar o chão e esticar no ar: a "pancada" de quem aterrissa */
const land = (el, delay = 0) => anim(el, [
  {transform: 'translateY(-14px) scale(.96,1.06)'},
  {transform: 'translateY(0) scale(1.06,.92)', offset: .45},
  {transform: 'translateY(0) scale(.98,1.02)', offset: .75},
  {transform: 'none'}], {duration: 520, delay, easing: EASE.OUT});

/* Rolagem até um ponto, para quem não usa a roda do mouse */
const goY = y => scrollTo({top: y, behavior: reduced ? 'auto' : 'smooth'});
const goEl = el => goY(el.getBoundingClientRect().top + scrollY - (parseInt(getComputedStyle(document.documentElement).scrollPaddingTop) || 0));

/* Abertura com Acknowledgement of Country (uma vez por sessão) */
if ($('gate')) {
  let seen = false;
  try { seen = sessionStorage.getItem('ac-ack') === '1'; } catch (e) {}
  if (!seen) {
    $('gate').hidden = false;
    document.body.classList.add('gated');
    $('gateBtn').focus();
    $('gateBtn').onclick = () => {
      try { sessionStorage.setItem('ac-ack', '1'); } catch (e) {}
      const g = $('gate'), b = $('gateBtn');
      // antecipação: o botão afunda antes do pano subir
      anim(b, [{transform: 'none'}, {transform: 'scale(.92,.86)', offset: .4}, {transform: 'scale(1.04)'}], {duration: 260, easing: EASE.INOUT});
      // sobreposição: cada linha sai um pouco depois da anterior
      [...g.querySelectorAll('.gate-in > *')].forEach((el, i) =>
        anim(el, [{opacity: 1, transform: 'none'}, {opacity: 0, transform: 'translateY(-40px)'}], {duration: 420, delay: 140 + i * 50, easing: EASE.IN}));
      let closed = false;
      const done = () => { if (closed) return; closed = true; g.hidden = true; document.body.classList.remove('gated'); heroIntro(); };
      const a = anim(g, [{transform: 'translateY(0)'}, {transform: 'translateY(-102%)'}], {duration: 900, delay: 380, easing: EASE.INOUT});
      if (a) { a.onfinish = done; setTimeout(done, 1600); } else done(); // garantia se a aba estiver em segundo plano
    };
  }
}

/* Abertura da capa: o sol nasce em arco, as letras caem e aterrissam uma a uma */
let heroDone = false;
function heroIntro(){
  if (heroDone || !$('hero') || document.body.classList.contains('gated')) return;
  heroDone = true;
  const h = $('hero');
  h.classList.add('play');
  if (reduced) return;
  anim($('sun'), [
    {transform: 'translate(-26%, 46%) scale(.82)', opacity: 0},
    {transform: 'translate(-8%, 10%) scale(.96)', opacity: 1, offset: .55},
    {transform: 'translate(0,0) scale(1)', opacity: 1}], {duration: 2200, easing: EASE.OUT, fill: 'backwards'});
  anim(h.querySelector('.uluru'), [{transform: 'translateY(40px)'}, {transform: 'none'}], {duration: 1600, easing: EASE.OUT});
  h.querySelectorAll('h1 .ch').forEach((c, i) => {
    anim(c, [
      {transform: 'translateY(-120%) scale(.9,1.2)', opacity: 0},
      {transform: 'translateY(0) scale(1.12,.84)', opacity: 1, offset: .55},
      {transform: 'translateY(-6%) scale(.97,1.04)', offset: .78},
      {transform: 'none', opacity: 1}], {duration: 760, delay: 300 + i * 55, easing: EASE.OUT, fill: 'backwards'});
  });
  [...h.querySelectorAll('.hero-in > :not(h1)')].forEach((el, i) =>
    anim(el, [{opacity: 0, transform: 'translateY(24px)'}, {opacity: 1, transform: 'none'}], {duration: 900, delay: 900 + i * 140, easing: EASE.OUT, fill: 'backwards'}));
}
if ($('hero')) {
  // o título vira letras soltas para poderem aterrissar uma a uma
  $('hero').querySelectorAll('h1 .ln > *').forEach(w => {
    w.innerHTML = [...w.textContent].map(ch => `<span class="ch">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
  });
  heroIntro();
  // em telas estreitas o enquadramento fecha no Uluru, para a rocha caber inteira
  const ul = $('hero').querySelector('.uluru');
  const frame = () => {
    ul.setAttribute('viewBox', innerWidth < 1024 ? '470 0 920 420' : '0 0 1440 420');
    ul.setAttribute('preserveAspectRatio', innerWidth < 1024 ? 'xMidYMax slice' : 'xMaxYMax slice');
  };
  frame(); addEventListener('resize', frame);
}

/* Faixa com gírias */
if ($('mq')) {
  const words = ["g'day", 'no worries', 'arvo', 'brekkie', 'fair dinkum', 'servo', 'how ya goin\'?', 'ta', 'yeah, nah', 'heaps good', 'reckon', 'thongs', 'sunnies', 'too easy', 'chrissie', 'cuppa', 'mate'];
  const run = words.map(w => `<span>${esc(w)}</span><i aria-hidden="true">✶</i>`).join('');
  $('mq').innerHTML = run + run;
}

/* A terra: o mapa que muda conforme o texto */
function auMap(withBrazil){
  const p = MAP.proj, c = Math.cos(p.lat0 * Math.PI / 180);
  const xy = (la, lo) => [(lo - p.lon0) * c * p.k, (p.latTop - la) * p.k];
  const max = A.cidades[0][1];
  /* no mapa das cidades, cada bolinha leva a posição no ranking: dentro das grandes, ao lado das pequenas.
     O lado de cada número (l = esquerda, r = direita, u/d = sobe/desce) evita encavalar nas regiões cheias. */
  const SIDE = {8: 'ru', 9: 'ru', 10: 'ld', 11: 'r', 12: 'rd', 13: 'r', 14: 'l', 15: 'r', 16: 'ru', 17: 'r', 18: 'r', 19: 'lu', 20: 'l', 21: 'r', 22: 'r', 23: 'r', 24: 'r', 25: 'l'};
  const nums = []; // os números vão numa camada acima de todas as bolinhas, para nenhum ficar escondido
  const dots = A.cidades.map(([n, v, s, la, lo, ind], i) => {
    const [x, y] = xy(la, lo), r = 2.2 + Math.sqrt(v / max) * 13, k = i + 1;
    let num = '';
    if (!withBrazil) {
      if (r >= 5.8) num = `<text class="dot-n in" data-s="${s}" x="${x.toFixed(1)}" y="${(y + 3.2).toFixed(1)}">${k}</text>`;
      else {
        const sd = SIDE[k] || 'r', dx = sd[0] === 'l' ? -(r + 2.5) : r + 2.5, dy = sd.includes('u') ? -3 : sd.includes('d') ? 7 : 3.2;
        num = `<text class="dot-n" data-s="${s}" x="${(x + dx).toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${sd[0] === 'l' ? 'end' : 'start'}">${k}</text>`;
      }
    }
    nums.push(num);
    return `<g class="dot" data-s="${s}" style="--i:${i}"><circle class="ring" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/><title>${k}. ${esc(n)}${ind ? ` (${esc(ind)})` : ''} · ${fmt(v)}</title></g>`;
  }).join('');
  const lab = (la, lo, t, cls) => { const [x, y] = xy(la, lo); return `<text class="${cls}" x="${x.toFixed(0)}" y="${y.toFixed(0)}">${t}</text>`; };
  return `<svg viewBox="-10 -10 ${MAP.w + 20} ${MAP.h + 20}" role="img">
    <path class="au" d="${MAP.au}"/>
    ${withBrazil ? `<path class="bra" pathLength="1" d="${MAP.br}"/>
    ${lab(-24, 133, 'outback', 'lbl-out')}
    <g class="pop"><text class="pop-br" x="${MAP.w / 2}" y="${MAP.h * .4}"><tspan class="pl" x="${MAP.w / 2}" dy="0">${t('Brasil', 'Brazil')}</tspan><tspan x="${MAP.w / 2}" dy="50">${t('213 mi', '213m')}</tspan></text>
      <text class="pop-au" x="${MAP.w / 2}" y="${MAP.h * .4 + 110}"><tspan class="pl" x="${MAP.w / 2}" dy="0">${t('Austrália', 'Australia')}</tspan><tspan x="${MAP.w / 2}" dy="40">${t('28 mi', '28m')}</tspan></text></g>` : ''}
    <g class="dots">${dots}</g><g class="nums">${nums.join('')}</g></svg>`;
}
if ($('landFig') && MAP) {
  $('landFig').innerHTML = auMap(true);
  const fig = $('landFig'), steps = [...document.querySelectorAll('.step')];
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting || fig.dataset.step === e.target.dataset.step) return;
    fig.dataset.step = e.target.dataset.step;
    // o mapa "respira" a cada troca: encolhe um pouco e volta, como quem toma fôlego
    anim(fig.querySelector('svg'), [{transform: 'scale(1)'}, {transform: 'scale(.97)', offset: .3}, {transform: 'scale(1)'}], {duration: 600, easing: EASE.INOUT});
  }), {rootMargin: '-45% 0px -45% 0px'});
  steps.forEach((s, i) => {
    io.observe(s);
    const b = s.querySelector('.nextbtn');
    if (b) b.onclick = () => b.dataset.to ? goEl($(b.dataset.to)) : goY(steps[i + 1].getBoundingClientRect().top + scrollY - innerHeight * .35);
  });
}

/* O tempo: o contador de anos guiado pela rolagem */
const MS = EN ? [
  [-65000, 'The First Peoples arrive on the continent.'],
  [1606, 'Dutchman Willem Janszoon sights Cape York.'],
  [1770, 'James Cook charts the east coast.'],
  [1788, 'The First Fleet arrives at Sydney Cove.'],
  [1851, 'The gold rush begins.'],
  [1901, 'The colonies unite: Australia is born.'],
  [1915, 'Gallipoli and the birth of the Anzac legend.'],
  [1967, 'The referendum: Aboriginal people are finally counted.'],
  [1973, 'The White Australia policy ends.'],
  [2000, 'The Sydney Olympics.'],
  [2008, 'The Apology to the Stolen Generations.'],
  [2032, 'Brisbane hosts the Olympics.']
] : [
  [-65000, 'Os primeiros povos chegam ao continente.'],
  [1606, 'O holandês Willem Janszoon avista o Cabo York.'],
  [1770, 'James Cook mapeia a costa leste.'],
  [1788, 'A Primeira Frota chega a Sydney Cove.'],
  [1851, 'Começa a corrida do ouro.'],
  [1901, 'As colônias se unem: nasce a Austrália.'],
  [1915, 'Gallipoli e o nascimento do Anzac.'],
  [1967, 'Referendo: os aborígenes passam a ser contados.'],
  [1973, 'Fim da política da Austrália Branca.'],
  [2000, 'Olimpíadas de Sydney.'],
  [2008, 'O pedido de desculpas às Gerações Roubadas.'],
  [2032, 'Brisbane recebe as Olimpíadas.']
];
const yearTxt = y => y < 0 ? fmt(Math.round(-y / 1000) * 1000) + t(' a.C.', ' BC') : String(Math.round(y));
if ($('timeTrack')) {
  $('yrTicks').innerHTML = MS.map(([y, tx], i) => `<li data-i="${i}"><b>${yearTxt(y)}</b><span>${esc(tx)}</span></li>`).join('');
  const ticks = [...$('yrTicks').children], tr = $('timeTrack'), LAST = MS.length - 1;
  const span = () => tr.offsetHeight - innerHeight;
  const posOf = () => clamp(-tr.getBoundingClientRect().top / span(), 0, 1) * LAST; // 0 = 1º marco, LAST = último
  const yAt = k => tr.getBoundingClientRect().top + scrollY + span() * k / LAST;
  let last = -1, wasMoving = false;
  const onTime = () => {
    const f = posOf(), i = Math.min(LAST - 1, Math.floor(f)), fr = f - i;
    // o ano conta de um marco ao outro (acelera e desacelera); a legenda é sempre a do marco mais próximo,
    // então nunca há dois anos diferentes parados com o mesmo texto
    const e = fr < .5 ? 4 * fr * fr * fr : 1 - Math.pow(-2 * fr + 2, 3) / 2;
    const moving = fr > .02 && fr < .98, k = Math.round(f);
    $('yr').textContent = yearTxt(moving ? MS[i][0] + (MS[i + 1][0] - MS[i][0]) * e : MS[k][0]);
    $('yrLabel').classList.toggle('moving', moving);
    if (wasMoving && !moving) land($('yr')); // o ano "aterrissa" em cada marco
    wasMoving = moving;
    if (k !== last) {
      last = k; $('yrLabel').textContent = MS[k][1];
      ticks.forEach((li, j) => { li.classList.toggle('on', j <= k); li.classList.toggle('now', j === k); });
      anim($('yrLabel'), [{opacity: 0, transform: 'translateY(14px)'}, {opacity: 1, transform: 'none'}], {duration: 450, easing: EASE.OUT});
    }
    $('yrBar').style.width = (f / LAST * 100).toFixed(2) + '%';
    $('yrNext').innerHTML = k < LAST ? t('Próximo marco', 'Next milestone') + ' <span aria-hidden="true">↓</span>' : t('Seguir', 'Keep going') + ' <span aria-hidden="true">↓</span>';
  };
  /* Um toque na roda do mouse (ou uma tecla) = um marco. A rolagem é animada aqui,
     com aceleração e desaceleração, e os toques extras durante o movimento são ignorados. */
  let busy = false, quietUntil = 0;
  const tween = (to, dur = 760) => {
    busy = true;
    const from = scrollY, t0 = performance.now();
    const step = now => {
      const q = Math.min(1, (now - t0) / dur), e = q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
      scrollTo(0, from + (to - from) * e);
      if (q < 1) requestAnimationFrame(step); else { busy = false; quietUntil = performance.now() + 260; }
    };
    requestAnimationFrame(step);
  };
  const stepTo = dir => {
    const r = tr.getBoundingClientRect();
    if (r.top > 1) return r.top < innerHeight * .6 && dir > 0 ? 0 : null;           // chegando por cima: para no 1º marco
    if (r.bottom < innerHeight - 1) return r.bottom > innerHeight * .4 && dir < 0 ? LAST : null; // voltando por baixo
    const f = posOf(), k = dir > 0 ? Math.floor(f + .02) + 1 : Math.ceil(f - .02) - 1;
    return k < 0 || k > LAST ? null : k; // nas pontas, a página segue rolando normalmente
  };
  const onStep = (dir, ev) => {
    const k = stepTo(dir);
    if (k == null) return;
    ev.preventDefault();
    if (busy || performance.now() < quietUntil) return;
    tween(yAt(k));
  };
  if (reduced) document.body.classList.add('static-time');
  else {
    addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) onStep(Math.sign(e.deltaY), e); }, {passive: false});
    addEventListener('keydown', e => {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || e.altKey || e.ctrlKey || e.metaKey) return;
      const dir = ['ArrowDown', 'PageDown', ' '].includes(e.key) && !e.shiftKey ? 1 : ['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey) ? -1 : 0;
      if (dir) onStep(dir, e);
    });
    addEventListener('scroll', onTime, {passive: true}); addEventListener('resize', onTime); onTime();
  }
  // a seta leva ao próximo marco ou, no fim, ao texto seguinte
  $('yrNext').onclick = () => {
    const f = posOf(), k = Math.floor(f + .02) + 1;
    if (k > LAST) return goEl($('clock'));
    if (reduced) goY(yAt(k)); else tween(yAt(k));
  };
}

/* As pessoas: 100 pontos, 32 nasceram fora */
if ($('waffle')) {
  $('waffle').innerHTML = Array.from({length: 100}, (_, i) => `<i style="--i:${i}"${i < 32 ? ' class="f"' : ''}></i>`).join('');
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    $('waffle').classList.add('go');
    // cada ponto aceso pula: estica ao subir, achata ao cair (comprimir e esticar)
    $('waffle').querySelectorAll('.f').forEach((d, i) => anim(d, [
      {transform: 'scale(.4)'}, {transform: 'scale(.9,1.25) translateY(-30%)', offset: .4},
      {transform: 'scale(1.2,.82)', offset: .7}, {transform: 'scale(1.08)'}], {duration: 520, delay: 200 + i * 35, easing: EASE.OUT}));
  }, {threshold: .4});
  io.observe($('waffle'));
}

/* O jeito: cartões que andam para o lado e se inclinam com o movimento */
const WAY = EN ? [
  ['Mateship', 'Loyalty to your mates, your workmates and even strangers in a spot of bother. Born in the bush and the trenches of Gallipoli.'],
  ['Fair go', 'Everyone deserves a fair chance, no matter where they come from. It’s close to a national creed.'],
  ['No worries', 'Relax, it’s fine. The answer to thank you, sorry and just about everything else.'],
  ['Tall poppy', 'Get too big for your boots and you’ll be cut down, like the tallest poppy in the patch. Modesty rules; big-noting yourself doesn’t go down well.'],
  ['Taking the piss', 'Ribbing your mates, and yourself, is a sign of affection. Irony runs through every conversation.'],
  ['Outdoors', 'Beach, park, bushwalks and weekend sport. The weather invites you out and the country takes it up.'],
  ['Arvo, brekkie, servo', 'If it can be shortened with an -o or an -ie on the end, it will be. Even Christmas becomes Chrissie, and a lifesaver is a lifey.']
] : [
  ['Mateship', 'Lealdade entre amigos, colegas e até desconhecidos em apuros. Nasceu no bush e nas trincheiras de Gallipoli.'],
  ['Fair go', 'Todo mundo merece uma chance justa, não importa de onde veio. É quase um princípio nacional.'],
  ['No worries', 'Relaxa, sem problema. A resposta para obrigado, desculpa e quase tudo o mais.'],
  ['Tall poppy', 'Quem se acha demais é "cortado", como a papoula mais alta do canteiro. Humildade é regra; se gabar pega mal.'],
  ['Taking the piss', 'Zoar os amigos, e a si mesmo, é sinal de carinho. A ironia está em toda conversa.'],
  ['Outdoors', 'Praia, parque, trilha e esporte no fim de semana. O clima convida e o país aproveita.'],
  ['Arvo, brekkie, servo', 'Se dá para encurtar e pôr um -o ou -ie no fim, eles encurtam. Até o Natal vira Chrissie, e o salva-vidas, lifesaver, vira lifey.']
];
const WAYC = ['#c2410c', '#f5b700', '#0b5d8c', '#f2a7b8', '#7b4bc4', '#1f6f4a', '#ef6f5e'];
if ($('wayRow')) {
  $('wayRow').innerHTML = WAY.map(([t, d], i) => {
    const c = WAYC[i], dark = ['#f5b700', '#f2a7b8', '#ef6f5e'].includes(c);
    return `<article class="way-card ticket" style="--c:${c};--fg:${dark ? '#1b120c' : '#fff8ea'};--r:${i % 2 ? 1 : -1.2}deg"><span class="mono">${pad(i + 1)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`;
  }).join('');
  const track = $('wayTrack'), row = $('wayRow'), cards = [...row.children];
  const horiz = () => !reduced && innerWidth > 760;
  const span = () => track.offsetHeight - innerHeight;
  const size = () => {
    if (!horiz()) { track.style.height = ''; row.style.transform = ''; return; }
    track.style.height = (row.scrollWidth - innerWidth + innerHeight * 1.2) + 'px';
  };
  let x = 0, tilt = 0, raf = 0;
  const target = () => horiz() ? -clamp(-track.getBoundingClientRect().top / span(), 0, 1) * (row.scrollWidth - innerWidth + 32) : 0;
  // o trilho segue a rolagem com um pequeno atraso (desaceleração) e os cartões
  // se inclinam conforme a velocidade, voltando ao lugar depois (acompanhamento)
  const tick = () => {
    const tx = target(), v = tx - x;
    x += v * .14; tilt += (clamp(v * .05, -7, 7) - tilt) * .18;
    row.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    cards.forEach((c, i) => c.style.setProperty('--tilt', (tilt * (1 + i * .06)).toFixed(2) + 'deg'));
    raf = Math.abs(v) > .3 || Math.abs(tilt) > .05 ? requestAnimationFrame(tick) : 0;
  };
  const kick = () => { if (horiz() && !raf) raf = requestAnimationFrame(tick); };
  size(); x = target(); tick();
  addEventListener('resize', () => { size(); kick(); });
  addEventListener('scroll', kick, {passive: true});
  // a seta avança um cartão por vez (ou rola até o fim no celular)
  $('wayNext').onclick = () => {
    if (!horiz()) { row.scrollBy({left: cards[0].offsetWidth + 22, behavior: reduced ? 'auto' : 'smooth'}); return; }
    const p = clamp(-track.getBoundingClientRect().top / span(), 0, 1), stepP = 1 / (cards.length - 1);
    if (p >= .999) return goEl($('paradas'));
    goY(track.getBoundingClientRect().top + scrollY + span() * Math.min(1, (Math.floor(p / stepP + .01) + 1) * stepP) + 1);
  };
}

/* A viagem: os selos das paradas */
if ($('stamps')) {
  $('stamps').innerHTML = CH.map(([id, f, n, d, c, fg], i) =>
    `<li class="rv" style="--i:${i % 4}"><a class="stamp ticket" href="${f}" style="--c:${c};--fg:${fg}">
      <span class="mono">${pad(i + 1)}</span>${art(id)}<b>${n}</b><small>${d}</small></a></li>`).join('');
}
/* O sol se põe atrás do Uluru enquanto se rola (o céu acompanha) */
if ($('sun') && !reduced) {
  const sun = $('sun'), hero = $('hero');
  addEventListener('scroll', () => {
    const y = scrollY; if (y > innerHeight * 1.4) return;
    const p = clamp(y / (hero.offsetHeight * .8), 0, 1);
    sun.style.translate = `0 ${(p * 55).toFixed(1)}vh`;
    hero.style.setProperty('--dusk', p.toFixed(3));
  }, {passive: true});
}

/* ================= PARADAS ================= */

/* listas com filtro e busca */
const card = (sec, it, i) => sec === 'sites'
  ? `<article class="card site rv" id="${sec}-${i}">
      <div class="meta">${esc(it.t)}</div><h3>${esc(it.n)}</h3><p class="org">${esc(it.o)}</p><p>${esc(it.d)}</p>
      <a class="more" href="${it.u}" target="_blank" rel="noopener">${esc(it.u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a></article>`
  : `<article class="card rv" id="${sec}-${i}">
      <div class="meta">${esc(it.t || '')}${it.y ? ` <span class="ano">${esc(it.y)}</span>` : ''}</div>
      <h3>${esc(it.n)}</h3>
      <p>${esc(it.d)}</p>
      ${it.ig ? `<a class="more" href="https://www.instagram.com/${it.ig}/" target="_blank" rel="noopener">@${esc(it.ig)}</a>` : `<a class="more" href="${wiki(it)}" target="_blank" rel="noopener">${t('Saiba mais', 'Find out more')}</a>`}</article>`;

const ALL = t('Todos', 'All'), NONE = t('Nada encontrado. Tente outra palavra.', 'Nothing found. Try another word.');
const byYear = (a, b) => (parseInt(a.y) || -1) - (parseInt(b.y) || -1);
A.invencoes.sort(byYear);
const LABEL = EN
  ? {sistema: 'the system', economia: 'the economy', magnatas: 'tycoons', partidos: 'parties', politicos: 'politicians', ativistas: 'activists', famosos: 'famous Aussies', musica: 'artists', telas: 'films, series and animation', vistos: 'shows and broadcasts', comediantes: 'comedians', marcas: 'brands', comida: 'food', invencoes: 'inventions', virais: 'memes', sites: 'websites', natureza: 'animals and plants', lugares: 'places'}
  : {sistema: 'o sistema', economia: 'a economia', magnatas: 'magnatas', partidos: 'partidos', politicos: 'políticos', ativistas: 'ativistas', famosos: 'famosos', musica: 'artistas', telas: 'filmes, séries e animações', vistos: 'programas e transmissões', comediantes: 'comediantes', marcas: 'marcas', comida: 'comidas', invencoes: 'invenções', virais: 'memes', sites: 'sites', natureza: 'animais e plantas', lugares: 'lugares'};
document.querySelectorAll('[data-list]').forEach(host => {
  const sec = host.dataset.list, items = A[sec];
  const tags = [...new Set(items.map(x => x.t))];
  const st = {tag: '', q: ''};
  host.innerHTML = `<div class="bar-ctl">${['', ...tags].map(tg =>
    `<button class="chip" type="button" data-t="${esc(tg)}">${tg ? esc(tg) : ALL}<small>${tg ? items.filter(x => x.t === tg).length : items.length}</small></button>`).join('')}
    <input class="find" type="search" placeholder="${t('Filtrar', 'Filter')} ${LABEL[sec]}..." aria-label="${t('Filtrar', 'Filter')}"/></div>
    <div class="count" aria-live="polite"></div><div class="grid"></div>`;
  const grid = host.querySelector('.grid'), count = host.querySelector('.count');
  function render(){
    host.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.t === st.tag));
    const q = norm(st.q);
    const rows = items.map((it, i) => [it, i]).filter(([it]) =>
      (!st.tag || it.t === st.tag) && (!q || norm(it.n + ' ' + it.d + ' ' + (it.y || '') + ' ' + (it.o || '')).includes(q)));
    grid.innerHTML = rows.length ? rows.map(([it, i]) => card(sec, it, i)).join('') : `<div class="empty">${NONE}</div>`;
    count.textContent = `${rows.length} ${rows.length === 1 ? 'item' : (EN ? 'items' : 'itens')}`;
    reveal(grid);
  }
  host.querySelector('.bar-ctl').addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    st.tag = c.dataset.t; render();
  });
  host.querySelector('.find').addEventListener('input', e => { st.q = e.target.value; render(); });
  render();
});

/* gráficos de barras e chips */
function bars(host, rows, max){
  host.innerHTML = rows.map((r, i) => `<div class="br" data-g="${esc(r.g)}"><span class="rk">${i + 1}</span>
    <span class="nm">${esc(r.n)}<small>${esc(r.g)}</small>${r.ind ? `<em class="ind">${esc(r.ind)}</em>` : ''}</span><span class="tr"><i data-w="${(r.v / max * 100).toFixed(1)}"></i></span><b class="vl">${r.l}</b></div>`).join('');
  const go = () => host.querySelectorAll('i[data-w]').forEach(i => i.style.width = i.dataset.w + '%');
  if (reduced || !('IntersectionObserver' in window)) return go();
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { go(); io.disconnect(); } }, {threshold: .1});
  io.observe(host);
}
function chipRow(host, opts, onPick){
  let cur = '';
  const box = document.createElement('span');
  box.style.display = 'contents';
  host.prepend(box);
  const draw = () => box.innerHTML = ['', ...opts].map(o =>
    `<button class="chip" type="button" data-v="${esc(o)}" aria-pressed="${o === cur}">${o ? esc(o) : ALL}</button>`).join('');
  box.addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    cur = c.dataset.v; draw(); onPick(cur);
  });
  draw();
}

/* Instagram */
if ($('igBars')) {
  const ig = A.instagram.map(([n, v, g]) => ({n, v, g, l: v.toLocaleString(LOC) + t(' mi', 'm')}));
  bars($('igBars'), ig, ig[0].v);
  chipRow($('igChips'), [...new Set(ig.map(x => x.g))], v =>
    $('igBars').querySelectorAll('.br').forEach(b => b.classList.toggle('dim', !!v && b.dataset.g !== v)));
}

/* Rock */

/* Gêmeas */
const twin = {cat: '', q: ''};
function renderTwins(){
  const q = norm(twin.q);
  const rows = A.gemeas.filter(([c, b, a]) => (!twin.cat || c === twin.cat) && (!q || norm(b + ' ' + a).includes(q)));
  $('twList').innerHTML = rows.length ? rows.map(([c, b, a]) =>
    `<div class="tw"><span class="br-n">${esc(b)}</span><span class="ar" aria-hidden="true">→</span><span class="au-n">${esc(a)}</span><span class="cat">${esc(c)}</span></div>`).join('')
    : `<div class="empty">${t('Essa marca ainda não está na lista.', 'That brand isn’t on the list yet.')}</div>`;
}
if ($('twList')) {
  chipRow($('twChips'), [...new Set(A.gemeas.map(x => x[0]))], v => { twin.cat = v; renderTwins(); });
  $('twChips').insertAdjacentHTML('beforeend', `<input class="find" id="twFind" type="search" placeholder="${t('Ex.: Itaú, Magalu, Bis...', 'E.g. Itaú, Magalu, Bis...')}" aria-label="${t('Buscar marca', 'Search a brand')}"/>`);
  $('twFind').addEventListener('input', e => { twin.q = e.target.value; renderTwins(); });
  renderTwins();
}

/* Comida do dia a dia */
if ($('staples')) $('staples').innerHTML = A.staples.map(([n, d], i) => `<div class="rv"><span class="mono">${pad(i + 1)}</span><b>${esc(n)}</b><span>${esc(d)}</span></div>`).join('');

/* Política e economia: os números em destaque */
if ($('econNums')) {
  $('econNums').innerHTML = A.econ.map((r, i) =>
    `<article class="rec rv" id="econ-${i}"><span class="k">${esc(r.k)}</span><h3>${esc(r.n)}</h3><p>${esc(r.d)}</p><div class="meta">${esc(r.t)}</div></article>`).join('');
  reveal($('econNums'));
}

/* Recordes */
function renderRecs(tag){
  $('recs').innerHTML = A.recordes.map((r, i) => [r, i]).filter(([r]) => !tag || r.t === tag).map(([r, i]) =>
    `<article class="rec rv" id="recordes-${i}"><span class="k">${esc(r.k)}</span><h3>${esc(r.n)}</h3><p>${esc(r.d)}</p>
     <div class="meta">${esc(r.t)} · <a class="more" href="${wiki(r)}" target="_blank" rel="noopener">${t('Saiba mais', 'Find out more')}</a></div></article>`).join('');
  reveal($('recs'));
}
if ($('recs')) {
  chipRow($('recChips'), [...new Set(A.recordes.map(r => r.t))], renderRecs);
  renderRecs('');
}

/* Curiosidades */
let spotI = -1;
function spot(i){
  const c = A.curiosidades;
  if (i == null) { do { i = Math.floor(Math.random() * c.length); } while (c.length > 1 && i === spotI); }
  spotI = i;
  const f = c[i], el = $('spot');
  el.innerHTML = `<span class="big" aria-hidden="true">${pad(i + 1)}</span><div><h2>${esc(f.n)}</h2><p>${esc(f.d)}</p></div>
    <button type="button" id="spotBtn">${t('Sortear outra', 'Show me another')}</button>`;
  el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap');
  $('spotBtn').onclick = () => spot();
}
if ($('spot')) {
  spot(0);
  $('facts').innerHTML = A.curiosidades.map((f, i) =>
    `<li class="rv"><button class="fact" type="button" id="curiosidades-${i}" data-i="${i}"><b>${esc(f.n)}</b><span>${esc(f.d)}</span></button></li>`).join('');
  $('facts').addEventListener('click', e => {
    const b = e.target.closest('.fact'); if (!b) return;
    spot(+b.dataset.i); $('spot').scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block: 'center'});
  });
}

/* Cidades: mapa, ranking e capitais */
/* nome indígena do lugar e povo dono tradicional da terra; sem nome conhecido, só a terra (Country) */
const indOf = c => c[5] ? `${c[5]} · ${c[6]}` : t(`Terra ${c[6]}`, `${c[6]} Country`);
const cityOf = name => A.cidades.find(c => c[0] === name || c[0].endsWith(' ' + name));
function renderProfiles(s){
  $('cityBars').querySelectorAll('.br').forEach(b => b.classList.toggle('dim', !!s && b.dataset.g !== s));
  $('cityMap').querySelectorAll('.dot, .dot-n').forEach(d => d.classList.toggle('dim', !!s && d.dataset.s !== s));
  const ps = A.perfis.map((p, i) => [p, i]).filter(([p]) => !s || p.s === s);
  $('profiles').innerHTML = ps.length ? ps.map(([p, i]) =>
    `<article class="prof rv" id="cidades-${i}"><span class="a">${esc(p.a)}</span><h3>${esc(p.n)}<small>${p.s}</small></h3>${cityOf(p.n) ? `<p class="ind">${esc(indOf(cityOf(p.n)))}</p>` : ''}<p>${esc(p.d)}</p></article>`).join('')
    : `<div class="empty">${t('Sem perfil de capital para este filtro.', 'No capital city profile for this filter.')}</div>`;
  reveal($('profiles'));
}
if ($('cityBars')) {
  const cities = A.cidades.map(c => ({n: c[0], v: c[1], g: c[2], l: fmt(c[1]), ind: indOf(c)}));
  bars($('cityBars'), cities, cities[0].v);
  if (MAP) $('cityMap').innerHTML = auMap(false) + `<figcaption class="note">${t('Cada círculo é uma cidade, do tamanho da sua população. Passe o mouse ou toque para ver o nome.', 'Each circle is a city, sized by population. Hover or tap to see its name.')}</figcaption>`;
  chipRow($('cityChips'), ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'], renderProfiles);
  renderProfiles('');
}

/* História */
function renderHistory(tag){
  $('timeline').innerHTML = A.historia.map((h, i) => [h, i]).filter(([h]) => !tag || h.t === tag).map(([h, i]) =>
    `<article class="ev rv" id="historia-${i}"><span class="y">${esc(h.y)}</span><h3>${esc(h.n)}</h3><p>${esc(h.d)}</p><div class="meta">${esc(h.t)}</div></article>`).join('');
  reveal($('timeline'));
}
if ($('timeline')) {
  chipRow($('hisChips'), [...new Set(A.historia.map(h => h.t))], renderHistory);
  renderHistory('');
}

/* Quiz */
const Q = {i: 0, ok: 0, order: []};
function quizStart(){
  Q.order = A.quiz.map((_, i) => i).sort(() => Math.random() - .5).slice(0, 10);
  Q.i = 0; Q.ok = 0; quizDraw();
}
function quizDraw(){
  const box = $('quizBox'), n = Q.order.length;
  if (Q.i >= n) {
    const p = Q.ok / n;
    const msg = p === 1 ? t('Fair dinkum! Você é true blue, um australiano honorário.', 'Fair dinkum! You’re true blue, an honorary Aussie.')
      : p >= .7 ? t('Good on ya, mate! Já dá para se virar num churrasco australiano.', 'Good on ya, mate! You’d hold your own at any Aussie barbie.')
      : p >= .4 ? t('Not bad! Mais um passeio pelo guia e você chega lá.', 'Not bad! One more lap of the guide and you’ll get there.')
      : t('Yeah, nah... Vale reler o guia com um Tim Tam na mão.', 'Yeah, nah... Worth another read of the guide, Tim Tam in hand.');
    box.innerHTML = `<div class="res"><div class="sc">${Q.ok}/${n}</div><p>${msg}</p>
      <button class="btn" type="button" id="qAgain">${t('Jogar de novo', 'Play again')}</button></div>`;
    $('qAgain').onclick = quizStart;
    land(box.querySelector('.sc'), 100); // o placar cai e assenta
    return;
  }
  const q = A.quiz[Q.order[Q.i]];
  box.innerHTML = `<div class="qtop"><span class="mono">${t('Pergunta', 'Question')} ${Q.i + 1} ${t('de', 'of')} ${n}</span><span class="mono">${Q.ok} ${EN ? 'correct' : (Q.ok === 1 ? 'acerto' : 'acertos')}</span></div>
    <div class="prog"><i style="width:${Q.i / n * 100}%"></i></div><h2>${esc(q.q)}</h2>
    <div class="opts">${q.o.map((o, i) => `<button class="opt" type="button" data-i="${i}"><span class="mono">${'ABCD'[i]}</span>${esc(o)}</button>`).join('')}</div>`;
  box.querySelector('.opts').addEventListener('click', e => {
    const b = e.target.closest('.opt'); if (!b || b.disabled) return;
    const pick = +b.dataset.i;
    box.querySelectorAll('.opt').forEach((o, i) => { o.disabled = true; if (i === q.a) o.classList.add('ok'); });
    const ok = box.querySelectorAll('.opt')[q.a];
    if (pick === q.a) {
      Q.ok++;
      // acerto: antecipa (afunda), pula esticando e cai achatando
      anim(ok, [{transform: 'none'}, {transform: 'scale(1.03,.9)', offset: .15}, {transform: 'translateY(-10px) scale(.97,1.06)', offset: .45},
        {transform: 'scale(1.04,.94)', offset: .75}, {transform: 'none'}], {duration: 620, easing: EASE.OUT});
    } else {
      b.classList.add('no');
      // erro: um "não" com a cabeça, exagerado e amortecido
      anim(b, [0, -12, 10, -7, 4, -2, 0].map(x => ({transform: `translateX(${x}px)`})), {duration: 520, easing: EASE.OUT});
    }
    box.insertAdjacentHTML('beforeend', `<button class="btn next" type="button" id="qNext">${Q.i + 1 < n ? t('Próxima', 'Next') + ' →' : t('Ver resultado', 'See my score')}</button>`);
    $('qNext').onclick = () => { Q.i++; quizDraw(); };
    $('qNext').focus();
  });
}
if ($('quizBox')) quizStart();

/* ================= BUSCA GLOBAL (leva à página certa) ================= */
const IDX = [];
const add = (sec, list, f) => list.forEach((it, i) => IDX.push(Object.assign({sec, a: `${sec}-${i}`}, f(it, i))));
['famosos', 'musica', 'telas', 'marcas', 'comida', 'invencoes', 'virais'].forEach(sec =>
  add(sec, A[sec], it => ({n: it.n, d: it.d, x: it.t + ' ' + (it.y || '')})));
add('vistos', A.vistos, it => ({n: it.n, d: it.d, x: it.t + ' ' + (it.y || '')}));
['sistema', 'economia', 'magnatas', 'partidos', 'politicos', 'ativistas'].forEach(sec => add(sec, A[sec], it => ({n: it.n, d: it.d, x: it.t + ' ' + (it.y || '')})));
add('econ', A.econ, r => ({n: r.n, d: r.k + ' · ' + r.d, x: r.t}));
add('comediantes', A.comediantes, it => ({n: it.n, d: it.d, x: it.t + ' ' + (it.ig || '')}));
add('sites', A.sites, s => ({n: s.n, d: s.o + ' · ' + s.d, x: s.t + ' ' + s.u}));
add('natureza', A.natureza, it => ({n: it.n, d: it.d, x: it.t + ' ' + it.s + ' ' + (it.o || '') + ' ' + (it.w || '')}));
add('recordes', A.recordes, r => ({n: r.n, d: r.k + ' · ' + r.d, x: r.t}));
add('curiosidades', A.curiosidades, c => ({n: c.n, d: c.d, x: ''}));
add('historia', A.historia, h => ({n: h.n, d: h.y + ' · ' + h.d, x: h.y + ' ' + h.t}));
add('lugares', A.lugares, it => ({n: it.n, d: it.d, x: it.t + ' ' + it.y + ' ' + (it.w || '')}));
add('cidades', A.perfis, p => ({n: p.n, d: p.a + ' · ' + p.d, x: p.s}));
(A.gemeas || []).forEach(([c, b, a]) => IDX.push({sec: 'marcas', a: 'gemea=' + encodeURIComponent(b), n: `${b} → ${a}`, d: t('Marcas gêmeas', 'Brand twins') + ' · ' + c, x: ''}));
IDX.forEach(r => r.k = norm(r.n + ' ' + r.d + ' ' + r.x));

const dlg = $('searchDlg'), qi = $('q'), qr = $('qRes');
let act = 0;
function search(){
  const terms = norm(qi.value).split(/\s+/).filter(Boolean);
  if (!terms.length) { qr.innerHTML = t('<li class="hint">Experimente: <b>vegemite</b>, <b>Kylie</b>, <b>1788</b>, <b>Itaú</b>, <b>golfe</b>, <b>Bluey</b>...</li>', '<li class="hint">Try: <b>vegemite</b>, <b>Kylie</b>, <b>1788</b>, <b>wombat</b>, <b>golf</b>, <b>Bluey</b>...</li>'); return; }
  const hits = IDX.filter(r => terms.every(t => r.k.includes(t)))
    .map(r => { const n = norm(r.n); return [r, n.startsWith(terms[0]) ? 2 : terms.every(t => n.includes(t)) ? 1 : 0]; })
    .sort((a, b) => b[1] - a[1]).map(x => x[0]).slice(0, 40);
  act = 0;
  qr.innerHTML = hits.length ? hits.map((h, i) => { const c = chOf(PAGE_OF[h.sec] || h.sec);
    return `<li><a href="${c[1]}#${h.a}" class="${i ? '' : 'act'}" style="--c:${c[4]}"><div><b>${esc(h.n)}</b><span>${esc(h.d)}</span></div><small>${c[2]}</small></a></li>`; }).join('')
    : `<li class="hint">${NONE}</li>`;
}
function openSearch(){ dlg.showModal(); qi.value = ''; search(); qi.focus(); }
/* mesma página: o link só troca o hash e o hashchange cuida do resto */
qi.addEventListener('input', search);
qi.addEventListener('keydown', e => {
  const as = qr.querySelectorAll('a');
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault(); if (!as.length) return;
    as[act].classList.remove('act'); act = (act + (e.key === 'ArrowDown' ? 1 : -1) + as.length) % as.length;
    as[act].classList.add('act'); as[act].scrollIntoView({block: 'nearest'});
  } else if (e.key === 'Enter' && as[act]) { e.preventDefault(); as[act].click(); }
});
qr.addEventListener('click', e => { if (e.target.closest('a')) dlg.close(); });
$('qClose').onclick = () => dlg.close();
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
$('searchBtn').onclick = openSearch;
document.addEventListener('keydown', e => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); openSearch(); }
});

/* ao chegar com #âncora: mostra o item, destacado */
function focusHash(e){
  const smooth = !!e && !reduced; // na chegada (sem evento) o pulo é direto
  const h = decodeURIComponent(location.hash.slice(1));
  if (!h) return;
  let el;
  if (h.startsWith('gemea=') && $('twList')) {
    twin.q = h.slice(6); $('twFind').value = twin.q; renderTwins(); el = $('twList');
  } else if (/^curiosidades-\d+$/.test(h) && $('spot')) {
    spot(+h.split('-')[1]); el = $('spot');
  } else el = $(h);
  if (!el) return;
  el.classList.add('in');
  setTimeout(() => {
    el.scrollIntoView({behavior: smooth ? 'smooth' : 'auto', block: 'center'});
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }, 60);
}
addEventListener('hashchange', focusHash);

/* ================= TEMA, REVELAR, TOPO ================= */
const root = document.documentElement;
const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
const themeIcon = () => { $('themeBtn').innerHTML = isDark() ? ICON.sun : ICON.moon; };
$('themeBtn').onclick = () => {
  root.dataset.theme = isDark() ? 'light' : 'dark';
  try { localStorage.setItem('ac-theme', root.dataset.theme); } catch (e) {}
  themeIcon();
};
themeIcon();

function reveal(scope){
  const els = (scope || document).querySelectorAll('.rv:not(.in)');
  if (reduced || !('IntersectionObserver' in window)) return els.forEach(e => e.classList.add('in'));
  rio = rio || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), {rootMargin: '0px 0px -6% 0px'});
  els.forEach(e => rio.observe(e));
}
reveal();
/* espera o carregamento: antes disso o navegador ainda reposiciona a página */
if (document.readyState === 'complete') focusHash(); else addEventListener('load', () => focusHash());
addEventListener('scroll', () => $('toTop').classList.toggle('on', scrollY > 900), {passive: true});
$('toTop').onclick = () => scrollTo({top: 0, behavior: reduced ? 'auto' : 'smooth'});

/* favoritar e compartilhar */
const toast = m => { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2400); };
$('favBtn').onclick = () => toast(t('Aperte ', 'Press ') + (/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl') + t(' + D para favoritar', ' + D to bookmark'));
$('shareBtn').onclick = async () => {
  const data = {title: document.title, url: location.href.split('#')[0]};
  try {
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(data.url); toast(t('Link copiado!', 'Link copied!')); }
  } catch (e) {}
};
})();
