import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escribirZip, leerZip, crc32 } from '../app/js/zip.js';
import { crearAlmacenMemoria } from '../app/js/store/memoria.js';
import { crearCatalogo } from '../app/js/catalogo.js';
import { crearRespaldoZip, importarArchivo } from '../app/js/respaldo.js';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const comoArchivo = (blob, name) => Object.assign(blob, { name });

test('crc32 conocido', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});

test('ZIP propio: ida y vuelta con nombres en UTF-8', async () => {
  const z = await escribirZip([{ nombre: 'año/señal.txt', datos: new Blob(['ñandú']) }, { nombre: 'b.bin', datos: new Uint8Array([0, 1, 2]) }]);
  const m = await leerZip(z);
  assert.equal(await m.get('año/señal.txt').text(), 'ñandú');
  assert.equal(m.get('b.bin').size, 3);
});

test('lee un ZIP comprimido con deflate (creado por Python)', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'zip-'));
  const ruta = join(dir, 'p.zip');
  execFileSync('python3', ['-I', '-c', `import zipfile,sys\nz=zipfile.ZipFile(sys.argv[1],'w',zipfile.ZIP_DEFLATED)\nz.writestr('manifest.json','{"a":1}')\nz.writestr('carpeta/x.txt','hola '*200)\nz.close()`, ruta]);
  const m = await leerZip(new Blob([readFileSync(ruta)]));
  assert.equal(await m.get('manifest.json').text(), '{"a":1}');
  assert.equal((await m.get('carpeta/x.txt').text()).length, 1000);
});

test('ZIP propio se abre con una herramienta externa (Python zipfile)', async () => {
  const z = await escribirZip([{ nombre: 'LEEME.txt', datos: new Blob(['hola']) }]);
  const dir = mkdtempSync(join(tmpdir(), 'zip-'));
  const ruta = join(dir, 'r.zip');
  writeFileSync(ruta, Buffer.from(await z.arrayBuffer()));
  const out = execFileSync('python3', ['-I', '-c', 'import zipfile,sys;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;print(z.read("LEEME.txt").decode())', ruta]).toString().trim();
  assert.equal(out, 'hola');
});

test('respaldo ZIP completo se restaura en otra biblioteca vacía', async () => {
  const a = crearCatalogo(crearAlmacenMemoria()); await a.cargar();
  await a.registrarRecurso({ ficha: { titulo: 'Cuadernillo: Mexicas' }, archivos: [{ blob: new Blob(['contenido A']), nombre: 'mexicas.pdf', rol: 'final' }] });
  const { blob, faltantes } = await crearRespaldoZip(a);
  assert.equal(faltantes.length, 0);
  const contenido = await leerZip(blob);
  assert.ok(contenido.has('indice.csv') && contenido.has('LEEME.txt'));
  assert.ok([...contenido.keys()].some(k => k.startsWith('archivos/Cuadernillo_ Mexicas/v1/')), 'ruta legible');
  const b = crearCatalogo(crearAlmacenMemoria()); await b.cargar();
  const { tipo, reporte } = await importarArchivo(b, comoArchivo(blob, 'respaldo.zip'));
  assert.equal(tipo, 'catalogo');
  assert.equal(reporte.archivosRestaurados, 1);
  assert.equal(await (await b.blobArchivo(b.datos.archivos[0])).text(), 'contenido A');
});
