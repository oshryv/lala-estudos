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

function checkQuestion(where, q) {
  if (!q || typeof q !== 'object') return err(where, 'pergunta não é objeto');
  if (!nonEmpty(q.q)) err(where, 'sem enunciado (q)');
  if (!nonEmpty(q.exp)) err(where, 'sem explicação (exp)');
  if (q.type === 'fill') {
    if (!Array.isArray(q.accept) || !q.accept.length || !q.accept.every(nonEmpty)) err(where, 'fill sem accept válido');
    return;
  }
  if (q.type && q.type !== 'mc') { err(where, `tipo "${q.type}" não suportado pelo renderizador`); return; }
  if (!Array.isArray(q.opts) || q.opts.length !== 4) { err(where, `precisa de 4 alternativas (tem ${q.opts && q.opts.length})`); return; }
  if (!q.opts.every(nonEmpty)) err(where, 'alternativa vazia');
  const norm = q.opts.map(o => String(o).trim().toLowerCase());
  if (new Set(norm).size < 4) err(where, 'alternativas repetidas');
  if (!Number.isInteger(q.a) || q.a < 0 || q.a > 3) err(where, `resposta (a) inválida: ${q.a}`);
  if (!q.noShuffle) {
    const txt = [q.q, q.exp, ...q.opts].join(' ');
    if (LETTER_REF.test(txt)) err(where, 'cita letra de alternativa; use noShuffle:true ou reescreva');
  }
}

function checkDistribution(where, qs) {
  const mc = qs.filter(q => q && q.type !== 'fill' && Number.isInteger(q.a));
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
  if (![1, 2].includes(s.tri)) err(w0, `tri inválido: ${s.tri}`);
  if (!['en', 'pt'].includes(s.lang)) err(w0, `lang inválido: ${s.lang}`);
  if (!/^#[0-9a-fA-F]{6}$/.test(s.color || '')) err(w0, `cor inválida: ${s.color}`);
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
  checkQuestion(w, q);
  if (!CATS.has(q.cat)) err(w, `cat inválida: ${q.cat}`);
  if (!['en', 'pt'].includes(q.lang)) err(w, `lang inválido: ${q.lang}`);
});

// 5) Teste do embaralhamento: a alternativa certa tem que continuar sendo a mesma
let shuffled = 0;
const allQ = [...SIMS.flatMap(s => s.subtopics.flatMap(t => t.questions || [])), ...QUIZ];
allQ.forEach((q, i) => {
  if (!q || q.type === 'fill' || !Array.isArray(q.opts) || q.opts.length !== 4 || q.noShuffle) return;
  const right = q.opts[q.a];
  for (let r = 0; r < 20; r++) {
    const p = prepQ(q);
    shuffled++;
    if (p.opts[p.a] !== right) { err(`embaralhar #${i}`, `perdeu a resposta certa em "${String(q.q).slice(0, 50)}"`); break; }
    if ([...p.opts].sort().join('|') !== [...q.opts].sort().join('|')) { err(`embaralhar #${i}`, 'mudou o conjunto de alternativas'); break; }
  }
});

// Relatório
warns.forEach(l => console.log(l));
errors.forEach(l => console.log(l));
console.log(`\n${SIMS.length} matérias, ${nQ} perguntas de simulado, ${QUIZ.length} no quiz, ${shuffled} embaralhamentos testados.`);
console.log(`${errors.length} erro(s), ${warns.length} aviso(s).`);
process.exit(errors.length ? 1 : 0);
