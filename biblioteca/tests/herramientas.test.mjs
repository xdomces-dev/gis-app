import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, statSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inventariar, dentroDeRepoPublico } from '../herramientas/inventario.mjs';
import { empaquetar, argumentos } from '../herramientas/empaquetar.mjs';
import { leerZip } from '../app/js/zip.js';
import { crearAlmacenMemoria } from '../app/js/store/memoria.js';
import { crearCatalogo } from '../app/js/catalogo.js';
import { importarArchivo } from '../app/js/respaldo.js';

function carpetaDePrueba() {
  const raiz = mkdtempSync(join(tmpdir(), 'inv-'));
  mkdirSync(join(raiz, 'Historia', 'Colon'), { recursive: true });
  writeFileSync(join(raiz, 'Historia', 'Colon', 'cuadernillo.pdf'), 'A');
  writeFileSync(join(raiz, 'Historia', 'copia de cuadernillo.pdf'), 'A');
  writeFileSync(join(raiz, '~$planeacion.docx'), 'x');
  writeFileSync(join(raiz, 'vacio.txt'), '');
  return raiz;
}

test('inventario: solo lectura, duplicados, dudosos y pistas inferidas', async () => {
  const raiz = carpetaDePrueba();
  const antes = statSync(join(raiz, 'Historia', 'Colon', 'cuadernillo.pdf')).mtimeMs;
  const salida = mkdtempSync(join(tmpdir(), 'inv-salida-'));
  const r = await inventariar({ raices: [raiz], salida, equipo: 'prueba' }, () => {});
  assert.equal(r.totales.archivos, 4);
  assert.equal(r.totales.gruposDuplicados, 1);
  assert.equal(r.archivos.find(a => a.nombre === '~$planeacion.docx').dudoso, 'archivo temporal de Office');
  assert.equal(r.archivos.find(a => a.nombre === 'vacio.txt').dudoso, 'archivo vacío');
  assert.deepEqual(r.archivos.find(a => a.nombre === 'cuadernillo.pdf').pistas, { carpetas: ['Historia', 'Colon'], origen: 'inferido', evidencia: 'nombre de carpeta' });
  assert.equal(statSync(join(raiz, 'Historia', 'Colon', 'cuadernillo.pdf')).mtimeMs, antes, 'no modifica originales');
  assert.deepEqual(readdirSync(salida).sort(), ['inventario.csv', 'inventario.json', 'resumen.md']);
  assert.match(readFileSync(join(salida, 'resumen.md'), 'utf8'), /Duplicados exactos/);
  const r2 = await inventariar({ raices: [raiz], salida, equipo: 'prueba' }, () => {});
  assert.equal(r2.totales.huellasReutilizadas, 4, 'al reanudar reutiliza huellas');
  assert.equal(r2.archivos[0].id, r.archivos.find(a => a.rutaAbsoluta === r2.archivos[0].rutaAbsoluta).id, 'ID estable por ruta');
});

test('inventario: se niega a escribir dentro de la carpeta revisada o del repo público', async () => {
  const raiz = carpetaDePrueba();
  await assert.rejects(inventariar({ raices: [raiz], salida: join(raiz, 'salida') }, () => {}), /dentro de una carpeta/);
  assert.equal(dentroDeRepoPublico(new URL('../', import.meta.url).pathname), true, 'este repo es gis-app');
  await assert.rejects(inventariar({ raices: [raiz], salida: new URL('../salida-prueba', import.meta.url).pathname }, () => {}), /repositorio público/);
});

test('empaquetar → importar: publica, enlaza y el reintento no duplica', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'paq-'));
  writeFileSync(join(dir, 'juego.html'), '<p>juego</p>');
  writeFileSync(join(dir, 'portada.png'), 'png');
  const a = argumentos(['--titulo', 'Juego del cuerpo', '--tipo', 'juego', '--grados', '1,2', '--usos', 'proyectar', '--consigna', 'Hazlo juego', '--salida', dir, join(dir, 'juego.html'), join(dir, 'portada.png') + ':miniatura']);
  const { ruta, manifest } = await empaquetar(a);
  const { ruta: ruta2, manifest: m2 } = await empaquetar(a);
  assert.equal(m2.idPublicacion, manifest.idPublicacion, 'mismo contenido = mismo id');
  assert.equal(ruta2, ruta);
  const zip = await leerZip(new Blob([readFileSync(ruta)]));
  assert.ok(zip.has('manifest.json') && zip.has('juego.html') && zip.has('portada.png'));
  const cat = crearCatalogo(crearAlmacenMemoria()); await cat.cargar();
  const archivo = Object.assign(new Blob([readFileSync(ruta)]), { name: 'p.zip' });
  const { reporte } = await importarArchivo(cat, archivo);
  assert.deepEqual(reporte.guardados.sort(), ['juego.html', 'portada.png']);
  assert.equal(cat.archivosDelRecurso(reporte.recursoId).find(x => x.nombre === 'portada.png').rol, 'miniatura');
  assert.deepEqual(cat.recurso(reporte.recursoId).grados, ['1', '2']);
  assert.equal(cat.recurso(reporte.recursoId).procedencia.grados.origen, 'ia', 'lo que propone la herramienta queda como no confirmado');
  const { reporte: otra } = await importarArchivo(cat, archivo);
  assert.equal(otra.repetida, true);
  await assert.rejects(empaquetar(argumentos(['--titulo', 'x', '--tipo', 'inventado', join(dir, 'juego.html')])), /Tipo desconocido/);
});
