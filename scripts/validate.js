#!/usr/bin/env node
// Validador das perguntas do Lala Estudos.
// Uso: node scripts/validate.js [caminho/do/index.html]
// Sai com código 1 se houver erro (avisos não derrubam).

const fs = require('fs');
const path = require('path');
const Module = require('module');

const file = process.argv[2] || path.join(__dirname, '..', 'public', 'index.html');
const html = fs.readFileSync(file, 'utf8');
const js = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n;\n');

const errors = [];
const warns = [];
const err = (w, m) => errors.push(`ERRO   ${w}: ${m}`);
const warn = (w, m) => warns.push(`AVISO  ${w}: ${m}`);

// 1) Sintaxe de todo o JS
try { new Function(js); } catch (e) { console.error('ERRO de sintaxe no JS:', e.message); process.exit(1); }

// 2) Carrega só os dados (tudo antes de "var currentTri") e as funções de embaralhar
const cut = js.indexOf('var currentTri');
if (cut < 0) { console.error('Não achei o marcador "var currentTri" no index.html.'); process.exit(1); }
const sStart = js.indexOf('function shuf');
const sEnd = js.indexOf('function renderQ');
if (sStart < 0 || sEnd < 0) { console.error('Não achei shuf/prepQ no index.html.'); process.exit(1); }
const m = new Module('lala');
m._compile(js.slice(0, cut) + '\n' + js.slice(sStart, sEnd) + '\nmodule.exports={SIMS,QUIZ,prepQ,TAIL_RE};', 'lala.js');
const { SIMS, QUIZ, prepQ } = m.exports;

const LETTER_REF = /(\([A-Da-d]\)|\b(letra|alternativa|alternative|option|letter|opção)\s+\(?[A-Da-d]\)?\b|^\s*[A-D][\).]\s)/i;
const CATS = new Set(['science', 'ciencias', 'portugues', 'mat', 'la', 'geohist', 'social']);
const nonEmpty = s => typeof s === 'string' && s.trim().length > 0;

const TYPES = new Set(['mc', 'fill', 'vf', 'multi', 'order', 'match', 'classify', 'short']);
function uniq(arr) { return new Set(arr.map(o => String(o).trim().toLowerCase())).size === arr.length; }

function checkQuestion(where, q, opts = {}) {
  if (!q || typeof q !== 'object') return err(where, 'pergunta não é objeto');
  if (!nonEmpty(q.q)) err(where, 'sem enunciado (q)');
  if (!nonEmpty(q.exp)) err(where, 'sem explicação (exp)');
  const t = q.type || 'mc';
  if (!TYPES.has(t)) return err(where, `tipo "${t}" não suportado pelo renderizador`);
  if (opts.onlyBasic && !['mc', 'fill'].includes(t)) return err(where, `tipo "${t}" não é suportado no Quiz`);
  if (t === 'fill') {
    if (!Array.isArray(q.accept) || !q.accept.length || !q.accept.every(nonEmpty)) err(where, 'fill sem accept válido');
    return;
  }
  if (t === 'short') { if (!nonEmpty(q.model)) err(where, 'short sem resposta modelo (model)'); return; }
  if (t === 'vf') {
    if (!Array.isArray(q.items) || q.items.length < 2) return err(where, 'vf precisa de 2+ afirmações (items)');
    if (!q.items.every(i => i && nonEmpty(i.t) && typeof i.v === 'boolean')) err(where, 'vf: cada item precisa de t (texto) e v (true/false)');
    return;
  }
  if (t === 'classify') {
    if (!Array.isArray(q.cats) || q.cats.length < 2 || !q.cats.every(nonEmpty) || !uniq(q.cats)) return err(where, 'classify precisa de 2+ categorias únicas (cats)');
    if (!Array.isArray(q.items) || q.items.length < 2) return err(where, 'classify precisa de 2+ itens');
    if (!q.items.every(i => i && nonEmpty(i.t) && Number.isInteger(i.c) && i.c >= 0 && i.c < q.cats.length)) err(where, 'classify: item com t ou c (índice da categoria) inválido');
    return;
  }
  if (t === 'match') {
    if (!Array.isArray(q.left) || !Array.isArray(q.right) || q.left.length < 2 || q.left.length !== q.right.length) return err(where, 'match precisa de left e right com o mesmo tamanho (2+)');
    if (!q.left.every(nonEmpty) || !q.right.every(nonEmpty)) err(where, 'match com item vazio');
    if (!uniq(q.right)) err(where, 'match com itens repetidos em right');
    return;
  }
  if (t === 'order') {
    if (!Array.isArray(q.items) || q.items.length < 3 || !q.items.every(nonEmpty) || !uniq(q.items)) err(where, 'order precisa de 3+ itens únicos (items, na ordem certa)');
    return;
  }
  // mc | multi
  if (!Array.isArray(q.opts) || q.opts.length !== 4) { err(where, `precisa de 4 alternativas (tem ${q.opts && q.opts.length})`); return; }
  if (!q.opts.every(nonEmpty)) err(where, 'alternativa vazia');
  if (!uniq(q.opts)) err(where, 'alternativas repetidas');
  if (t === 'mc') {
    if (!Number.isInteger(q.a) || q.a < 0 || q.a > 3) err(where, `resposta (a) inválida: ${q.a}`);
  } else {
    if (!Array.isArray(q.answers) || q.answers.length < 2 || q.answers.length > 3 || !q.answers.every(x => Number.isInteger(x) && x >= 0 && x <= 3) || new Set(q.answers).size !== q.answers.length)
      err(where, 'multi precisa de answers com 2 ou 3 índices únicos (0 a 3)');
  }
  if (!q.noShuffle) {
    const txt = [q.q, q.exp, ...q.opts].join(' ');
    if (LETTER_REF.test(txt)) err(where, 'cita letra de alternativa; use noShuffle:true ou reescreva');
  }
}

function checkDistribution(where, qs) {
  const mc = qs.filter(q => q && (!q.type || q.type === 'mc') && Number.isInteger(q.a));
  if (mc.length < 8) return;
  const c = [0, 0, 0, 0];
  mc.forEach(q => c[q.a]++);
  const top = Math.max(...c);
  if (top / mc.length > 0.5) warn(where, `resposta certa concentrada: A/B/C/D = ${c.join('/')}`);
  let run = 1, max = 1;
  for (let i = 1; i < mc.length; i++) { run = mc[i].a === mc[i - 1].a ? run + 1 : 1; max = Math.max(max, run); }
  if (max >= 5) warn(where, `${max} respostas seguidas na mesma letra`);
}

// 3) SIMS
const keys = new Set();
let nQ = 0;
SIMS.forEach(s => {
  const w0 = `SIMS/${s.key}`;
  if (keys.has(s.key)) err(w0, 'key duplicada'); keys.add(s.key);
  if (![1, 2, 3].includes(s.tri)) err(w0, `tri inválido: ${s.tri}`);
  if (!['en', 'pt'].includes(s.lang)) err(w0, `lang inválido: ${s.lang}`);
  if (!/^#[0-9a-fA-F]{6}$/.test(s.color || '')) err(w0, `cor inválida: ${s.color}`);
  if (s.pending) return;
  if (!Array.isArray(s.subtopics) || !s.subtopics.length) return err(w0, 'sem subtopics');
  const labels = new Set();
  s.subtopics.forEach(t => {
    const w1 = `${w0}/${t.label}`;
    if (!nonEmpty(t.label)) err(w0, 'subtopic sem label');
    if (labels.has(t.label)) err(w1, 'label de subtopic duplicado (o app localiza pelo label)'); labels.add(t.label);
    const qs = t.questions || [];
    if (!qs.length) return err(w1, 'sem perguntas');
    const stems = new Set();
    qs.forEach((q, i) => {
      nQ++;
      const w2 = `${w1} #${i + 1}`;
      checkQuestion(w2, q);
      const k = String(q && q.q).trim().toLowerCase();
      if (stems.has(k)) err(w2, 'enunciado repetido no mesmo simulado'); stems.add(k);
    });
    checkDistribution(w1, qs);
  });
});

// 4) QUIZ
QUIZ.forEach((q, i) => {
  const w = `QUIZ #${i + 1}`;
  checkQuestion(w, q, { onlyBasic: true });
  if (!CATS.has(q.cat)) err(w, `cat inválida: ${q.cat}`);
  if (!['en', 'pt'].includes(q.lang)) err(w, `lang inválido: ${q.lang}`);
});

// 5) Teste do embaralhamento: a resposta certa tem que continuar sendo a mesma
let shuffled = 0;
const allQ = [...SIMS.flatMap(s => s.subtopics.flatMap(t => t.questions || [])), ...QUIZ];
const sameSet = (a, b) => [...a].sort().join('|') === [...b].sort().join('|');
function checkShuffle(q, label) {
  const t = q && (q.type || 'mc');
  if (!q || q.noShuffle || !TYPES.has(t) || t === 'fill' || t === 'short') return;
  for (let r = 0; r < 20; r++) {
    const p = prepQ(q); shuffled++;
    if (t === 'mc') {
      if (!Array.isArray(q.opts) || q.opts.length !== 4) return;
      if (p.opts[p.a] !== q.opts[q.a]) return err(label, `perdeu a resposta certa em "${String(q.q).slice(0, 50)}"`);
      if (!sameSet(p.opts, q.opts)) return err(label, 'mudou o conjunto de alternativas');
    } else if (t === 'multi') {
      if (!sameSet(p.answers.map(i => p.opts[i]), q.answers.map(i => q.opts[i]))) return err(label, `multi perdeu as respostas certas em "${String(q.q).slice(0, 50)}"`);
    } else if (t === 'vf' || t === 'classify') {
      if (!sameSet(p.items.map(i => i.t + '|' + (i.v === undefined ? i.c : i.v)), q.items.map(i => i.t + '|' + (i.v === undefined ? i.c : i.v)))) return err(label, `${t} mudou os itens`);
    } else if (t === 'match') {
      if (!sameSet(p.lorder, q.left.map((_, i) => i)) || !sameSet(p.rorder, q.right.map((_, i) => i))) return err(label, 'match com ordem inválida');
    } else if (t === 'order') {
      if (!sameSet(p.disp, q.items.map((_, i) => i))) return err(label, 'order com ordem inválida');
    }
  }
}
allQ.forEach((q, i) => checkShuffle(q, `embaralhar #${i}`));

// 5b) Auto-teste dos tipos novos com exemplos sintéticos (não vão para o app)
const FIX = [
  { type: 'vf', q: 'x', exp: 'x', items: [{ t: 'a', v: true }, { t: 'b', v: false }, { t: 'c', v: true }] },
  { type: 'multi', q: 'x', exp: 'x', opts: ['p', 'q', 'r', 's'], answers: [0, 2] },
  { type: 'order', q: 'x', exp: 'x', items: ['um', 'dois', 'tres', 'quatro'] },
  { type: 'match', q: 'x', exp: 'x', left: ['a', 'b', 'c'], right: ['1', '2', '3'] },
  { type: 'classify', q: 'x', exp: 'x', cats: ['k', 'l'], items: [{ t: 'a', c: 0 }, { t: 'b', c: 1 }, { t: 'c', c: 0 }] },
  { type: 'short', q: 'x', exp: 'x', model: 'm' },
];
FIX.forEach((q, i) => { const before = errors.length; checkQuestion(`fixture ${q.type}`, q); checkShuffle(q, `fixture ${q.type}`); if (errors.length > before) console.log(`(fixture ${q.type} falhou)`); });

// Relatório
warns.forEach(l => console.log(l));
errors.forEach(l => console.log(l));
console.log(`\n${SIMS.length} matérias, ${nQ} perguntas de simulado, ${QUIZ.length} no quiz, ${shuffled} embaralhamentos testados.`);
console.log(`${errors.length} erro(s), ${warns.length} aviso(s).`);
process.exit(errors.length ? 1 : 0);
