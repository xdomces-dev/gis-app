#!/usr/bin/env node
// Inventario de SOLO LECTURA de una o varias carpetas (Fase 2).
// No mueve, no renombra, no borra y no modifica ningún archivo de las carpetas revisadas.
//
// Uso:
//   node herramientas/inventario.mjs --raiz "D:\Escuela\2026-2027" [--raiz otra] --salida "C:\biblioteca-inventario\laptop" [--equipo laptop]
//
// Genera en --salida:
//   inventario.json  todos los archivos con ruta, formato, tamaño, fechas, huella SHA-256 y pistas
//   inventario.csv   lo mismo, para Excel
//   resumen.md       totales, duplicados exactos, archivos dudosos y carpetas
//
// Reanudar: si --salida ya tiene un inventario.json, reutiliza la huella de los archivos que no cambiaron.
// IMPORTANTE: la salida NO debe quedar dentro del repo público gis-app (rutas y nombres pueden tener datos de menores).

import { createReadStream, existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { opendir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, join, basename, dirname, sep, extname } from 'node:path';
import { categoriaFormato, CATEGORIAS_FORMATO } from '../app/js/modelo.js';

const OMITIR_CARPETAS = new Set(['node_modules', '.git', '$RECYCLE.BIN', 'System Volume Information', 'AppData', '.Trash', '.cache', '__MACOSX']);
const DUDOSOS = [
  [/^~\$/, 'archivo temporal de Office'], [/\.(tmp|crdownload|part|partial|download)$/i, 'descarga o temporal incompleto'],
  [/^\.DS_Store$|^Thumbs\.db$|^desktop\.ini$/i, 'archivo del sistema'],
];

export function argumentos(argv) {
  const a = { raices: [], salida: '', equipo: '', ocultos: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i], v = argv[i + 1];
    if (k === '--raiz') { a.raices.push(v); i++; }
    else if (k === '--salida') { a.salida = v; i++; }
    else if (k === '--equipo') { a.equipo = v; i++; }
    else if (k === '--incluir-ocultos') a.ocultos = true;
    else if (k === '--ayuda' || k === '-h') a.ayuda = true;
  }
  return a;
}

/** ¿La ruta queda dentro de un repositorio git cuyo remoto es gis-app (público)? */
export function dentroDeRepoPublico(ruta) {
  let d = resolve(ruta);
  for (;;) {
    const cfg = join(d, '.git', 'config');
    if (existsSync(cfg)) return /gis-app/i.test(readFileSync(cfg, 'utf8'));
    const p = dirname(d);
    if (p === d) return false;
    d = p;
  }
}

async function huella(ruta) {
  return new Promise((res, rej) => {
    const h = createHash('sha256');
    createReadStream(ruta).on('data', c => h.update(c)).on('end', () => res(h.digest('hex'))).on('error', rej);
  });
}

async function* recorrer(dir, opciones, errores) {
  let d;
  try { d = await opendir(dir); } catch (e) { errores.push({ ruta: dir, error: e.code || e.message }); return; }
  for await (const e of d) {
    if (!opciones.ocultos && e.name.startsWith('.')) continue;
    const ruta = join(dir, e.name);
    if (e.isDirectory()) { if (!OMITIR_CARPETAS.has(e.name)) yield* recorrer(ruta, opciones, errores); }
    else if (e.isFile()) yield ruta;
  }
}

function csv(filas) {
  return '\ufeff' + filas.map(f => f.map(v => { const t = String(v ?? ''); return /[",\n;]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; }).join(',')).join('\r\n');
}

export async function inventariar({ raices, salida, equipo = '', ocultos = false }, log = console.log) {
  if (!raices.length || !salida) throw new Error('Faltan --raiz y --salida. Usa --ayuda.');
  const salidaAbs = resolve(salida);
  for (const r of raices) {
    const rAbs = resolve(r);
    if (!existsSync(rAbs)) throw new Error('No existe la carpeta: ' + r);
    if (salidaAbs === rAbs || salidaAbs.startsWith(rAbs + sep)) throw new Error('La salida no puede estar dentro de una carpeta que se inventaría: ' + r);
  }
  if (dentroDeRepoPublico(salidaAbs)) throw new Error('La salida está dentro del repositorio público gis-app. Elige una carpeta privada (p. ej. el repo privado del inventario).');
  mkdirSync(salidaAbs, { recursive: true });

  const previo = new Map();
  const archivoPrevio = join(salidaAbs, 'inventario.json');
  if (existsSync(archivoPrevio)) {
    try { for (const x of JSON.parse(readFileSync(archivoPrevio, 'utf8')).archivos || []) previo.set(x.rutaAbsoluta, x); }
    catch { log('Aviso: inventario.json previo ilegible; se calcula todo de nuevo.'); }
  }

  const errores = [];
  const archivos = [];
  let reutilizados = 0;
  for (const r of raices) {
    const rAbs = resolve(r);
    for await (const ruta of recorrer(rAbs, { ocultos }, errores)) {
      let st;
      try { st = await stat(ruta); } catch (e) { errores.push({ ruta, error: e.code || e.message }); continue; }
      const nombre = basename(ruta);
      const p = previo.get(ruta);
      let sha = '';
      if (p && p.tamano === st.size && p.modificado === st.mtime.toISOString() && p.sha256) { sha = p.sha256; reutilizados++; }
      else { try { sha = await huella(ruta); } catch (e) { errores.push({ ruta, error: e.code || e.message }); } }
      const rel = relative(rAbs, ruta);
      const carpetas = rel.split(sep).slice(0, -1);
      const dudoso = DUDOSOS.find(([re]) => re.test(nombre))?.[1] || (st.size === 0 ? 'archivo vacío' : '');
      archivos.push({
        id: 'inv_' + createHash('sha1').update(ruta).digest('hex').slice(0, 16), // estable por ruta
        equipo, raiz: rAbs, rutaRelativa: rel, rutaAbsoluta: ruta, nombre,
        extension: extname(nombre).slice(1).toLowerCase(), categoria: categoriaFormato({ nombre }),
        tamano: st.size,
        modificado: st.mtime.toISOString(),
        creado: st.birthtime?.getTime() ? st.birthtime.toISOString() : '',
        sha256: sha,
        dudoso,
        // Pistas INFERIDAS de las carpetas: no son temas confirmados.
        pistas: { carpetas, origen: 'inferido', evidencia: 'nombre de carpeta' },
      });
      if (archivos.length % 200 === 0) log(`… ${archivos.length} archivos`);
    }
  }

  // Duplicados exactos por huella
  const porHash = new Map();
  for (const a of archivos) if (a.sha256) { if (!porHash.has(a.sha256)) porHash.set(a.sha256, []); porHash.get(a.sha256).push(a); }
  const grupos = [...porHash.values()].filter(g => g.length > 1);
  for (const [i, g] of grupos.entries()) for (const a of g) a.grupoDuplicado = i + 1;

  const resultado = {
    formato: 'biblioteca-inventario/1',
    generado: new Date().toISOString(),
    equipo, raices: raices.map(r => resolve(r)),
    nota: 'Inventario de solo lectura. Fechas = fechas del sistema de archivos, NO fechas de aplicación en clase. Las pistas de carpeta son inferencias.',
    totales: { archivos: archivos.length, bytes: archivos.reduce((s, a) => s + a.tamano, 0), gruposDuplicados: grupos.length, dudosos: archivos.filter(a => a.dudoso).length, errores: errores.length, huellasReutilizadas: reutilizados },
    archivos, errores,
  };
  writeFileSync(join(salidaAbs, 'inventario.json'), JSON.stringify(resultado, null, 2));
  writeFileSync(join(salidaAbs, 'inventario.csv'), csv([
    ['equipo', 'carpeta_raiz', 'ruta_relativa', 'nombre', 'formato', 'categoria', 'tamano_bytes', 'modificado', 'creado', 'sha256', 'grupo_duplicado', 'dudoso'],
    ...archivos.map(a => [a.equipo, a.raiz, a.rutaRelativa, a.nombre, a.extension, a.categoria, a.tamano, a.modificado, a.creado, a.sha256, a.grupoDuplicado || '', a.dudoso]),
  ]));
  writeFileSync(join(salidaAbs, 'resumen.md'), resumen(resultado, grupos));
  log(`Listo: ${archivos.length} archivos, ${grupos.length} grupos de duplicados, ${errores.length} errores. Salida: ${salidaAbs}`);
  return resultado;
}

function mb(n) { return (n / 1024 / 1024).toFixed(1) + ' MB'; }

function resumen(r, grupos) {
  const porCat = {}, porCarpeta = {};
  for (const a of r.archivos) {
    porCat[a.categoria] = porCat[a.categoria] || { n: 0, b: 0 }; porCat[a.categoria].n++; porCat[a.categoria].b += a.tamano;
    const c = a.pistas.carpetas[0] || '(raíz)';
    porCarpeta[c] = (porCarpeta[c] || 0) + 1;
  }
  const l = [];
  l.push(`# Resumen del inventario${r.equipo ? ' — ' + r.equipo : ''}`, '');
  l.push(`Generado: ${r.generado}`, '', `Carpetas revisadas (solo lectura):`, ...r.raices.map(x => `- \`${x}\``), '');
  l.push(`> ${r.nota}`, '');
  l.push(`**${r.totales.archivos} archivos**, ${mb(r.totales.bytes)}. Duplicados exactos: ${grupos.length} grupos. Dudosos: ${r.totales.dudosos}. Errores de lectura: ${r.totales.errores}.`, '');
  l.push('## Por formato', '', '| Formato | Archivos | Tamaño |', '|---|---|---|');
  for (const [k, v] of Object.entries(porCat).sort((a, b) => b[1].n - a[1].n)) l.push(`| ${CATEGORIAS_FORMATO[k] || k} | ${v.n} | ${mb(v.b)} |`);
  l.push('', '## Por carpeta de primer nivel', '', '| Carpeta | Archivos |', '|---|---|');
  for (const [k, v] of Object.entries(porCarpeta).sort((a, b) => b[1] - a[1])) l.push(`| ${k} | ${v} |`);
  if (grupos.length) {
    l.push('', '## Duplicados exactos (misma huella)', '');
    for (const [i, g] of grupos.slice(0, 100).entries()) { l.push(`${i + 1}. ${mb(g[0].tamano)}`); for (const a of g) l.push(`   - \`${a.rutaRelativa}\``); }
    if (grupos.length > 100) l.push(`… y ${grupos.length - 100} grupos más (ver inventario.csv, columna grupo_duplicado).`);
  }
  const dud = r.archivos.filter(a => a.dudoso);
  if (dud.length) { l.push('', '## Archivos dudosos o incompletos', ''); for (const a of dud.slice(0, 100)) l.push(`- \`${a.rutaRelativa}\` — ${a.dudoso}`); }
  if (r.errores.length) { l.push('', '## No se pudieron leer', ''); for (const e of r.errores.slice(0, 100)) l.push(`- \`${e.ruta}\` — ${e.error}`); }
  l.push('', '## Siguiente paso', '', 'Revisar con César qué colección es abundante y variada para el piloto. Nada de esto está clasificado todavía.');
  return l.join('\n') + '\n';
}

const esPrincipal = process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname);
if (esPrincipal) {
  const a = argumentos(process.argv.slice(2));
  if (a.ayuda || !a.raices.length) {
    console.log('Uso: node herramientas/inventario.mjs --raiz <carpeta> [--raiz <otra>] --salida <carpeta privada> [--equipo nombre] [--incluir-ocultos]');
    process.exit(a.ayuda ? 0 : 1);
  }
  inventariar({ raices: a.raices, salida: a.salida, equipo: a.equipo, ocultos: a.ocultos }).catch(e => { console.error('Error:', e.message); process.exit(1); });
}
