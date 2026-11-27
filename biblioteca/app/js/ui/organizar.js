// Temas, colecciones/proyectos, vista temporal y criterios de diseño.
import { h, poner, fmtFecha } from '../util.js';
import { NIVELES_TEMA, TIPOS_COLECCION, TIPOS_RECURSO, rutaTema } from '../modelo.js';
import { agruparPorTiempo, facetas } from '../busqueda.js';
import { MAPA_MAESTRO, GP_CAMPO, CAMPO_NOMBRE } from '../datos/temas-gis.js';
import { modal, campo, select, intentar, toast, vacio, chip, chipGrado, confirmar } from './comun.js';

// ---------- Temas ----------
export function vistaTemas(cat, contenedor) {
  const temas = cat.datos.temas;
  const hijos = new Map();
  for (const t of temas) { const k = t.padreId || ''; if (!hijos.has(k)) hijos.set(k, []); hijos.get(k).push(t); }
  for (const l of hijos.values()) l.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const usos = new Map();
  for (const r of cat.datos.recursos) for (const id of r.temaIds) usos.set(id, (usos.get(id) || 0) + 1);

  const rama = (padre) => {
    const l = hijos.get(padre) || [];
    if (!l.length) return null;
    return h('ul', { class: 'arbol' }, l.map(t => h('li', {},
      h('details', { open: !t.padreId },
        h('summary', {},
          h('span', { class: 'arbol-nombre' }, t.nombre), ' ',
          h('small', { class: 'tenue' }, NIVELES_TEMA[t.nivel]),
          usos.get(t.id) ? h('a', { class: 'chip', href: '#/?tema=' + t.id }, `${usos.get(t.id)} recurso(s)`) : null,
          t.vinculoGis ? h('small', { class: 'chip chip-gis', title: 'Vinculado al catálogo de Gestión Pedagógica en GIS' }, 'GIS') : null,
          h('button', { class: 'btn-icono', type: 'button', 'aria-label': 'Editar ' + t.nombre, onclick: (e) => { e.preventDefault(); editarTema(cat, t); } }, '✎'),
          h('button', { class: 'btn-icono', type: 'button', 'aria-label': 'Agregar subtema a ' + t.nombre, onclick: (e) => { e.preventDefault(); editarTema(cat, { padreId: t.id, nivel: siguienteNivel(t.nivel) }); } }, '＋')),
        rama(t.id)))));
  };

  poner(contenedor, 
    h('div', { class: 'cab-vista' }, h('h1', {}, 'Temas'),
      h('div', { class: 'acciones' },
        h('button', { class: 'btn', type: 'button', onclick: async () => {
          if (!(await confirmar('Se crearán los 140 temas del plan sembrado en Gestión Pedagógica (GIS), agrupados por campo formativo y asignatura. No se leen datos de alumnos. Si ya existen, no se repiten. ¿Continuar?'))) return;
          const rep = await intentar(() => cat.importarTemasGIS(MAPA_MAESTRO, GP_CAMPO, CAMPO_NOMBRE));
          if (rep) toast(`${rep.creados} tema(s) nuevos`);
        } }, '⇣ Traer temas de GIS'),
        h('button', { class: 'btn btn-primario', type: 'button', onclick: () => editarTema(cat, { nivel: 'tema' }) }, '＋ Nuevo tema'))),
    h('p', { class: 'tenue' }, 'Campo formativo › asignatura › bloque › tema › subtema. Un recurso puede estar en varios temas a la vez; los temas no imponen fechas.'),
    temas.length ? rama('') : vacio('Aún no hay temas. Puedes crearlos o traer el catálogo sembrado de GIS.'));
}

function siguienteNivel(n) {
  const orden = Object.keys(NIVELES_TEMA);
  return orden[Math.min(orden.indexOf(n) + 1, orden.length - 1)];
}

function editarTema(cat, t) {
  modal(t.id ? 'Editar tema' : 'Nuevo tema', (cerrar) => {
    const temasPorId = new Map(cat.datos.temas.map(x => [x.id, x]));
    const opcionesPadre = Object.fromEntries(cat.datos.temas.filter(x => x.id !== t.id).map(x => [x.id, rutaTema(x.id, temasPorId)]).sort((a, b) => a[1].localeCompare(b[1], 'es')));
    const form = h('form', { class: 'formulario' },
      campo('Nombre', h('input', { name: 'nombre', value: t.nombre || '', required: true })),
      campo('Nivel', select('nivel', NIVELES_TEMA, t.nivel || 'tema', { vacio: null })),
      campo('Dentro de', select('padreId', opcionesPadre, t.padreId || '', { vacio: '— (raíz) —' })),
      campo('Notas', h('textarea', { name: 'notas', rows: 2 }, t.notas || '')),
      h('div', { class: 'fila-botones' }, h('button', { type: 'button', class: 'btn', onclick: cerrar }, 'Cancelar'), h('button', { type: 'submit', class: 'btn btn-primario' }, 'Guardar')));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ok = await intentar(() => cat.guardarTema({ ...(t.id ? { id: t.id } : {}), nombre: form.nombre.value.trim(), nivel: form.nivel.value, padreId: form.padreId.value || null, notas: form.notas.value }), 'Tema guardado');
      if (ok) cerrar();
    });
    return form;
  });
}

// ---------- Colecciones y proyectos ----------
export function vistaColecciones(cat, contenedor) {
  const cols = [...cat.datos.colecciones].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  poner(contenedor, 
    h('div', { class: 'cab-vista' }, h('h1', {}, 'Colecciones y proyectos'),
      h('div', { class: 'acciones' }, h('button', { class: 'btn btn-primario', type: 'button', onclick: () => editarColeccion(cat, {}) }, '＋ Nueva'))),
    h('p', { class: 'tenue' }, 'Una colección agrupa materiales con identidad propia (p. ej. los cuadernillos de investigación autónoma). Un proyecto reúne planeación, presentación, cuadernillos, imágenes y evaluación.'),
    cols.length ? h('div', { class: 'tarjetas' }, cols.map(c => {
      const recursos = cat.datos.recursos.filter(r => r.coleccionIds.includes(c.id) && !r.archivado);
      const porTipo = {};
      for (const r of recursos) porTipo[r.tipoRecurso || 'sin tipo'] = (porTipo[r.tipoRecurso || 'sin tipo'] || 0) + 1;
      const grados = [...new Set(recursos.flatMap(r => r.grados))].sort();
      return h('article', { class: 'tarjeta tarjeta-col' },
        h('div', { class: 'tarjeta-cuerpo' },
          h('div', { class: 'tarjeta-chips' }, chip(TIPOS_COLECCION[c.tipo], 'chip-tipo'), grados.map(chipGrado)),
          h('h3', {}, h('a', { href: '#/?coleccion=' + c.id }, c.nombre)),
          c.descripcion ? h('p', { class: 'tarjeta-meta' }, c.descripcion) : null,
          h('p', { class: 'tarjeta-meta' }, [c.escuela, c.ciclos?.join(', ')].filter(Boolean).join(' · ')),
          h('ul', { class: 'lista-compacta' }, Object.entries(porTipo).map(([t, n]) => h('li', {}, `${TIPOS_RECURSO[t] || t}: ${n}`))),
          h('div', { class: 'tarjeta-pie' }, h('span', { class: 'mono' }, `${recursos.length} recurso(s)`),
            h('button', { class: 'btn btn-sm', type: 'button', onclick: () => editarColeccion(cat, c) }, '✎ Editar'))));
    })) : vacio('Aún no hay colecciones ni proyectos.'));
}

function editarColeccion(cat, c) {
  modal(c.id ? 'Editar' : 'Nueva colección o proyecto', (cerrar) => {
    const form = h('form', { class: 'formulario' },
      campo('Nombre', h('input', { name: 'nombre', value: c.nombre || '', required: true })),
      campo('Tipo', select('tipo', TIPOS_COLECCION, c.tipo || 'coleccion', { vacio: null })),
      campo('Descripción', h('textarea', { name: 'descripcion', rows: 3 }, c.descripcion || '')),
      campo('Escuela', h('input', { name: 'escuela', value: c.escuela || '' })),
      campo('Ciclos', h('input', { name: 'ciclos', value: (c.ciclos || []).join(', '), placeholder: 'p. ej. 2024-2025, 2026-2027' })),
      h('div', { class: 'fila-botones' }, h('button', { type: 'button', class: 'btn', onclick: cerrar }, 'Cancelar'), h('button', { type: 'submit', class: 'btn btn-primario' }, 'Guardar')));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ok = await intentar(() => cat.guardarColeccion({ ...(c.id ? { id: c.id } : {}), nombre: form.nombre.value.trim(), tipo: form.tipo.value, descripcion: form.descripcion.value, escuela: form.escuela.value, ciclos: form.ciclos.value.split(',').map(s => s.trim()).filter(Boolean) }), 'Guardado');
      if (ok) cerrar();
    });
    return form;
  });
}

// ---------- Vista temporal ----------
export function vistaTiempo(cat, contenedor, params = {}) {
  const ciclos = facetas(cat.datos).ciclos;
  const ciclo = params.ciclo ?? (ciclos[0] || '');
  const t = agruparPorTiempo(cat.datos.contextos, { ciclo });
  const selCiclo = select('ciclo', ciclos, ciclo, { vacio: 'Todos los ciclos' });
  selCiclo.setAttribute('aria-label', 'Ciclo escolar');
  selCiclo.addEventListener('change', () => { location.hash = '#/tiempo?ciclo=' + encodeURIComponent(selCiclo.value); });
  const nombreUso = (u) => {
    const r = cat.recurso(u.recursoId);
    return h('li', { class: u.esPrevista ? 'uso-previsto' : '' },
      h('span', { class: 'mono' }, fmtFecha(u.fechaUsada)), ' ',
      h('a', { href: '#/r/' + u.recursoId }, r?.titulo || '¿recurso?'),
      u.versionId ? h('small', { class: 'tenue' }, ` v${cat.version(u.versionId)?.numero ?? '?'}`) : null,
      u.esPrevista ? chip('previsto', 'chip-pendiente') : null,
      u.grados?.map(chipGrado),
      u.escuela ? h('small', { class: 'tenue' }, ' · ' + u.escuela) : null);
  };
  const sinUso = cat.datos.recursos.filter(r => !r.archivado && !cat.usosDe(r.id).length).length;
  poner(contenedor, 
    h('div', { class: 'cab-vista' }, h('h1', {}, 'Vista temporal'), h('div', { class: 'acciones' }, selCiclo)),
    h('p', { class: 'tenue' }, 'Se ordena por la fecha en que se aplicó en clase; si no existe, por la prevista (marcada «previsto»). La fecha del archivo no cuenta como fecha de aplicación.'),
    t.ciclos.length ? h('div', {}, t.ciclos.map(c => h('section', { class: 'bloque' },
      h('h2', {}, 'Ciclo ' + c.ciclo),
      c.meses.map(m => h('details', { open: true, class: 'mes' },
        h('summary', {}, h('strong', {}, m.nombre), h('small', { class: 'tenue' }, ` · ${m.semanas.reduce((s, w) => s + w.usos.length, 0)} uso(s)`)),
        m.semanas.map(w => h('div', { class: 'semana' }, h('h4', {}, 'Semana del ' + fmtFecha(w.lunes)), h('ul', {}, w.usos.map(nombreUso))))))))) : vacio('Aún no hay usos con fecha. En la ficha de cada recurso: «Registrar uso».'),
    t.sinFecha.length ? h('section', { class: 'bloque' }, h('h2', {}, `Usos sin fecha (${t.sinFecha.length})`), h('ul', {}, t.sinFecha.map(u => nombreUso({ ...u, fechaUsada: '' })))) : null,
    h('p', { class: 'tenue' }, `${sinUso} recurso(s) sin ningún uso registrado.`));
}

// ---------- Criterios ----------
export function vistaCriterios(cat, contenedor) {
  const vigentes = cat.datos.criterios.filter(c => c.vigente !== false).sort((a, b) => a.codigo.localeCompare(b.codigo));
  const historial = (c) => {
    const cadena = [];
    let p = c.anteriorId ? cat.datos.criterios.find(x => x.id === c.anteriorId) : null;
    while (p) { cadena.push(p); p = p.anteriorId ? cat.datos.criterios.find(x => x.id === p.anteriorId) : null; }
    return cadena;
  };
  poner(contenedor, 
    h('div', { class: 'cab-vista' }, h('h1', {}, 'Criterios de diseño'),
      h('div', { class: 'acciones' }, h('button', { class: 'btn btn-primario', type: 'button', onclick: () => editarCriterio(cat, {}) }, '＋ Nuevo criterio'))),
    h('p', { class: 'tenue' }, 'Reglas consultables y versionadas. Son generales; una colección puede tener las suyas. Editar crea una versión nueva y conserva la anterior.'),
    h('div', { class: 'lista-criterios' }, vigentes.map(c => {
      const prev = historial(c);
      return h('article', { class: 'criterio' },
        h('div', { class: 'criterio-cab' }, h('strong', { class: 'mono' }, c.codigo), chip(c.ambito), c.coleccionId ? chip(cat.coleccion(c.coleccionId)?.nombre || 'colección') : null, h('small', { class: 'tenue' }, `v${c.version} · ${fmtFecha(c.fecha)}`),
          h('button', { class: 'btn-icono', type: 'button', 'aria-label': 'Editar ' + c.codigo, onclick: () => editarCriterio(cat, c) }, '✎')),
        h('p', {}, c.texto),
        prev.length ? h('details', {}, h('summary', {}, `Versiones anteriores (${prev.length})`), h('ul', {}, prev.map(p => h('li', {}, h('small', {}, `v${p.version} (${fmtFecha(p.fecha)}): `), p.texto)))) : null);
    })));
}

function editarCriterio(cat, c) {
  modal(c.id ? 'Editar criterio ' + c.codigo : 'Nuevo criterio', (cerrar) => {
    const cols = Object.fromEntries(cat.datos.colecciones.map(x => [x.id, x.nombre]));
    const form = h('form', { class: 'formulario' },
      campo('Criterio', h('textarea', { name: 'texto', rows: 3, required: true }, c.texto || '')),
      campo('Ámbito', h('input', { name: 'ambito', value: c.ambito || 'General', placeholder: 'General, Cuadernillos, Presentaciones…' })),
      campo('Solo para la colección', select('coleccionId', cols, c.coleccionId || '', { vacio: '— todas —' })),
      h('div', { class: 'fila-botones' }, h('button', { type: 'button', class: 'btn', onclick: cerrar }, 'Cancelar'), h('button', { type: 'submit', class: 'btn btn-primario' }, 'Guardar')));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ok = await intentar(() => cat.guardarCriterio({ id: c.id, codigo: c.codigo, texto: form.texto.value, ambito: form.ambito.value.trim() || 'General', coleccionId: form.coleccionId.value || null }), 'Criterio guardado');
      if (ok) cerrar();
    });
    return form;
  });
}
