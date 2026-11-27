#!/usr/bin/env node
// Crea un paquete de publicación (ZIP con manifest.json + archivos) para importarlo en la biblioteca:
// Respaldo › Importar. Es el mecanismo común de «Publica este material en mi biblioteca»
// para herramientas que no se conectan directamente (ver docs/biblioteca/PUBLICACION.md).
//
// Uso:
//   node herramientas/empaquetar.mjs --titulo "Juego del cuerpo humano" --tipo juego --grados 1,2 \
//     --asignaturas "Biología / Ciencias de la Vida" --temas "Aparatos y sistemas" --usos proyectar \
//     --consigna "Convierte la presentación en un juego" --herramienta claude-code \
//     --salida ~/paquetes juego.html portada.png:miniatura
//
// Para una nueva versión de un recurso existente: --recurso-existente rec_xxx --relacion correccion
// El idPublicacion se calcula de las huellas de los archivos + título: reintentar no duplica.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { escribirZip } from '../app/js/zip.js';
import { TIPOS_RECURSO, USOS, ROLES_ARCHIVO, ESTADOS_VERSION } from '../app/js/modelo.js';

const lista = (v) => (v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : []);

export function argumentos(argv) {
  const a = { archivos: [], enlaces: [] };
  const conValor = ['titulo', 'tipo', 'grados', 'asignaturas', 'temas', 'usos', 'descripcion', 'consigna', 'cambios', 'estado', 'herramienta', 'salida', 'recurso-existente', 'relacion', 'fuente', 'enlace'];
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith('--') && conValor.includes(k.slice(2))) {
      if (k === '--enlace') a.enlaces.push(argv[++i]); else a[k.slice(2)] = argv[++i];
    } else if (k === '--ayuda' || k === '-h') a.ayuda = true;
    else a.archivos.push(k);
  }
  return a;
}

export async function empaquetar(a) {
  if (!a.titulo && !a['recurso-existente']) throw new Error('Falta --titulo');
  if (!a.archivos.length && !a.enlaces.length) throw new Error('Indica al menos un archivo o --enlace');
  if (a.tipo && !TIPOS_RECURSO[a.tipo]) throw new Error('Tipo desconocido. Opciones: ' + Object.keys(TIPOS_RECURSO).join(', '));
  for (const u of lista(a.usos)) if (!USOS[u]) throw new Error('Uso desconocido: ' + u + '. Opciones: ' + Object.keys(USOS).join(', '));
  const estado = a.estado || 'pendiente_revision';
  if (!ESTADOS_VERSION[estado]) throw new Error('Estado desconocido: ' + estado);
  const entradas = [], archivos = [], huellas = [];
  const usados = new Set();
  for (const arg of a.archivos) {
    const m = /^(.*?)(?::([a-z_]+))?$/.exec(arg);
    const ruta = m[1], rol = m[2] && ROLES_ARCHIVO[m[2]] ? m[2] : 'final';
    let nombre = basename(ruta);
    if (usados.has(nombre)) throw new Error('Dos archivos con el mismo nombre: ' + nombre);
    usados.add(nombre);
    const datos = readFileSync(ruta);
    huellas.push(createHash('sha256').update(datos).digest('hex'));
    entradas.push({ nombre, datos: new Uint8Array(datos) });
    archivos.push({ nombre, rol });
  }
  for (const u of a.enlaces) {
    if (!/^https?:\/\//i.test(u)) throw new Error('Enlace inválido: ' + u);
    archivos.push({ url: u, nombre: u, rol: 'final' });
    huellas.push(u);
  }
  const herramienta = a.herramienta || 'claude-code';
  const id = createHash('sha256').update([a.titulo || '', a['recurso-existente'] || '', ...huellas].join('|')).digest('hex').slice(0, 20);
  const manifest = {
    formato: 'biblioteca-paquete/1',
    idPublicacion: `${herramienta}-${id}`,
    herramienta,
    creado: new Date().toISOString(),
    recurso: {
      titulo: a.titulo || '', tipoRecurso: a.tipo || '', descripcion: a.descripcion || '',
      grados: lista(a.grados), asignaturas: lista(a.asignaturas), usos: lista(a.usos), temas: lista(a.temas),
    },
    version: {
      estado, consigna: a.consigna || '', cambios: a.cambios || '',
      ...(a['recurso-existente'] ? { recursoExistenteId: a['recurso-existente'], relacion: a.relacion || 'correccion' } : {}),
    },
    archivos,
    fuentes: a.fuente ? [{ tipo: 'conversacion', descripcion: a.fuente }] : [],
  };
  entradas.unshift({ nombre: 'manifest.json', datos: new TextEncoder().encode(JSON.stringify(manifest, null, 2)) });
  const zip = await escribirZip(entradas);
  const dir = resolve(a.salida || '.');
  mkdirSync(dir, { recursive: true });
  const slug = (a.titulo || a['recurso-existente']).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 50);
  const ruta = join(dir, `${slug}-${id.slice(0, 8)}.zip`);
  writeFileSync(ruta, Buffer.from(await zip.arrayBuffer()));
  return { ruta, manifest };
}

const esPrincipal = process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname);
if (esPrincipal) {
  const a = argumentos(process.argv.slice(2));
  if (a.ayuda) { console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//')).map(l => l.slice(3)).join('\n')); process.exit(0); }
  empaquetar(a).then(({ ruta, manifest }) => {
    console.log('Paquete creado:', ruta);
    console.log('idPublicacion:', manifest.idPublicacion);
    console.log('Siguiente paso: en la biblioteca, Respaldo › Importar, y elegir este ZIP. La app devuelve el enlace al recurso.');
    if (manifest.version.estado === 'elegida_cesar') console.log('Nota: al importar, «elegida por César» se convierte en «pendiente de revisión»; solo César la marca como elegida.');
  }).catch(e => { console.error('Error:', e.message); process.exit(1); });
}
