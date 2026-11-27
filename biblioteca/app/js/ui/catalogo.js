// Catálogo: búsqueda, filtros cruzados y tarjetas.
import { h, poner, prefs } from '../util.js';
import { TIPOS_RECURSO, USOS, GRADOS, CATEGORIAS_FORMATO, ESTADOS_VERSION, CAMPOS_FORMATIVOS, categoriaFormato, rutaTema } from '../modelo.js';
import { crearIndice, filtrar, ordenar, facetas } from '../busqueda.js';
import { vistaPrevia, elegirMiniatura, ICONOS } from '../vista-previa.js';
import { chipGrado, chipEstado, chip, select, vacio } from './comun.js';
import { seleccion } from './seleccion.js';

const filtros = prefs.leer('filtros', {});

export function vistaCatalogo(cat, contenedor, params = {}) {
  // Enlaces como #/?tema=… o #/?estado=sin_elegida aplican ese filtro.
  const alias = { tema: 'temaId', coleccion: 'coleccionId' };
  const permitidos = ['tipo', 'formato', 'uso', 'grado', 'asignatura', 'campo', 'temaId', 'coleccionId', 'ciclo', 'escuela', 'estado', 'q'];
  const desdeEnlace = Object.entries(params).map(([k, v]) => [alias[k] || k, v]).filter(([k]) => permitidos.includes(k) || k === 'sinClasificar');
  if (desdeEnlace.length) {
    for (const k of Object.keys(filtros)) delete filtros[k];
    for (const [k, v] of desdeEnlace) filtros[k] = k === 'sinClasificar' ? v === '1' : v;
  }
  const datos = cat.datos;
  const fac = facetas(datos);
  const temasPorId = new Map(datos.temas.map(t => [t.id, t]));

  const q = h('input', { type: 'search', name: 'q', value: filtros.q || '', placeholder: 'Buscar por título, tema, contenido, archivo, notas…', 'aria-label': 'Buscar' });
  const panel = h('form', { class: 'filtros', onsubmit: e => e.preventDefault() },
    filtro('tipo', 'Tipo de recurso', TIPOS_RECURSO),
    filtro('formato', 'Formato', CATEGORIAS_FORMATO),
    filtro('uso', 'Uso', USOS),
    filtro('grado', 'Grado', Object.fromEntries(GRADOS.map(g => [g, g + '°']))),
    filtro('asignatura', 'Asignatura', fac.asignaturas),
    filtro('campo', 'Campo formativo', [...new Set([...CAMPOS_FORMATIVOS, ...fac.campos])]),
    filtro('temaId', 'Tema', Object.fromEntries(datos.temas.filter(t => t.nivel !== 'subtema').map(t => [t.id, rutaTema(t.id, temasPorId)]).sort((a, b) => a[1].localeCompare(b[1], 'es')))),
    filtro('coleccionId', 'Colección o proyecto', Object.fromEntries(datos.colecciones.map(c => [c.id, c.nombre]))),
    filtro('ciclo', 'Ciclo de uso', fac.ciclos),
    filtro('escuela', 'Escuela', fac.escuelas),
    filtro('estado', 'Versiones', { ...ESTADOS_VERSION, sin_elegida: 'Sin versión elegida' }),
    h('label', { class: 'casilla' }, h('input', { type: 'checkbox', name: 'sinClasificar', checked: !!filtros.sinClasificar }), h('span', {}, 'Por clasificar')),
    h('label', { class: 'casilla' }, h('input', { type: 'checkbox', name: 'verArchivados', checked: !!filtros.verArchivados }), h('span', {}, 'Ver archivados')),
    h('button', { type: 'button', class: 'btn btn-sm', onclick: () => { for (const k of Object.keys(filtros)) delete filtros[k]; prefs.guardar('filtros', filtros); vistaCatalogo(cat, contenedor); } }, 'Limpiar filtros'));

  function filtro(nombre, etiqueta, opciones) {
    const s = select(nombre, opciones, filtros[nombre] || '', { vacio: etiqueta });
    s.setAttribute('aria-label', etiqueta);
    if (filtros[nombre]) s.classList.add('activo');
    return s;
  }

  const orden = select('orden', { reciente: 'Más recientes', titulo: 'Por título' }, filtros.orden || 'reciente', { vacio: null });
  orden.setAttribute('aria-label', 'Ordenar');
  const resultados = h('div', { class: 'tarjetas' });
  const conteo = h('p', { class: 'conteo' });
  const btnFiltros = h('button', { type: 'button', class: 'btn btn-sm solo-movil', onclick: () => panel.classList.toggle('abierto') }, '⚙ Filtros');

  const actualizar = () => {
    filtros.q = q.value;
    for (const el of panel.elements) {
      if (!el.name) continue;
      if (el.type === 'checkbox') filtros[el.name] = el.checked; else filtros[el.name] = el.value;
      el.classList?.toggle('activo', !!el.value && el.type !== 'checkbox');
    }
    filtros.orden = orden.value;
    prefs.guardar('filtros', filtros);
    pintar();
  };
  q.addEventListener('input', actualizar);
  panel.addEventListener('change', actualizar);
  orden.addEventListener('change', actualizar);

  function pintar() {
    const ix = crearIndice(datos);
    const lista = ordenar(filtrar(datos.recursos, filtros, ix), filtros.orden);
    const total = datos.recursos.filter(r => !r.archivado).length;
    conteo.textContent = `${lista.length} de ${total} recursos`;
    if (!total) {
      resultados.replaceChildren(vacio('Tu biblioteca está vacía. Agrega tu primer material.', h('a', { class: 'btn btn-primario', href: '#/nuevo' }, '＋ Agregar material')));
      return;
    }
    if (!lista.length) { resultados.replaceChildren(vacio('Nada coincide con la búsqueda y los filtros.')); return; }
    resultados.replaceChildren(...lista.slice(0, 300).map(r => tarjeta(cat, r, ix)));
    if (lista.length > 300) resultados.appendChild(h('p', { class: 'tenue' }, `Mostrando 300 de ${lista.length}. Afina la búsqueda.`));
  }

  poner(contenedor, 
    h('div', { class: 'cab-vista' },
      h('h1', {}, 'Catálogo'),
      h('div', { class: 'acciones' }, h('a', { class: 'btn btn-primario', href: '#/nuevo' }, '＋ Agregar material'))),
    h('div', { class: 'barra-busqueda' }, q, orden, btnFiltros),
    panel,
    seleccion.barra(cat),
    conteo,
    resultados);
  pintar();
}

function tarjeta(cat, r, ix) {
  const archivos = ix.archivosPorRecurso.get(r.id) || [];
  const versiones = ix.versionesPorRecurso.get(r.id) || [];
  const usos = ix.contextosPorRecurso.get(r.id) || [];
  const elegida = versiones.find(v => v.id === r.versionElegidaId);
  const formatos = [...new Set(archivos.map(categoriaFormato))];
  const mini = elegirMiniatura(archivos.filter(a => !elegida || a.versionId === elegida.id)) || elegirMiniatura(archivos);
  const caja = h('div', { class: 'tarjeta-mini' }, h('span', { class: 'mini-icono', 'aria-hidden': 'true' }, ICONOS[formatos[0]] || '📄'));
  if (mini) vistaPrevia(cat, mini).then(el => caja.replaceChildren(el));
  const sel = seleccion.casilla(cat, r);
  return h('article', { class: 'tarjeta' + (r.archivado ? ' archivado' : '') },
    h('a', { href: '#/r/' + r.id, class: 'tarjeta-enlace', 'aria-label': r.titulo }, caja),
    h('div', { class: 'tarjeta-cuerpo' },
      h('div', { class: 'tarjeta-chips' }, r.grados.map(chipGrado), r.tipoRecurso ? chip(TIPOS_RECURSO[r.tipoRecurso], 'chip-tipo') : chip('Sin tipo', 'chip-pendiente')),
      h('h3', {}, h('a', { href: '#/r/' + r.id }, r.titulo)),
      r.asignaturas.length ? h('p', { class: 'tarjeta-meta' }, r.asignaturas.join(' · ')) : null,
      h('div', { class: 'tarjeta-pie' },
        h('span', { class: 'mono', title: 'Formatos' }, formatos.map(f => ICONOS[f]).join(' ') || '—'),
        h('span', { class: 'mono', title: 'Versiones' }, `v${versiones.length}`),
        usos.length ? h('span', { class: 'mono', title: 'Usos registrados' }, `📅 ${usos.length}`) : null,
        elegida ? chipEstado('elegida_cesar') : (versiones.length > 1 ? chip('Sin elegir', 'chip-pendiente') : null)),
      sel));
}
