// Vistas previas. Regla: un HTML importado NUNCA se ejecuta con los privilegios de la biblioteca.
//
// Cuatro modos distintos para un HTML (docs/biblioteca/ARQUITECTURA.md):
//   1. Almacenar: se guarda tal cual; la app nunca lo inserta en su propia página.
//   2. Descargar: se entrega como archivo (application/octet-stream), no se abre.
//   3. Vista previa: iframe con sandbox="allow-scripts" SIN allow-same-origin.
//      El documento corre en un origen opaco: no puede leer la sesión, IndexedDB,
//      Firestore ni Storage de la biblioteca, ni tocar la página que lo contiene.
//   4. Actividad publicada: pendiente (Fase 8), en un sitio aparte con otro origen.

import { h, descargarBlob } from './util.js';
import { categoriaFormato } from './modelo.js';

export const SANDBOX_HTML = 'allow-scripts allow-forms allow-modals';

/** Elemento de vista previa para un archivo. Puede ser asíncrono (carga el contenido). */
export async function vistaPrevia(cat, archivo, { grande = false } = {}) {
  const cls = 'previa' + (grande ? ' previa-grande' : '');
  const cat_ = categoriaFormato(archivo);
  try {
    if (cat_ === 'imagen') {
      const url = await cat.urlArchivo(archivo);
      return h('div', { class: cls }, h('img', { src: url, alt: archivo.nombre, loading: 'lazy' }));
    }
    if (cat_ === 'pdf' && grande) {
      const url = await cat.urlArchivo(archivo);
      return h('div', { class: cls }, h('iframe', { src: url, title: archivo.nombre }));
    }
    if (cat_ === 'video' && archivo.ruta) {
      const url = await cat.urlArchivo(archivo);
      return h('div', { class: cls }, h('video', { src: url, controls: true, preload: 'metadata' }));
    }
    if (cat_ === 'audio' && archivo.ruta) {
      const url = await cat.urlArchivo(archivo);
      return h('div', { class: cls + ' previa-audio' }, h('audio', { src: url, controls: true, preload: 'metadata' }));
    }
    if (cat_ === 'html' && grande) {
      const texto = await (await cat.blobArchivo(archivo)).text();
      const marco = h('iframe', { sandbox: SANDBOX_HTML, title: 'Vista previa aislada: ' + archivo.nombre, referrerpolicy: 'no-referrer' });
      marco.srcdoc = texto;
      return h('div', { class: cls },
        h('p', { class: 'aviso-mini' }, '🔒 Vista previa aislada: esta actividad no puede leer tu biblioteca ni tu sesión.'),
        marco,
        h('button', { class: 'btn btn-sm', type: 'button', onclick: () => marco.requestFullscreen?.() }, '⛶ Pantalla completa'));
    }
    if (cat_ === 'texto' && grande && archivo.ruta && (archivo.tamano ?? 0) < 512 * 1024) {
      const texto = await (await cat.blobArchivo(archivo)).text();
      return h('div', { class: cls }, h('pre', { class: 'previa-texto' }, texto));
    }
  } catch (e) {
    return h('div', { class: cls + ' previa-icono' }, h('span', {}, '⚠️'), h('small', {}, 'No se pudo cargar la vista previa: ' + (e.message || e)));
  }
  return h('div', { class: cls + ' previa-icono' }, h('span', { 'aria-hidden': 'true' }, ICONOS[cat_] || '📄'), h('small', {}, archivo.formato || cat_));
}

export const ICONOS = {
  imagen: '🖼️', pdf: '📕', html: '🧩', video: '🎬', audio: '🎧', presentacion: '📊', documento: '📝',
  hoja: '📈', texto: '📃', paquete: '📦', enlace: '🔗', otro: '📄',
};

/** Miniatura para la tarjeta: archivo con rol miniatura, o la primera imagen. */
export function elegirMiniatura(archivos) {
  return archivos.find(a => a.rol === 'miniatura' && categoriaFormato(a) === 'imagen')
    || archivos.find(a => a.rol === 'vista_previa' && categoriaFormato(a) === 'imagen')
    || archivos.find(a => categoriaFormato(a) === 'imagen')
    || null;
}

// Un catálogo restaurado podría traer enlaces manipulados: solo se abren http(s).
function abrirEnlace(url) {
  if (!/^https?:\/\//i.test(url || '')) throw new Error('Enlace no permitido: solo http:// o https://');
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** Descarga el original. Los HTML se entregan como archivo, nunca se abren aquí. */
export async function descargar(cat, archivo) {
  if (archivo.url && !archivo.ruta) { abrirEnlace(archivo.url); return; }
  const blob = await cat.blobArchivo(archivo);
  const seguro = categoriaFormato(archivo) === 'html' ? new Blob([blob], { type: 'application/octet-stream' }) : blob;
  descargarBlob(seguro, archivo.nombre);
}

/** Abrir en pestaña: solo formatos que el navegador muestra sin ejecutar código (imagen, PDF, video). */
export async function abrir(cat, archivo) {
  const c = categoriaFormato(archivo);
  if (archivo.url && !archivo.ruta) { abrirEnlace(archivo.url); return true; }
  if (!['imagen', 'pdf', 'video', 'audio'].includes(c) || (c === 'imagen' && /svg/i.test(archivo.nombre))) return false;
  const url = await cat.urlArchivo(archivo);
  window.open(url, '_blank', 'noopener');
  return true;
}
