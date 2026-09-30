#!/usr/bin/env node
// Turns createWorld() in world-v7.js into an async function that yields to the browser between its top-level statements
// (at most once every ~10 ms of work), so building the world no longer blocks the page in one multi-second task.
// Needs the acorn parser:  npm install --no-save acorn      Run from the repo root (make-world-v7.py calls it for you).
const fs = require('fs'), path = require('path'), acorn = require('acorn');
const file = path.join(__dirname, '..', 'world-v7.js');
let src = fs.readFileSync(file, 'utf8');
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' });
let fn = null;
for (const n of ast.body) { const d = n.type === 'ExportNamedDeclaration' ? n.declaration : n; if (d && d.type === 'FunctionDeclaration' && d.id.name === 'createWorld') { fn = d; break; } }
if (!fn) throw new Error('createWorld not found');
const body = fn.body.body;
// Yield only inside the build phase: after the renderer exists, and before the frame loop starts.
const isLoopStart = s => s.type === 'ExpressionStatement' && src.slice(s.start, s.end).replace(/\s+/g, ' ').startsWith('raf = requestAnimationFrame(loop)');
const rendererAt = body.findIndex(s => /renderer\s*=\s*new THREE\.WebGLRenderer/.test(src.slice(s.start, s.end)) || (s.type === 'TryStatement' && /new THREE\.WebGLRenderer/.test(src.slice(s.start, s.end))));
const loopAt = body.findIndex(isLoopStart);
if (rendererAt < 0 || loopAt < 0) throw new Error('could not find the build phase (renderer at ' + rendererAt + ', loop at ' + loopAt + ')');
const cuts = [];
for (let i = rendererAt + 2; i < loopAt; i++) { const s = body[i]; if (s.type === 'FunctionDeclaration') continue; cuts.push(s.start); }
let out = src;
for (let k = cuts.length - 1; k >= 0; k--) out = out.slice(0, cuts[k]) + 'await __y(); ' + out.slice(cuts[k]);
out = out.replace('export function createWorld(', 'export async function createWorld(');
// helper, defined once at module level, right before createWorld
const helper = `
// v7: cooperative yielding while the world is built. Only yields if more than ~10 ms of work has passed since the last yield.
let __yt = 0;
const __y = () => { const n = performance.now(); if (n - __yt < 10) return null; return (typeof scheduler !== 'undefined' && scheduler.yield ? scheduler.yield() : new Promise(r => setTimeout(r, 0))).then(() => { __yt = performance.now(); }); };
`;
out = out.replace('export async function createWorld(', helper + 'export async function createWorld(');
fs.writeFileSync(file, out);
console.log('slice-world: %d yield points inserted (of %d top-level statements in the build phase)', cuts.length, loopAt - rendererAt);
