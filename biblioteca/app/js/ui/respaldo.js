// Respaldo, importación y estado de la recuperación.
import { h, poner, descargarBlob, hoyISO, fmtBytes } from '../util.js';
import { crearRespaldoZip, importarArchivo } from '../respaldo.js';
import { intentar, toast } from './comun.js';

let ultimoResultado = null;

export function vistaRespaldo(cat, contenedor) {
  const d = cat.datos;
  const activos = d.recursos.filter(r => !r.archivado);
  const porClasificar = activos.filter(r => !r.tipoRecurso || !r.temaIds.length || !r.grados.length).length;
  const conVarias = activos.filter(r => cat.versionesDe(r.id).length > 1);
  const sinElegida = conVarias.filter(r => !r.versionElegidaId).length;
  const sinArchivos = activos.filter(r => !cat.archivosDelRecurso(r.id).length).length;
  const pendientesRevision = d.versiones.filter(v => v.estado === 'pendiente_revision').length;
  const inferidos = activos.filter(r => Object.values(r.procedencia || {}).some(p => p.origen !== 'cesar')).length;
  const incompletas = d.importaciones.filter(i => i.estado !== 'completa');
  const bytes = d.archivos.reduce((s, a) => s + (a.tamano || 0), 0);

  const estado = h('div', { class: 'bloque' },
    h('h2', {}, 'Estado de la biblioteca'),
    h('div', { class: 'cifras' },
      cifra(activos.length, 'recursos'), cifra(d.versiones.length, 'versiones'), cifra(d.archivos.length, 'archivos'), cifra(fmtBytes(bytes), 'almacenados'),
      cifra(d.temas.length, 'temas'), cifra(d.colecciones.length, 'colecciones'), cifra(d.contextos.length, 'usos en clase')),
    h('ul', { class: 'pendientes' },
      li(porClasificar, 'por clasificar (sin tipo, tema o grado)', '#/?sinClasificar=1'),
      li(inferidos, 'con datos propuestos o inferidos sin confirmar'),
      li(sinElegida, 'con varias versiones y ninguna elegida', '#/?estado=sin_elegida'),
      li(pendientesRevision, 'versiones pendientes de revisión', '#/?estado=pendiente_revision'),
      li(sinArchivos, 'fichas sin archivo ni enlace'),
      li(incompletas.length, 'importaciones o publicaciones incompletas')),
    incompletas.length ? h('details', {}, h('summary', {}, 'Ver importaciones incompletas'),
      h('ul', {}, incompletas.map(i => h('li', {}, h('a', { href: '#/r/' + i.reporte?.recursoId }, i.id), ' — ', (i.reporte?.fallos || []).map(f => f.nombre).join(', ') || 'faltan archivos', h('small', { class: 'tenue' }, ' · vuelve a importar el mismo paquete para completarla'))))) : null);

  const progreso = h('progress', { max: 1, value: 0, hidden: true });
  const btnZip = h('button', { class: 'btn btn-primario', type: 'button', onclick: async () => {
    btnZip.disabled = true; progreso.hidden = false;
    const r = await intentar(() => crearRespaldoZip(cat, (i, n) => { progreso.max = n || 1; progreso.value = i; }));
    btnZip.disabled = false; progreso.hidden = true;
    if (!r) return;
    descargarBlob(r.blob, `biblioteca-respaldo-${hoyISO()}.zip`);
    toast(r.faltantes.length ? `Respaldo creado, pero ${r.faltantes.length} archivo(s) no se pudieron leer (ver LEEME.txt)` : 'Respaldo completo descargado', r.faltantes.length ? 'error' : 'ok');
  } }, '⬇ Respaldo completo (ZIP con archivos)');
  const btnJson = h('button', { class: 'btn', type: 'button', onclick: () => {
    descargarBlob(new Blob([JSON.stringify(cat.exportar(), null, 2)], { type: 'application/json' }), `biblioteca-catalogo-${hoyISO()}.json`);
  } }, '⬇ Solo el catálogo (JSON, sin archivos)');

  // El resultado se guarda fuera de la vista: importar actualiza el catálogo y la vista se vuelve a dibujar.
  const resultado = h('div', { class: 'aviso', hidden: !ultimoResultado, role: 'status' }, ultimoResultado || []);
  const input = h('input', { type: 'file', accept: '.zip,.json', 'aria-label': 'Archivo a importar' });
  input.addEventListener('change', async () => {
    const f = input.files[0];
    if (!f) return;
    resultado.hidden = false;
    resultado.replaceChildren(h('p', {}, 'Importando ' + f.name + '…'));
    const r = await intentar(() => importarArchivo(cat, f));
    input.value = '';
    ultimoResultado = r ? describir(r).filter(Boolean) : [h('p', {}, 'No se importó nada.')];
    vistaRespaldo(cat, contenedor);
  });

  poner(contenedor, 
    h('div', { class: 'cab-vista' }, h('h1', {}, 'Respaldo e importación')),
    h('p', { class: 'tenue' }, `Almacén actual: ${cat.almacen.descripcion}.`),
    estado,
    h('div', { class: 'bloque' },
      h('h2', {}, 'Exportar'),
      h('p', {}, 'El ZIP se abre sin la aplicación: trae los archivos por recurso y versión, un índice para Excel y el catálogo completo.'),
      h('div', { class: 'fila-botones izq' }, btnZip, btnJson), progreso),
    h('div', { class: 'bloque' },
      h('h2', {}, 'Importar'),
      h('p', {}, 'Acepta: un respaldo (ZIP o JSON) o un paquete de publicación (ZIP con manifest.json) creado por Claude Code u otra herramienta. Importar dos veces lo mismo no duplica nada.'),
      input, resultado));
}

function cifra(n, etq) { return h('div', { class: 'cifra' }, h('strong', { class: 'mono' }, String(n)), h('small', {}, etq)); }
function li(n, texto, href) {
  return h('li', { class: n ? 'hay' : 'cero' }, h('strong', { class: 'mono' }, String(n)), ' ', href && n ? h('a', { href }, texto) : texto);
}

function describir({ tipo, reporte: r }) {
  if (tipo === 'catalogo') {
    return [h('p', {}, h('strong', {}, 'Catálogo importado. '), `${r.nuevos} registro(s) nuevos, ${r.existentes} ya existían (no se tocaron), ${r.archivosRestaurados} archivo(s) restaurados.`),
      r.archivosFaltantes.length ? h('p', {}, `Sin archivo (${r.archivosFaltantes.length}): ${r.archivosFaltantes.slice(0, 20).join(', ')}${r.archivosFaltantes.length > 20 ? '…' : ''}`) : null];
  }
  const enlace = location.href.split('#')[0] + '#/r/' + r.recursoId;
  return [
    h('p', {}, h('strong', {}, r.repetida ? 'Este paquete ya estaba publicado. No se duplicó nada.' : r.reanudada ? 'Publicación reanudada.' : 'Paquete publicado en tu biblioteca.')),
    h('p', {}, `Guardados: ${r.guardados?.join(', ') || 'ninguno'}`),
    r.fallos?.length ? h('p', {}, 'Fallaron: ' + r.fallos.map(f => `${f.nombre} (${f.error})`).join(', ')) : null,
    r.faltantes?.length ? h('p', {}, 'Faltan en el paquete: ' + r.faltantes.join(', ')) : null,
    r.temasSinEnlazar?.length ? h('p', {}, 'Temas propuestos que no existen en tu catálogo (quedaron en una nota): ' + r.temasSinEnlazar.join(', ')) : null,
    r.recursoId ? h('p', {}, 'Enlace: ', h('a', { href: '#/r/' + r.recursoId }, enlace)) : null,
  ];
}
