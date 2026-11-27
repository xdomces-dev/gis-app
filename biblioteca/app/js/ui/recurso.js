// Ficha de un recurso: datos, procedencia, versiones, archivos, usos, notas y relaciones.
import { h, poner, fmtFecha, fmtBytes } from '../util.js';
import {
  TIPOS_RECURSO, USOS, MODALIDADES, ROLES_ARCHIVO, ESTADOS_VERSION, RELACIONES, ORIGENES_DATO, GRADOS,
  rutaTema, cicloDeFecha, categoriaFormato,
} from '../modelo.js';
import { vistaPrevia, descargar, abrir, ICONOS } from '../vista-previa.js';
import { chipGrado, chipEstado, chip, modal, campo, select, intentar, toast, vacio, confirmar, casillas, leerCasillas } from './comun.js';
import { formFicha, formNuevaVersion, selectorArchivos, reporteGuardado } from './formularios.js';
import { seleccion } from './seleccion.js';

export function vistaRecurso(cat, contenedor, id) {
  const r = cat.recurso(id);
  if (!r) { poner(contenedor, vacio('Recurso no encontrado.', h('a', { class: 'btn', href: '#/' }, 'Volver al catálogo'))); return; }
  const temasPorId = new Map(cat.datos.temas.map(t => [t.id, t]));
  const versiones = cat.versionesDe(id);
  const usos = cat.usosDe(id);
  const misVersiones = new Set(versiones.map(v => v.id));
  const derivados = cat.datos.versiones.filter(v => v.relacion === 'derivada' && v.origenVersionIds.some(o => misVersiones.has(o)));

  const enlace = location.href.split('#')[0] + '#/r/' + r.id;
  const cab = h('div', { class: 'cab-vista' },
    h('div', {},
      h('p', { class: 'migas' }, h('a', { href: '#/' }, 'Catálogo'), ' › ', TIPOS_RECURSO[r.tipoRecurso] || 'Recurso'),
      h('h1', {}, r.titulo),
      h('div', { class: 'tarjeta-chips' }, r.grados.map(chipGrado), r.archivado ? chip('Archivado', 'chip-pendiente') : null)),
    h('div', { class: 'acciones' },
      h('button', { class: 'btn', type: 'button', onclick: () => editarFicha(cat, r) }, '✎ Editar ficha'),
      h('button', { class: 'btn', type: 'button', onclick: () => modal('Nueva versión', c => formNuevaVersion(cat, r.id, r.versionElegidaId || versiones.at(-1)?.id || null, c), { ancho: true }) }, '＋ Nueva versión'),
      h('button', { class: 'btn', type: 'button', onclick: () => { navigator.clipboard?.writeText(enlace).then(() => toast('Enlace copiado'), () => toast(enlace)); } }, '🔗 Copiar enlace'),
      h('button', { class: 'btn', type: 'button', onclick: async () => { if (await confirmar(r.archivado ? '¿Sacar este recurso del archivo?' : 'Archivar lo oculta del catálogo, pero no borra nada. ¿Archivar?')) intentar(() => cat.archivar(r.id, !r.archivado), r.archivado ? 'Recurso restaurado' : 'Recurso archivado'); } }, r.archivado ? '↩ Desarchivar' : '🗄 Archivar')));

  poner(contenedor, 
    cab,
    h('div', { class: 'detalle' },
      h('section', { class: 'col-principal' },
        h('h2', {}, `Versiones (${versiones.length})`),
        versiones.length > 1 && !r.versionElegidaId ? h('p', { class: 'aviso' }, 'Hay varias versiones y ninguna marcada como elegida. La más reciente no es necesariamente la mejor: compáralas y elige.') : null,
        ...[...versiones].reverse().map(v => tarjetaVersion(cat, r, v, usos)),
        derivados.length ? h('div', {}, h('h2', {}, 'Propuestas derivadas de este material'),
          h('ul', {}, derivados.map(v => h('li', {}, h('a', { href: '#/r/' + v.recursoId }, cat.recurso(v.recursoId)?.titulo), ' — ', v.consigna)))) : null),
      h('aside', { class: 'col-lateral' },
        bloqueFicha(cat, r, temasPorId),
        bloqueUsos(cat, r, versiones, usos),
        bloqueNotas(cat, r),
        r.fuentes?.length ? h('div', { class: 'bloque' }, h('h3', {}, 'Fuentes de origen'), h('ul', {}, r.fuentes.map(f => h('li', {}, `${f.tipo}: ${f.descripcion}`, f.herramienta ? h('small', {}, ` (${f.herramienta})`) : null)))) : null,
        h('div', { class: 'bloque tenue' }, h('small', { class: 'mono' }, `ID ${r.id}`), h('br'), h('small', {}, `Creado ${fmtFecha(r.creadoEn)} · actualizado ${fmtFecha(r.actualizadoEn)}`)))));
}

function editarFicha(cat, r) {
  modal('Editar ficha', (cerrar) => {
    const f = formFicha(cat, r);
    const form = h('form', { class: 'formulario' }, f.el,
      h('div', { class: 'fila-botones' }, h('button', { type: 'button', class: 'btn', onclick: cerrar }, 'Cancelar'), h('button', { type: 'submit', class: 'btn btn-primario' }, 'Guardar')));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nuevo = f.leer(form);
      // Solo se registran como «confirmado por César» los campos que realmente cambió.
      const cambios = {};
      for (const [k, v] of Object.entries(nuevo)) if (JSON.stringify(v) !== JSON.stringify(r[k])) cambios[k] = v;
      if (!Object.keys(cambios).length) { cerrar(); return; }
      if (await intentar(() => cat.editarFicha(r.id, cambios, 'cesar', 'Editado en la ficha'), 'Ficha guardada') !== undefined) cerrar();
    });
    return form;
  }, { ancho: true });
}

function procedencia(r, campo_) {
  const p = r.procedencia?.[campo_];
  if (!p) return null;
  const cls = p.origen === 'cesar' ? 'origen-cesar' : 'origen-otro';
  return h('span', { class: 'origen ' + cls, title: `${ORIGENES_DATO[p.origen]}${p.evidencia ? ': ' + p.evidencia : ''} (${p.fecha})` }, p.origen === 'cesar' ? '✓' : '?');
}

function bloqueFicha(cat, r, temasPorId) {
  const fila = (etq, campo_, valor) => h('div', { class: 'dato' }, h('dt', {}, etq, ' ', procedencia(r, campo_)), h('dd', {}, valor || h('span', { class: 'tenue' }, '—')));
  const sinConfirmar = Object.entries(r.procedencia || {}).filter(([, p]) => p.origen !== 'cesar');
  return h('div', { class: 'bloque' },
    h('h3', {}, 'Ficha'),
    r.descripcion ? h('p', {}, r.descripcion) : null,
    h('dl', {},
      fila('Qué es', 'tipoRecurso', TIPOS_RECURSO[r.tipoRecurso]),
      fila('Grados', 'grados', r.grados.length ? h('span', {}, r.grados.map(chipGrado)) : ''),
      fila('Usos', 'usos', r.usos.map(u => USOS[u]).join(', ')),
      fila('Asignaturas', 'asignaturas', r.asignaturas.join(', ')),
      fila('Campos formativos', 'camposFormativos', r.camposFormativos.join(', ')),
      fila('Temas', 'temaIds', r.temaIds.length ? h('span', {}, r.temaIds.map(t => h('a', { class: 'chip chip-tema', href: '#/?tema=' + t }, rutaTema(t, temasPorId) || t))) : ''),
      fila('Colecciones', 'coleccionIds', r.coleccionIds.length ? h('span', {}, r.coleccionIds.map(c => h('a', { class: 'chip', href: '#/?coleccion=' + c }, cat.coleccion(c)?.nombre || c))) : ''),
      fila('Modalidad', 'modalidades', r.modalidades.map(m => MODALIDADES[m]).join(', ')),
      fila('Gradualidad', 'gradualidad', r.gradualidad),
      r.etiquetas?.length ? fila('Etiquetas', 'etiquetas', r.etiquetas.join(', ')) : null),
    sinConfirmar.length ? h('div', { class: 'aviso-mini' },
      `${sinConfirmar.length} dato(s) propuestos o inferidos (marcados con ?), no confirmados por ti.`,
      h('button', { class: 'btn btn-sm', type: 'button', onclick: () => {
        const cambios = Object.fromEntries(sinConfirmar.map(([k]) => [k, r[k]]));
        intentar(() => cat.editarFicha(r.id, cambios, 'cesar', 'Confirmado por César'), 'Datos confirmados');
      } }, 'Confirmar todos')) : null);
}

function tarjetaVersion(cat, r, v, usos) {
  const archivos = cat.archivosDe(v.id);
  const usada = usos.filter(u => u.versionId === v.id);
  const previas = h('div', { class: 'archivos-version' });
  for (const a of archivos) previas.appendChild(filaArchivo(cat, a));
  if (!archivos.length) previas.appendChild(h('p', { class: 'tenue' }, 'Sin archivos en esta versión.'));
  const origenes = v.origenVersionIds.map(o => cat.version(o)).filter(Boolean);
  const cambiarEstado = select('estado', Object.fromEntries(Object.entries(ESTADOS_VERSION).filter(([k]) => k !== 'recomendada_ia' && k !== 'elegida_cesar')), '', { vacio: 'Cambiar estado…' });
  cambiarEstado.setAttribute('aria-label', 'Cambiar estado de la versión');
  cambiarEstado.addEventListener('change', () => { if (cambiarEstado.value) intentar(() => cat.cambiarEstado(v.id, cambiarEstado.value), 'Estado actualizado'); });
  const selInput = h('input', { type: 'checkbox', checked: seleccion.tiene(v.id) });
  selInput.addEventListener('change', () => seleccion.alternar(v.id, r.id));
  const evid = (v.evidenciasEstado || []).at(-1);
  return h('article', { class: 'version' + (v.id === r.versionElegidaId ? ' version-elegida' : '') + (v.estado === 'sustituida' ? ' version-sustituida' : '') },
    h('div', { class: 'version-cab' },
      h('strong', { class: 'mono' }, `v${v.numero}`),
      v.etiqueta ? h('span', {}, v.etiqueta) : null,
      chipEstado(v.estado),
      chip(RELACIONES[v.relacion] || v.relacion, 'chip-relacion'),
      v.creadaPor === 'ia' ? chip('Creada por herramienta externa', 'chip-pendiente') : null,
      usada.length ? chip(`📅 Usada en clase ${usada.length}×`, 'chip-uso') : null,
      h('small', { class: 'tenue' }, fmtFecha(v.creadoEn))),
    evid ? h('p', { class: 'evidencia' }, h('small', {}, 'Evidencia del estado: ', evid.texto, ` (${evid.fecha})`)) : null,
    origenes.length ? h('p', {}, 'Basada en: ', origenes.map(o => h('a', { class: 'chip', href: '#/r/' + o.recursoId }, `${cat.recurso(o.recursoId)?.titulo} v${o.numero}`))) : null,
    v.consigna ? h('p', {}, h('strong', {}, 'Consigna: '), v.consigna) : null,
    v.cambios ? h('p', {}, h('strong', {}, 'Qué cambió: '), v.cambios) : null,
    v.notas ? h('p', {}, v.notas) : null,
    previas,
    h('div', { class: 'version-acciones' },
      v.id !== r.versionElegidaId ? h('button', { class: 'btn btn-sm btn-primario', type: 'button', onclick: () => intentar(() => cat.elegir(v.id), 'Versión elegida. La anterior queda como sustituida, sin borrarse.') }, '★ Elegir esta') : null,
      h('button', { class: 'btn btn-sm', type: 'button', onclick: () => agregarArchivos(cat, v) }, '＋ Archivos'),
      h('button', { class: 'btn btn-sm', type: 'button', onclick: () => editarVersion(cat, v) }, '✎ Notas'),
      h('button', { class: 'btn btn-sm', type: 'button', onclick: () => modal('Nueva versión basada en v' + v.numero, c => formNuevaVersion(cat, r.id, v.id, c), { ancho: true }) }, 'Corregir / adaptar'),
      cambiarEstado,
      h('label', { class: 'casilla casilla-sel' }, selInput, h('span', {}, 'Combinar'))));
}

function filaArchivo(cat, a) {
  const caja = h('div', { class: 'previa-caja' });
  const c = categoriaFormato(a);
  const puedeVer = ['imagen', 'pdf', 'html', 'video', 'audio', 'texto'].includes(c) && a.ruta;
  const ver = async (grande) => { caja.replaceChildren(h('small', {}, 'Cargando…')); caja.replaceChildren(await vistaPrevia(cat, a, { grande })); };
  if (c === 'imagen') ver(false);
  return h('div', { class: 'archivo' },
    h('div', { class: 'archivo-info' },
      h('span', { 'aria-hidden': 'true' }, ICONOS[c] || '📄'),
      h('span', { class: 'nombre-archivo' }, a.nombre),
      h('small', { class: 'mono' }, [a.formato, ROLES_ARCHIVO[a.rol], a.tamano != null ? fmtBytes(a.tamano) : null].filter(Boolean).join(' · ')),
      a.fechaArchivo ? h('small', { class: 'tenue', title: 'Fecha del archivo (no es la fecha de aplicación)' }, 'archivo: ' + fmtFecha(a.fechaArchivo)) : null),
    h('div', { class: 'archivo-acciones' },
      puedeVer ? h('button', { class: 'btn btn-sm', type: 'button', onclick: () => ver(true) }, c === 'html' ? '▶ Vista previa aislada' : '👁 Ver') : null,
      h('button', { class: 'btn btn-sm', type: 'button', onclick: async () => { if (!(await intentar(() => abrir(cat, a)))) toast('Este formato se descarga para abrirlo con su programa.'); } }, a.url && !a.ruta ? '↗ Abrir enlace' : '↗ Abrir'),
      a.ruta ? h('button', { class: 'btn btn-sm', type: 'button', onclick: () => intentar(() => descargar(cat, a)) }, '⬇ Descargar') : null,
      a.ruta && ['imagen', 'pdf'].includes(c) ? h('button', { class: 'btn btn-sm', type: 'button', onclick: () => imprimir(cat, a) }, '🖨 Imprimir') : null),
    caja);
}

async function imprimir(cat, a) {
  const url = await cat.urlArchivo(a);
  const marco = h('iframe', { class: 'oculto-impresion', src: url, title: 'Impresión' });
  document.body.appendChild(marco);
  marco.addEventListener('load', () => { try { marco.contentWindow.print(); } catch { window.open(url, '_blank', 'noopener'); } setTimeout(() => marco.remove(), 60000); });
}

function agregarArchivos(cat, v) {
  modal(`Agregar archivos a v${v.numero}`, (cerrar) => {
    const sel = selectorArchivos();
    const form = h('form', { class: 'formulario' }, h('p', {}, 'Mismo material en otro formato (editable, PDF, miniatura…). Si el contenido cambió, mejor crea una versión nueva.'), sel.el,
      h('div', { class: 'fila-botones' }, h('button', { type: 'button', class: 'btn', onclick: cerrar }, 'Cancelar'), h('button', { type: 'submit', class: 'btn btn-primario' }, 'Agregar')));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rep = await intentar(() => cat.agregarArchivos(v.id, sel.leer()));
      if (rep) { toast(reporteGuardado(rep), rep.fallos.length ? 'error' : 'ok'); cerrar(); }
    });
    return form;
  });
}

function editarVersion(cat, v) {
  modal(`Notas de v${v.numero}`, (cerrar) => {
    const form = h('form', { class: 'formulario' },
      campo('Etiqueta', h('input', { name: 'etiqueta', value: v.etiqueta })),
      campo('Consigna', h('textarea', { name: 'consigna', rows: 3 }, v.consigna)),
      campo('Qué cambió', h('textarea', { name: 'cambios', rows: 2 }, v.cambios)),
      campo('Notas', h('textarea', { name: 'notas', rows: 3 }, v.notas)),
      h('div', { class: 'fila-botones' }, h('button', { type: 'button', class: 'btn', onclick: cerrar }, 'Cancelar'), h('button', { type: 'submit', class: 'btn btn-primario' }, 'Guardar')));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await intentar(() => cat.editarVersion(v.id, { etiqueta: form.etiqueta.value, consigna: form.consigna.value, cambios: form.cambios.value, notas: form.notas.value }), 'Guardado');
      cerrar();
    });
    return form;
  });
}

function bloqueUsos(cat, r, versiones, usos) {
  const lista = [...usos].sort((a, b) => (b.fechaAplicada || b.fechaPrevista || '').localeCompare(a.fechaAplicada || a.fechaPrevista || ''));
  return h('div', { class: 'bloque' },
    h('h3', {}, 'Usos en clase'),
    lista.length ? h('ul', { class: 'lista-usos' }, lista.map(u => h('li', {},
      h('strong', {}, u.fechaAplicada ? fmtFecha(u.fechaAplicada) : (u.fechaPrevista ? 'previsto ' + fmtFecha(u.fechaPrevista) : 'sin fecha')),
      ' ', [u.escuela, u.ciclo, u.grados.map(g => g + '°').join(' '), u.versionId ? 'v' + (cat.version(u.versionId)?.numero ?? '?') : null, MODALIDADES[u.modalidad]].filter(Boolean).join(' · '),
      u.notasClase ? h('p', { class: 'tenue' }, u.notasClase) : null))) : h('p', { class: 'tenue' }, 'Sin usos registrados.'),
    h('button', { class: 'btn btn-sm', type: 'button', onclick: () => registrarUso(cat, r, versiones) }, '＋ Registrar uso'));
}

function registrarUso(cat, r, versiones) {
  modal('Registrar uso en clase', (cerrar) => {
    const ultimo = cat.datos.contextos.at(-1);
    const form = h('form', { class: 'formulario' },
      campo('Versión usada', select('versionId', Object.fromEntries([...versiones].reverse().map(v => [v.id, `v${v.numero} — ${ESTADOS_VERSION[v.estado]}`])), r.versionElegidaId || versiones.at(-1)?.id || '', { vacio: 'No sé' })),
      campo('Escuela', h('input', { name: 'escuela', value: ultimo?.escuela || '' })),
      campo('Grados', casillas('grados', Object.fromEntries(GRADOS.map(g => [g, g + '°'])), r.grados)),
      h('div', { class: 'fila' },
        campo('Fecha prevista', h('input', { type: 'date', name: 'fechaPrevista' })),
        campo('Fecha aplicada', h('input', { type: 'date', name: 'fechaAplicada' }))),
      campo('Ciclo', h('input', { name: 'ciclo', placeholder: 'Se calcula de la fecha si lo dejas vacío' })),
      campo('Periodo', h('input', { name: 'periodo', placeholder: 'p. ej. P1, trimestre 2' })),
      campo('Modalidad', select('modalidad', MODALIDADES, '', { vacio: '—' })),
      campo('Cómo funcionó / mejoras pendientes', h('textarea', { name: 'notasClase', rows: 3 })),
      h('div', { class: 'fila-botones' }, h('button', { type: 'button', class: 'btn', onclick: cerrar }, 'Cancelar'), h('button', { type: 'submit', class: 'btn btn-primario' }, 'Guardar uso')));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fecha = form.fechaAplicada.value || form.fechaPrevista.value;
      const ok = await intentar(() => cat.registrarUso({
        recursoId: r.id, versionId: form.versionId.value || null, escuela: form.escuela.value, grados: leerCasillas(form, 'grados'),
        fechaPrevista: form.fechaPrevista.value, fechaAplicada: form.fechaAplicada.value, ciclo: form.ciclo.value || cicloDeFecha(fecha),
        periodo: form.periodo.value, modalidad: form.modalidad.value, notasClase: form.notasClase.value,
      }), 'Uso registrado');
      if (ok) cerrar();
    });
    return form;
  });
}

function bloqueNotas(cat, r) {
  const notas = cat.notasDe('recurso', r.id);
  const texto = h('textarea', { rows: 2, placeholder: 'Decisión de diseño, por qué se eligió una versión, mejora pendiente…', 'aria-label': 'Nueva nota' });
  const tipo = select('tipo', { nota: 'Nota', decision: 'Decisión', mejora: 'Mejora pendiente', aplicacion: 'Aplicación en clase' }, 'nota', { vacio: null });
  tipo.setAttribute('aria-label', 'Tipo de nota');
  return h('div', { class: 'bloque' },
    h('h3', {}, 'Notas y decisiones'),
    notas.length ? h('ul', { class: 'lista-notas' }, notas.map(n => h('li', {}, h('small', { class: 'tenue' }, `${fmtFecha(n.fecha)} · ${n.tipo}${n.autor === 'ia' ? ' · IA' : ''}`), h('p', {}, n.texto)))) : null,
    texto, h('div', { class: 'fila' }, tipo, h('button', { class: 'btn btn-sm', type: 'button', onclick: () => intentar(() => cat.agregarNota({ sobreTipo: 'recurso', sobreId: r.id, texto: texto.value, tipo: tipo.value }), 'Nota guardada') }, 'Agregar nota')));
}
