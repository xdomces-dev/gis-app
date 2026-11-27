// Utilidades sin dependencias del DOM (salvo h(), que solo se usa en el navegador).

/** Identificador estable: prefijo + tiempo + azar. No depende del nombre del archivo. */
export function nuevoId(prefijo) {
  const t = Date.now().toString(36);
  const r = Array.from(crypto.getRandomValues(new Uint8Array(6)), b => b.toString(36).padStart(2, '0')).join('').slice(0, 8);
  return `${prefijo}_${t}${r}`;
}

export function ahoraISO() {
  return new Date().toISOString();
}

export function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Huella SHA-256 en hexadecimal de un Blob o ArrayBuffer. */
export async function sha256(datos) {
  const buf = datos instanceof ArrayBuffer ? datos : await datos.arrayBuffer();
  const dig = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(dig), b => b.toString(16).padStart(2, '0')).join('');
}

export function fmtBytes(n) {
  if (n == null || isNaN(n)) return '—';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export function nombreMes(i) { return MESES[i]; }

export function fmtFecha(iso) {
  if (!iso) return 'sin fecha';
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
  if (isNaN(d)) return iso;
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

/** Quita acentos y pasa a minúsculas para buscar. */
export function normalizar(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function unico(arr) {
  return [...new Set((arr || []).filter(v => v !== '' && v != null))];
}

/**
 * Crea elementos del DOM sin innerHTML: el texto siempre se inserta como texto,
 * así un título o un nombre de archivo nunca se interpreta como HTML.
 */
export function h(tag, attrs, ...hijos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked' || k === 'selected' || k === 'disabled' || k === 'multiple' || k === 'required') el[k] = !!v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  agregar(el, hijos);
  return el;
}

function agregar(el, hijos) {
  for (const c of hijos) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) agregar(el, c);
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
}

/** Descarga un Blob con un nombre, sin abrirlo en la página. */
export function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre || 'archivo';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** localStorage con try/catch: puede no estar disponible (modo privado, bloqueos). */
export const prefs = {
  leer(clave, def) {
    try { const v = localStorage.getItem('bib-' + clave); return v == null ? def : JSON.parse(v); } catch { return def; }
  },
  guardar(clave, valor) {
    try { localStorage.setItem('bib-' + clave, JSON.stringify(valor)); } catch { /* sin almacenamiento local */ }
  },
};

/** Reemplaza el contenido de un elemento; acepta listas y omite null/false (a diferencia de replaceChildren). */
export function poner(el, ...hijos) {
  el.replaceChildren();
  agregar(el, hijos);
  return el;
}
