// Respaldo e importación. El ZIP de respaldo se puede abrir SIN la app:
//   LEEME.txt, indice.csv (legible en Excel), catalogo.json y archivos/<titulo>/<version>/<nombre>.

import { escribirZip, leerZip } from './zip.js';
import { TIPOS_RECURSO, ESTADOS_VERSION, ROLES_ARCHIVO } from './modelo.js';

const seguro = (s) => String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 80) || 'sin_nombre';

function csv(filas) {
  return '﻿' + filas.map(f => f.map(v => {
    const t = String(v ?? '');
    return /[",\n;]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
  }).join(',')).join('\r\n');
}

/** Rutas legibles dentro del ZIP para cada archivo guardado. */
function rutasLegibles(cat) {
  const usados = new Set();
  const mapa = new Map();
  for (const a of cat.datos.archivos.filter(x => x.ruta)) {
    const r = cat.recurso(a.recursoId);
    const v = cat.version(a.versionId);
    let ruta = `archivos/${seguro(r?.titulo)}/v${v?.numero ?? '?'}/${seguro(a.nombre)}`;
    let n = 2;
    while (usados.has(ruta)) ruta = `archivos/${seguro(r?.titulo)}/v${v?.numero ?? '?'}/${n++}_${seguro(a.nombre)}`;
    usados.add(ruta);
    mapa.set(a.id, ruta);
  }
  return mapa;
}

/**
 * Crea el ZIP de respaldo completo. alProgresar(hechos, total) opcional.
 * Devuelve { blob, faltantes: [nombres que no se pudieron leer] }.
 */
export async function crearRespaldoZip(cat, alProgresar = () => {}) {
  const json = cat.exportar();
  const rutas = rutasLegibles(cat);
  json.rutasEnZip = Object.fromEntries(rutas);
  const entradas = [];
  const faltantes = [];
  const conRuta = cat.datos.archivos.filter(a => a.ruta);
  let i = 0;
  for (const a of conRuta) {
    try { entradas.push({ nombre: rutas.get(a.id), datos: await cat.blobArchivo(a) }); }
    catch { faltantes.push(a.nombre); }
    alProgresar(++i, conRuta.length);
  }
  const filas = [['recurso', 'tipo', 'version', 'estado_version', 'rol', 'archivo', 'formato', 'ruta_en_zip_o_enlace', 'id_recurso', 'id_version', 'id_archivo']];
  for (const a of cat.datos.archivos) {
    const r = cat.recurso(a.recursoId), v = cat.version(a.versionId);
    filas.push([r?.titulo, TIPOS_RECURSO[r?.tipoRecurso] || '', v?.numero, ESTADOS_VERSION[v?.estado] || '', ROLES_ARCHIVO[a.rol] || a.rol, a.nombre, a.formato, rutas.get(a.id) || a.url, a.recursoId, a.versionId, a.id]);
  }
  const leeme = [
    'RESPALDO DE LA BIBLIOTECA PEDAGÓGICA',
    `Creado: ${json.exportadoEn}`,
    '',
    'Este archivo se puede usar sin la aplicación:',
    '- indice.csv: lista de todos los archivos con su recurso, versión y estado (se abre en Excel).',
    '- archivos/: los archivos originales, por recurso y número de versión.',
    '- catalogo.json: todas las fichas, versiones, relaciones, temas, usos, notas y criterios.',
    '',
    'Para restaurar: en la biblioteca, Respaldo › Importar, y elegir este ZIP.',
    faltantes.length ? `\nATENCIÓN: ${faltantes.length} archivo(s) no se pudieron leer y no están en este respaldo:\n- ${faltantes.join('\n- ')}` : '',
  ].join('\r\n');
  entradas.unshift(
    { nombre: 'LEEME.txt', datos: new Blob([leeme]) },
    { nombre: 'indice.csv', datos: new Blob([csv(filas)]) },
    { nombre: 'catalogo.json', datos: new Blob([JSON.stringify(json, null, 2)]) },
  );
  return { blob: await escribirZip(entradas), faltantes };
}

/**
 * Importa un archivo elegido por César: catálogo (JSON o ZIP de respaldo) o paquete de publicación (ZIP o JSON).
 * Devuelve { tipo: 'catalogo' | 'paquete', reporte }.
 */
export async function importarArchivo(cat, archivo) {
  const nombre = archivo.name || '';
  if (/\.json$/i.test(nombre)) {
    const json = JSON.parse(await archivo.text());
    if (json.formato === 'biblioteca-catalogo/1') return { tipo: 'catalogo', reporte: await cat.importarCatalogo(json) };
    if (json.formato === 'biblioteca-paquete/1') return { tipo: 'paquete', reporte: await cat.importarPaquete(json, new Map()) };
    throw new Error('JSON sin formato reconocido (se esperaba biblioteca-catalogo/1 o biblioteca-paquete/1)');
  }
  const contenido = await leerZip(archivo);
  if (contenido.has('catalogo.json')) {
    const json = JSON.parse(await contenido.get('catalogo.json').text());
    const blobs = new Map();
    for (const [id, rutaZip] of Object.entries(json.rutasEnZip || {})) {
      const a = (json.archivos || []).find(x => x.id === id);
      if (a && contenido.has(rutaZip)) blobs.set(a.ruta, contenido.get(rutaZip));
    }
    return { tipo: 'catalogo', reporte: await cat.importarCatalogo(json, blobs) };
  }
  const nombreManifest = [...contenido.keys()].find(k => /(^|\/)manifest\.json$/.test(k));
  if (nombreManifest) {
    const base = nombreManifest.slice(0, -'manifest.json'.length);
    const manifest = JSON.parse(await contenido.get(nombreManifest).text());
    const porNombre = new Map();
    for (const [k, v] of contenido) if (k.startsWith(base) && k !== nombreManifest) porNombre.set(k.slice(base.length), v);
    return { tipo: 'paquete', reporte: await cat.importarPaquete(manifest, porNombre) };
  }
  throw new Error('El ZIP no contiene catalogo.json ni manifest.json');
}
