import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearAlmacenMemoria } from '../app/js/store/memoria.js';
import { crearCatalogo } from '../app/js/catalogo.js';
import { crearIndice, filtrar, agruparPorTiempo } from '../app/js/busqueda.js';
import { crearRecurso, crearVersion, estadoPermitido, cicloDeFecha, categoriaFormato, crearArchivo } from '../app/js/modelo.js';
import { MAPA_MAESTRO, GP_CAMPO, CAMPO_NOMBRE } from '../app/js/datos/temas-gis.js';

const archivo = (nombre, texto, mime = 'text/plain') => ({ blob: new Blob([texto], { type: mime }), nombre, mime, rol: 'final' });

async function nuevo() {
  const cat = crearCatalogo(crearAlmacenMemoria());
  await cat.cargar();
  return cat;
}

test('ficha mínima: basta el título; sin título falla', () => {
  assert.equal(crearRecurso({ titulo: 'Cuadernillo' }).titulo, 'Cuadernillo');
  assert.throws(() => crearRecurso({ titulo: '  ' }));
});

test('procedencia: lo clasificado queda marcado con su origen', () => {
  const r = crearRecurso({ titulo: 'x', grados: ['1', '9'], tipoRecurso: 'rubrica' }, 'ia', 'por el nombre');
  assert.deepEqual(r.grados, ['1']);
  assert.equal(r.procedencia.grados.origen, 'ia');
  assert.equal(r.procedencia.tipoRecurso.evidencia, 'por el nombre');
});

test('una herramienta externa no puede marcar «elegida por César»', () => {
  assert.equal(estadoPermitido('elegida_cesar', 'ia'), 'pendiente_revision');
  assert.equal(estadoPermitido('elegida_cesar', 'cesar'), 'elegida_cesar');
  assert.equal(crearVersion({ recursoId: 'r', estado: 'elegida_cesar' }, 'ia').estado, 'pendiente_revision');
});

test('derivada sin origen falla', () => {
  assert.throws(() => crearVersion({ recursoId: 'r', relacion: 'derivada' }));
});

test('ciclo escolar desde una fecha', () => {
  assert.equal(cicloDeFecha('2026-09-01'), '2026-2027');
  assert.equal(cicloDeFecha('2027-03-15'), '2026-2027');
});

test('formato: enlace, pdf, html', () => {
  assert.equal(categoriaFormato({ nombre: 'a.PDF' }), 'pdf');
  assert.equal(categoriaFormato({ nombre: 'juego.html' }), 'html');
  assert.equal(categoriaFormato({ url: 'https://youtu.be/x', nombre: 'video' }), 'enlace');
  assert.throws(() => crearArchivo({ versionId: 'v', recursoId: 'r', url: 'javascript:alert(1)' }));
});

test('registrar, encontrar y recuperar un material', async () => {
  const cat = await nuevo();
  const rep = await cat.registrarRecurso({ ficha: { titulo: 'Llegada de los europeos', asignaturas: ['Historia'], grados: ['2'] }, archivos: [archivo('colon.pdf', 'pdf falso', 'application/pdf')] });
  assert.equal(rep.fallos.length, 0);
  assert.deepEqual(rep.guardados, ['colon.pdf']);
  const ix = crearIndice(cat.datos);
  assert.equal(filtrar(cat.datos.recursos, { q: 'europeos' }, ix).length, 1);
  assert.equal(filtrar(cat.datos.recursos, { q: 'colon' }, ix).length, 1, 'busca también por nombre de archivo');
  assert.equal(filtrar(cat.datos.recursos, { grado: '1' }, ix).length, 0);
  assert.equal(filtrar(cat.datos.recursos, { formato: 'pdf', asignatura: 'Historia' }, ix).length, 1);
  const a = cat.archivosDelRecurso(rep.recursoId)[0];
  assert.equal(await (await cat.blobArchivo(a)).text(), 'pdf falso');
  assert.match(a.hash, /^[0-9a-f]{64}$/);
});

test('detecta duplicado exacto por huella', async () => {
  const cat = await nuevo();
  await cat.registrarRecurso({ ficha: { titulo: 'A' }, archivos: [archivo('a.txt', 'mismo contenido')] });
  const [d] = await cat.revisarDuplicados([archivo('otro-nombre.txt', 'mismo contenido')]);
  assert.equal(d.exactos.length, 1);
});

test('reintentar con la misma clave no duplica', async () => {
  const cat = await nuevo();
  const a = await cat.registrarRecurso({ ficha: { titulo: 'X' }, archivos: [archivo('x.txt', '1')], claveIdempotencia: 'k1' });
  const b = await cat.registrarRecurso({ ficha: { titulo: 'X' }, archivos: [archivo('x.txt', '1')], claveIdempotencia: 'k1' });
  assert.equal(b.repetida, true);
  assert.equal(b.recursoId, a.recursoId);
  assert.equal(cat.datos.recursos.length, 1);
});

test('elegir una versión sustituye la anterior sin borrarla', async () => {
  const cat = await nuevo();
  const rep = await cat.registrarRecurso({ ficha: { titulo: 'Folleto' }, archivos: [archivo('v1.png', '1', 'image/png')] });
  await cat.elegir(rep.versionId);
  const v2 = await cat.nuevaVersion(rep.recursoId, { relacion: 'correccion', cambios: 'ortografía', archivos: [archivo('v2.png', '2', 'image/png')] });
  await cat.elegir(v2.versionId);
  const vs = cat.versionesDe(rep.recursoId);
  assert.equal(vs.length, 2);
  assert.equal(vs[0].estado, 'sustituida');
  assert.equal(vs[1].estado, 'elegida_cesar');
  assert.equal(cat.recurso(rep.recursoId).versionElegidaId, v2.versionId);
  assert.equal(cat.archivosDelRecurso(rep.recursoId).length, 2, 'los archivos de la versión sustituida siguen');
});

test('recomendar exige justificación y no cambia la elegida', async () => {
  const cat = await nuevo();
  const rep = await cat.registrarRecurso({ ficha: { titulo: 'F' }, version: { estado: 'elegida_cesar' } });
  const v2 = await cat.nuevaVersion(rep.recursoId, { relacion: 'correccion' });
  await assert.rejects(cat.recomendar(v2.versionId, ''));
  await cat.recomendar(v2.versionId, 'mejor legibilidad');
  assert.equal(cat.recurso(rep.recursoId).versionElegidaId, rep.versionId);
  assert.equal(cat.version(v2.versionId).estado, 'recomendada_ia');
});

test('derivar crea un recurso nuevo que conserva sus orígenes y la consigna', async () => {
  const cat = await nuevo();
  const a = await cat.registrarRecurso({ ficha: { titulo: 'Cuadernillo investigación' } });
  const b = await cat.registrarRecurso({ ficha: { titulo: 'Presentación' } });
  const d = await cat.derivar({ origenVersionIds: [a.versionId, b.versionId], ficha: { titulo: 'HTML con video' }, consigna: 'Combina ambos con video y evaluación', contexto: { ciclo: '2026-2027', escuela: 'Teocalli' } });
  const v = cat.version(d.versionId);
  assert.equal(v.relacion, 'derivada');
  assert.deepEqual(v.origenVersionIds, [a.versionId, b.versionId]);
  assert.equal(v.consigna, 'Combina ambos con video y evaluación');
  assert.equal(cat.datos.recursos.length, 3);
  assert.equal(cat.usosDe(d.recursoId)[0].escuela, 'Teocalli');
});

test('vista temporal: fecha aplicada sobre prevista; sin fecha aparte', async () => {
  const cat = await nuevo();
  const r = await cat.registrarRecurso({ ficha: { titulo: 'T' } });
  await cat.registrarUso({ recursoId: r.recursoId, fechaPrevista: '2026-10-05', fechaAplicada: '2026-10-14' });
  await cat.registrarUso({ recursoId: r.recursoId, fechaPrevista: '2026-11-03' });
  await cat.registrarUso({ recursoId: r.recursoId });
  const t = agruparPorTiempo(cat.datos.contextos);
  assert.equal(t.ciclos[0].ciclo, '2026-2027');
  assert.equal(t.ciclos[0].meses.length, 2);
  assert.equal(t.ciclos[0].meses[0].semanas[0].lunes, '2026-10-12');
  assert.equal(t.ciclos[0].meses[1].semanas[0].usos[0].esPrevista, true);
  assert.equal(t.sinFecha.length, 1);
});

test('temas de GIS: árbol idempotente y filtro por tema incluye subtemas', async () => {
  const cat = await nuevo();
  const r1 = await cat.importarTemasGIS(MAPA_MAESTRO, GP_CAMPO, CAMPO_NOMBRE);
  const r2 = await cat.importarTemasGIS(MAPA_MAESTRO, GP_CAMPO, CAMPO_NOMBRE);
  assert.equal(r1.creados, 140 + 8 + 3);
  assert.equal(r2.creados, 0);
  const historia = cat.datos.temas.find(t => t.nombre === 'Historia');
  const mexicas = cat.datos.temas.find(t => t.nombre === 'Mexicas');
  await cat.registrarRecurso({ ficha: { titulo: 'Mexicas cuadernillo', temaIds: [mexicas.id] } });
  assert.equal(filtrar(cat.datos.recursos, { temaId: historia.id }, crearIndice(cat.datos)).length, 1);
});

test('paquete de publicación: idempotente, reporta faltantes y no aprueba por César', async () => {
  const cat = await nuevo();
  const manifest = {
    formato: 'biblioteca-paquete/1', idPublicacion: 'claude-code-2026-11-27-abc', herramienta: 'claude-code',
    recurso: { titulo: 'Juego del cuerpo humano', tipoRecurso: 'juego', temas: ['Inexistente'] },
    version: { estado: 'elegida_cesar', consigna: 'Haz un juego' },
    archivos: [{ nombre: 'juego.html', rol: 'final' }, { nombre: 'falta.png', rol: 'miniatura' }],
  };
  const archivos = new Map([['juego.html', new Blob(['<p>hola</p>'], { type: 'text/html' })]]);
  const r1 = await cat.importarPaquete(manifest, archivos);
  assert.deepEqual(r1.faltantes, ['falta.png']);
  assert.equal(cat.version(r1.versionId).estado, 'pendiente_revision');
  assert.equal(cat.version(r1.versionId).creadaPor, 'ia');
  assert.deepEqual(r1.temasSinEnlazar, ['Inexistente']);
  const r2 = await cat.importarPaquete(manifest, archivos);
  assert.equal(cat.datos.recursos.length, 1, 'el reintento no duplica');
  assert.equal(r2.recursoId, r1.recursoId);
});

test('exportar e importar el catálogo con archivos en otro almacén', async () => {
  const cat = await nuevo();
  await cat.registrarRecurso({ ficha: { titulo: 'Rúbrica' }, archivos: [archivo('r.txt', 'contenido')] });
  const json = JSON.parse(JSON.stringify(cat.exportar()));
  const blobs = new Map();
  for (const a of cat.datos.archivos) blobs.set(a.ruta, await cat.blobArchivo(a));
  const otro = await nuevo();
  const rep = await otro.importarCatalogo(json, blobs);
  assert.equal(rep.archivosRestaurados, 1);
  assert.equal(otro.datos.recursos[0].titulo, 'Rúbrica');
  assert.equal(await (await otro.blobArchivo(otro.datos.archivos[0])).text(), 'contenido');
  const rep2 = await otro.importarCatalogo(json, blobs);
  assert.equal(rep2.nuevos, 0, 'importar dos veces no duplica');
});

test('criterios: editar crea versión nueva y conserva la anterior', async () => {
  const cat = await nuevo();
  assert.equal(cat.datos.criterios.length, 11);
  const c = cat.datos.criterios.find(x => x.codigo === 'C-10');
  const n = await cat.guardarCriterio({ id: c.id, texto: 'Presentaciones en 16:9; 4:3 solo si el proyector lo exige.', ambito: 'Presentaciones' });
  assert.equal(n.version, 2);
  assert.equal(cat.criterio?.(c.id) ?? cat.datos.criterios.find(x => x.id === c.id).vigente, false);
  assert.equal(cat.datos.criterios.length, 12);
});

test('paquete incompleto: el reintento con el archivo faltante completa la misma versión', async () => {
  const cat = await nuevo();
  const manifest = { formato: 'biblioteca-paquete/1', idPublicacion: 'p2', herramienta: 'claude', recurso: { titulo: 'Folleto' }, archivos: [{ nombre: 'a.pdf' }, { nombre: 'b.png', rol: 'miniatura' }] };
  const r1 = await cat.importarPaquete(manifest, new Map([['a.pdf', new Blob(['a'])]]));
  assert.deepEqual(r1.faltantes, ['b.png']);
  const r2 = await cat.importarPaquete(manifest, new Map([['a.pdf', new Blob(['a'])], ['b.png', new Blob(['b'])]]));
  assert.equal(r2.reanudada, true);
  assert.equal(r2.versionId, r1.versionId);
  assert.equal(cat.archivosDe(r1.versionId).length, 2, 'no repite a.pdf');
  assert.equal(cat.datos.importaciones[0].estado, 'completa');
  const r3 = await cat.importarPaquete(manifest, new Map());
  assert.equal(r3.repetida, true);
});

test('un paquete no puede hacerse pasar por César', async () => {
  const cat = await nuevo();
  const r = await cat.importarPaquete({ formato: 'biblioteca-paquete/1', idPublicacion: 'falso', herramienta: 'manual-cesar', recurso: { titulo: 'X', grados: ['1'] }, version: { estado: 'elegida_cesar' }, archivos: [] }, new Map());
  assert.equal(cat.version(r.versionId).estado, 'pendiente_revision');
  assert.equal(cat.recurso(r.recursoId).procedencia.grados.origen, 'ia');
});
