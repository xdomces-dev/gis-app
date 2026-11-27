// Formularios: nuevo material, editar ficha, nueva versión, propuesta derivada.
import { h, poner, fmtBytes, hoyISO } from '../util.js';
import { CONFIG } from '../config.js';
import {
  TIPOS_RECURSO, USOS, GRADOS, MODALIDADES, ROLES_ARCHIVO, ESTADOS_VERSION, CAMPOS_FORMATIVOS, ASIGNATURAS_SUGERIDAS,
  RELACIONES, limpiarLista, cicloDeFecha, categoriaFormato,
} from '../modelo.js';
import { campo, select, casillas, leerCasillas, selectorTemas, entradaLista, toast, intentar, chipEstado } from './comun.js';
import { seleccion } from './seleccion.js';

/** Campos de la ficha. Solo el título es obligatorio. */
export function formFicha(cat, r = {}) {
  const temas = selectorTemas(cat, r.temaIds || []);
  const colecciones = cat.datos.colecciones;
  const el = h('div', { class: 'ficha-campos' },
    campo('Título *', h('input', { name: 'titulo', value: r.titulo || '', required: true, maxlength: 300 })),
    h('details', { class: 'mas', open: !!r.id },
      h('summary', {}, 'Clasificación (opcional, se puede completar después)'),
      campo('Qué es', select('tipoRecurso', TIPOS_RECURSO, r.tipoRecurso || '', { vacio: '— sin definir —' })),
      campo('Grados', casillas('grados', Object.fromEntries(GRADOS.map(g => [g, g + '°'])), r.grados || [])),
      campo('Usos', casillas('usos', USOS, r.usos || [])),
      campo('Asignaturas', entradaLista('asignaturas', r.asignaturas, ASIGNATURAS_SUGERIDAS), 'Puede ser más de una.'),
      campo('Campos formativos', casillas('camposFormativos', CAMPOS_FORMATIVOS, r.camposFormativos || [])),
      campo('Temas', temas.el),
      colecciones.length ? campo('Colecciones y proyectos', casillas('coleccionIds', Object.fromEntries(colecciones.map(c => [c.id, c.nombre])), r.coleccionIds || [])) : null,
      campo('Modalidad de trabajo', casillas('modalidades', MODALIDADES, r.modalidades || [])),
      campo('Gradualidad o dificultad', h('input', { name: 'gradualidad', value: r.gradualidad || '', placeholder: 'p. ej. nivel 1 / básico / avanzado' })),
      campo('Descripción', h('textarea', { name: 'descripcion', rows: 3 }, r.descripcion || '')),
      campo('Etiquetas', h('input', { name: 'etiquetas', value: (r.etiquetas || []).join(', '), placeholder: 'Separar con comas' }))));
  return {
    el,
    leer(form) {
      return {
        titulo: form.titulo.value,
        tipoRecurso: form.tipoRecurso.value,
        grados: leerCasillas(form, 'grados'),
        usos: leerCasillas(form, 'usos'),
        asignaturas: limpiarLista(form.asignaturas.value),
        camposFormativos: leerCasillas(form, 'camposFormativos'),
        temaIds: temas.leer(),
        coleccionIds: leerCasillas(form, 'coleccionIds'),
        modalidades: leerCasillas(form, 'modalidades'),
        gradualidad: form.gradualidad.value,
        descripcion: form.descripcion.value,
        etiquetas: limpiarLista(form.etiquetas.value),
      };
    },
  };
}

/** Selector de archivos y enlaces con su rol (final, editable, miniatura…). */
export function selectorArchivos() {
  const elegidos = []; // { blob, nombre, mime, rol, fechaArchivo } | { url, nombre, rol }
  const lista = h('ul', { class: 'lista-archivos' });
  const input = h('input', { type: 'file', multiple: true, 'aria-label': 'Elegir archivos' });
  const url = h('input', { type: 'url', placeholder: 'https://… (video, Canva, Drive, página)', 'aria-label': 'Enlace' });
  const rolPara = (f) => /image\//.test(f.type) && elegidos.every(e => e.rol !== 'miniatura') && elegidos.length ? 'miniatura' : (/\.(pptx?|docx?|xlsx?|odp|odt|key)$/i.test(f.name) ? 'editable' : 'final');
  const pintar = () => {
    lista.replaceChildren(...elegidos.map((e, i) => h('li', {},
      h('span', { class: 'nombre-archivo' }, e.url ? '🔗 ' + e.url : e.nombre),
      e.blob ? h('small', { class: 'mono' }, fmtBytes(e.blob.size)) : null,
      (() => { const s = select('rol', ROLES_ARCHIVO, e.rol, { vacio: null }); s.setAttribute('aria-label', 'Rol del archivo'); s.addEventListener('change', () => { e.rol = s.value; }); return s; })(),
      h('button', { type: 'button', class: 'btn-icono', 'aria-label': 'Quitar', onclick: () => { elegidos.splice(i, 1); pintar(); } }, '✕'))));
  };
  input.addEventListener('change', () => {
    for (const f of input.files) {
      if (f.size > CONFIG.maxBytesArchivo) { toast(`${f.name} supera ${fmtBytes(CONFIG.maxBytesArchivo)}; guárdalo como enlace.`, 'error'); continue; }
      elegidos.push({ blob: f, nombre: f.name, mime: f.type, rol: rolPara(f), fechaArchivo: f.lastModified ? new Date(f.lastModified).toISOString() : '' });
    }
    input.value = '';
    pintar();
  });
  const agregarUrl = () => {
    const v = url.value.trim();
    if (!/^https?:\/\//i.test(v)) { toast('El enlace debe empezar con http:// o https://', 'error'); return; }
    elegidos.push({ url: v, nombre: v, rol: 'final' });
    url.value = '';
    pintar();
  };
  url.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); agregarUrl(); } });
  const el = h('div', { class: 'selector-archivos' },
    h('label', { class: 'zona-archivos' }, h('span', {}, '📎 Elegir archivos'), h('small', {}, 'Editable, PDF, imágenes, HTML, video… Varios archivos = una misma versión.'), input),
    h('div', { class: 'fila' }, url, h('button', { type: 'button', class: 'btn btn-sm', onclick: agregarUrl }, 'Agregar enlace')),
    lista);
  return { el, leer: () => elegidos.slice() };
}

function reporteGuardado(rep) {
  const partes = [];
  if (rep.guardados?.length) partes.push(`✓ ${rep.guardados.length} archivo(s) guardados`);
  if (rep.fallos?.length) partes.push(`✗ fallaron: ${rep.fallos.map(f => f.nombre + ' (' + f.error + ')').join(', ')}`);
  if (rep.faltantes?.length) partes.push(`faltan: ${rep.faltantes.join(', ')}`);
  return partes.join(' · ') || 'Guardado (sin archivos)';
}

/** Antes de guardar: avisa de duplicados. Devuelve true si se puede continuar. */
async function revisarDuplicados(cat, archivos, avisoEl) {
  avisoEl.replaceChildren();
  if (!archivos.length) return true;
  const res = await cat.revisarDuplicados(archivos);
  const conDup = res.filter(r => r.exactos.length || r.probables.length);
  if (!conDup.length) return true;
  avisoEl.append(h('p', {}, h('strong', {}, 'Posibles duplicados encontrados:')));
  for (const d of conDup) {
    const lista = [...d.exactos.map(a => [a, 'idéntico']), ...d.probables.map(a => [a, 'mismo nombre y tamaño'])];
    avisoEl.append(h('p', {}, d.nombre + ' → ', lista.map(([a, tipo]) => h('span', {}, h('a', { href: '#/r/' + a.recursoId, target: '_blank' }, cat.recurso(a.recursoId)?.titulo || a.recursoId), ` (${tipo}) `))));
  }
  avisoEl.append(h('p', {}, 'Revisa los enlaces. Si de todos modos es otro material o una versión distinta, pulsa «Guardar» otra vez.'));
  avisoEl.hidden = false;
  return false;
}

export function vistaNuevo(cat, contenedor) {
  const ficha = formFicha(cat);
  const archivos = selectorArchivos();
  const aviso = h('div', { class: 'aviso', hidden: true });
  let confirmadoDup = false;
  const form = h('form', { class: 'formulario' },
    ficha.el,
    h('fieldset', {}, h('legend', {}, 'Archivos y enlaces'), archivos.el),
    h('details', { class: 'mas' },
      h('summary', {}, 'Versión y uso en clase (opcional)'),
      campo('Estado de esta versión', select('estado', ESTADOS_VERSION, 'borrador', { vacio: null }), '«Elegida por César» solo si tú la elegiste.'),
      campo('Consigna o prompt con que se hizo', h('textarea', { name: 'consigna', rows: 2 })),
      campo('Escuela donde se usó', h('input', { name: 'escuela', list: 'dl-escuelas', placeholder: 'p. ej. Teocalli' }),
        h('datalist', { id: 'dl-escuelas' }, [...new Set(cat.datos.contextos.map(c => c.escuela).filter(Boolean))].map(e => h('option', { value: e })))),
      campo('Fecha en que se aplicó en clase', h('input', { type: 'date', name: 'fechaAplicada' }), 'Distinta de la fecha del archivo. Déjala vacía si no la sabes.')),
    aviso,
    h('div', { class: 'fila-botones' },
      h('a', { class: 'btn', href: '#/' }, 'Cancelar'),
      h('button', { class: 'btn btn-primario', type: 'submit' }, 'Guardar en la biblioteca')));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    const lista = archivos.leer();
    if (!confirmadoDup) {
      btn.disabled = true;
      const seguir = await intentar(() => revisarDuplicados(cat, lista, aviso));
      btn.disabled = false;
      if (!seguir) { confirmadoDup = true; return; }
    }
    btn.disabled = true; btn.textContent = 'Guardando…';
    const rep = await intentar(() => cat.registrarRecurso({
      ficha: ficha.leer(form), archivos: lista,
      version: { estado: form.estado.value, consigna: form.consigna.value },
    }));
    if (rep && (form.escuela.value || form.fechaAplicada.value)) {
      await intentar(() => cat.registrarUso({ recursoId: rep.recursoId, versionId: rep.versionId, escuela: form.escuela.value, fechaAplicada: form.fechaAplicada.value, ciclo: cicloDeFecha(form.fechaAplicada.value) }));
    }
    btn.disabled = false; btn.textContent = 'Guardar en la biblioteca';
    if (!rep) return;
    toast(reporteGuardado(rep), rep.fallos.length ? 'error' : 'ok');
    location.hash = '#/r/' + rep.recursoId;
  });
  poner(contenedor, h('div', { class: 'cab-vista' }, h('h1', {}, 'Agregar material')), form);
}

/** Nueva versión (corrección o adaptación) del mismo recurso. */
export function formNuevaVersion(cat, recursoId, basadaEn, cerrar) {
  const archivos = selectorArchivos();
  const form = h('form', { class: 'formulario' },
    campo('Tipo de cambio', select('relacion', { correccion: RELACIONES.correccion, adaptacion: RELACIONES.adaptacion }, 'correccion', { vacio: null }),
      'Corrección: se arregla un error. Adaptación: mismo material para otro grado, escuela o formato. Para una propuesta nueva usa «Combinar».'),
    campo('Qué cambió', h('textarea', { name: 'cambios', rows: 2, required: true })),
    campo('Consigna usada (si la hubo)', h('textarea', { name: 'consigna', rows: 2 })),
    campo('Etiqueta', h('input', { name: 'etiqueta', placeholder: 'p. ej. «intento 3», «versión WhatsApp»' })),
    campo('Estado', select('estado', ESTADOS_VERSION, 'borrador', { vacio: null })),
    h('fieldset', {}, h('legend', {}, 'Archivos de esta versión'), archivos.el),
    h('div', { class: 'fila-botones' }, h('button', { class: 'btn', type: 'button', onclick: cerrar }, 'Cancelar'), h('button', { class: 'btn btn-primario', type: 'submit' }, 'Guardar versión')));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rep = await intentar(() => cat.nuevaVersion(recursoId, {
      relacion: form.relacion.value, cambios: form.cambios.value, consigna: form.consigna.value,
      etiqueta: form.etiqueta.value, estado: form.estado.value, archivos: archivos.leer(), basadaEn,
    }));
    if (rep) { toast(reporteGuardado(rep), rep.fallos.length ? 'error' : 'ok'); cerrar(); }
  });
  return form;
}

/** Propuesta derivada a partir de los materiales seleccionados. */
export function vistaDerivar(cat, contenedor) {
  const ids = seleccion.versiones();
  if (!ids.length) {
    poner(contenedor, h('div', { class: 'cab-vista' }, h('h1', {}, 'Combinar materiales')),
      h('p', {}, 'Primero marca «Combinar» en dos o más materiales del catálogo (o en una versión dentro de un recurso).'), h('a', { class: 'btn', href: '#/' }, 'Ir al catálogo'));
    return;
  }
  const origenes = ids.map(id => ({ v: cat.version(id), r: cat.recurso(cat.version(id)?.recursoId) })).filter(o => o.v && o.r);
  const temasUnion = [...new Set(origenes.flatMap(o => o.r.temaIds))];
  const gradosUnion = [...new Set(origenes.flatMap(o => o.r.grados))];
  const ficha = formFicha(cat, { titulo: '', temaIds: temasUnion, grados: gradosUnion, asignaturas: [...new Set(origenes.flatMap(o => o.r.asignaturas))] });
  const archivos = selectorArchivos();
  const form = h('form', { class: 'formulario' },
    h('fieldset', {}, h('legend', {}, 'Materiales de origen'),
      h('ul', {}, origenes.map(o => h('li', {}, h('a', { href: '#/r/' + o.r.id }, o.r.titulo), ` — v${o.v.numero} `, chipEstado(o.v.estado))))),
    campo('Consigna de transformación *', h('textarea', { name: 'consigna', rows: 3, required: true, placeholder: 'p. ej. «Combina el cuadernillo y la presentación en un HTML con un video, preguntas y evaluación»' })),
    campo('Qué se cambió respecto a los originales', h('textarea', { name: 'cambios', rows: 2 })),
    h('fieldset', {}, h('legend', {}, 'Ficha de la nueva propuesta'), ficha.el),
    h('fieldset', {}, h('legend', {}, 'Archivos (si ya existen)'), archivos.el),
    h('fieldset', {}, h('legend', {}, 'Contexto donde se usará (opcional)'),
      campo('Escuela', h('input', { name: 'escuela' })), campo('Ciclo', h('input', { name: 'ciclo', placeholder: cicloDeFecha(hoyISO()) })),
      campo('Fecha prevista', h('input', { type: 'date', name: 'fechaPrevista' }))),
    h('div', { class: 'fila-botones' }, h('a', { class: 'btn', href: '#/' }, 'Cancelar'), h('button', { class: 'btn btn-primario', type: 'submit' }, 'Crear propuesta derivada')));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const contexto = form.escuela.value || form.ciclo.value || form.fechaPrevista.value
      ? { escuela: form.escuela.value, ciclo: form.ciclo.value || cicloDeFecha(form.fechaPrevista.value), fechaPrevista: form.fechaPrevista.value } : null;
    const rep = await intentar(() => cat.derivar({ origenVersionIds: ids, ficha: ficha.leer(form), consigna: form.consigna.value, cambios: form.cambios.value, archivos: archivos.leer(), contexto }));
    if (!rep) return;
    seleccion.vaciar();
    toast('Propuesta derivada creada. ' + reporteGuardado(rep));
    location.hash = '#/r/' + rep.recursoId;
  });
  poner(contenedor, h('div', { class: 'cab-vista' }, h('h1', {}, 'Nueva propuesta derivada')), form);
}

export { reporteGuardado, categoriaFormato };
