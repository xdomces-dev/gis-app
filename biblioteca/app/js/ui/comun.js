// Piezas de interfaz compartidas.
import { h } from '../util.js';
import { GRADE_COLORS, ESTADOS_VERSION } from '../modelo.js';

export function toast(texto, tipo = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = texto;
  t.className = 'toast visible ' + tipo;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.className = 'toast'; }, tipo === 'error' ? 6000 : 3000);
}

/** Ejecuta una acción y muestra el error si falla. */
export async function intentar(fn, ok) {
  try { const r = await fn(); if (ok) toast(ok); return r; }
  catch (e) { console.error(e); toast(e.message || String(e), 'error'); return undefined; }
}

export function modal(titulo, contenido, { ancho = false } = {}) {
  const cerrar = () => { fondo.remove(); document.removeEventListener('keydown', esc); document.dispatchEvent(new Event('modal-cerrado')); };
  const esc = (e) => { if (e.key === 'Escape') cerrar(); };
  const fondo = h('div', { class: 'modal-fondo', onclick: (e) => { if (e.target === fondo) cerrar(); } },
    h('div', { class: 'modal' + (ancho ? ' modal-ancho' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': titulo },
      h('div', { class: 'modal-cab' }, h('h2', {}, titulo), h('button', { class: 'btn-icono', type: 'button', 'aria-label': 'Cerrar', onclick: cerrar }, '✕')),
      h('div', { class: 'modal-cuerpo' }, typeof contenido === 'function' ? contenido(cerrar) : contenido)));
  document.addEventListener('keydown', esc);
  document.body.appendChild(fondo);
  fondo.querySelector('input,select,textarea,button:not(.btn-icono)')?.focus();
  return cerrar;
}

export function confirmar(texto) {
  return new Promise(res => {
    const cerrar = modal('Confirmar', (c) => h('div', {},
      h('p', {}, texto),
      h('div', { class: 'fila-botones' },
        h('button', { class: 'btn', type: 'button', onclick: () => { c(); res(false); } }, 'Cancelar'),
        h('button', { class: 'btn btn-primario', type: 'button', onclick: () => { c(); res(true); } }, 'Confirmar'))));
    void cerrar;
  });
}

export function chipGrado(g) {
  return h('span', { class: 'chip-grado', style: { background: GRADE_COLORS[g] || '#555' } }, g + '°');
}

export function chipEstado(estado) {
  return h('span', { class: 'chip-estado estado-' + estado }, ESTADOS_VERSION[estado] || estado);
}

export function chip(texto, cls = '') {
  return h('span', { class: 'chip ' + cls }, texto);
}

export function campo(etiqueta, control, ayuda) {
  return h('label', { class: 'campo' }, h('span', { class: 'campo-etq' }, etiqueta), control, ayuda ? h('small', { class: 'campo-ayuda' }, ayuda) : null);
}

export function select(nombre, opciones, valor = '', { vacio = 'Todos' } = {}) {
  const ops = Array.isArray(opciones) ? opciones.map(o => [o, o]) : Object.entries(opciones);
  return h('select', { name: nombre },
    vacio != null ? h('option', { value: '' }, vacio) : null,
    ops.map(([v, t]) => h('option', { value: v, selected: v === valor }, t)));
}

/** Casillas múltiples (usos, grados, modalidades…). */
export function casillas(nombre, opciones, seleccion = []) {
  const ops = Array.isArray(opciones) ? opciones.map(o => [o, o]) : Object.entries(opciones);
  return h('div', { class: 'casillas', role: 'group' },
    ops.map(([v, t]) => h('label', { class: 'casilla' }, h('input', { type: 'checkbox', name: nombre, value: v, checked: seleccion.includes(v) }), h('span', {}, t))));
}

export function leerCasillas(form, nombre) {
  return [...form.querySelectorAll(`input[name="${nombre}"]:checked`)].map(i => i.value);
}

/** Selector de temas con búsqueda: devuelve un elemento y una función para leer los ids. */
export function selectorTemas(cat, seleccion = []) {
  const elegidos = new Set(seleccion);
  const lista = h('div', { class: 'temas-elegidos' });
  const buscador = h('input', { type: 'search', placeholder: 'Buscar tema…', 'aria-label': 'Buscar tema' });
  const sugerencias = h('div', { class: 'temas-sugerencias' });
  const pintar = () => {
    lista.replaceChildren(...[...elegidos].map(id => {
      const t = cat.tema(id);
      return h('span', { class: 'chip chip-tema' }, t ? t.nombre : id, h('button', { type: 'button', class: 'chip-x', 'aria-label': 'Quitar', onclick: () => { elegidos.delete(id); pintar(); } }, '×'));
    }));
    if (!elegidos.size) lista.appendChild(h('small', { class: 'tenue' }, 'Sin temas'));
  };
  buscador.addEventListener('input', () => {
    const q = buscador.value.trim().toLowerCase();
    sugerencias.replaceChildren();
    if (q.length < 2) return;
    const res = cat.datos.temas.filter(t => t.nombre.toLowerCase().includes(q) && !elegidos.has(t.id)).slice(0, 8);
    for (const t of res) {
      const padre = t.padreId ? cat.tema(t.padreId)?.nombre : '';
      sugerencias.appendChild(h('button', { type: 'button', class: 'sugerencia', onclick: () => { elegidos.add(t.id); buscador.value = ''; sugerencias.replaceChildren(); pintar(); } }, t.nombre, padre ? h('small', {}, ' · ' + padre) : null));
    }
    if (!res.length) sugerencias.appendChild(h('small', { class: 'tenue' }, 'Sin coincidencias. Crea temas en «Temas».'));
  });
  pintar();
  return { el: h('div', { class: 'selector-temas' }, lista, buscador, sugerencias), leer: () => [...elegidos] };
}

/** Lista de texto separada por comas con sugerencias. */
export function entradaLista(nombre, valores, sugerencias, placeholder) {
  const id = 'dl-' + nombre + '-' + Math.random().toString(36).slice(2, 7);
  return h('span', { class: 'entrada-lista' },
    h('input', { name: nombre, value: (valores || []).join(', '), list: id, placeholder: placeholder || 'Separar con comas' }),
    h('datalist', { id }, sugerencias.map(s => h('option', { value: s }))));
}

export function vacio(texto, accion) {
  return h('div', { class: 'vacio' }, h('p', {}, texto), accion || null);
}
