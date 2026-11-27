// Prueba de extremo a extremo en Chromium con el almacén local (IndexedDB).
// Uso: node tests/e2e.mjs [--capturas carpeta]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // Playwright preinstalado (global)
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { leerZip } from '../app/js/zip.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', 'app');
const capturas = process.argv.includes('--capturas') ? process.argv[process.argv.indexOf('--capturas') + 1] : null;
if (capturas) mkdirSync(capturas, { recursive: true });
const puerto = 5300 + Math.floor(Math.random() * 500);
const servidor = spawn('python3', ['-m', 'http.server', String(puerto), '--bind', '127.0.0.1', '--directory', raiz], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));

const tmp = mkdtempSync(join(tmpdir(), 'bib-e2e-'));
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
writeFileSync(join(tmp, 'portada.png'), png);
writeFileSync(join(tmp, 'cuadernillo-colon.pdf'), '%PDF-1.4\n% prueba\n');
writeFileSync(join(tmp, 'actividad.html'), `<!doctype html><body><p id="r">sin ejecutar</p><script>
let msg='aislado';
try { parent.document.body.dataset.intruso='1'; msg='NO AISLADO'; } catch(e) {}
try { localStorage.setItem('x','1'); msg+=' + localStorage accesible'; } catch(e) {}
document.getElementById('r').textContent=msg;
</script></body>`);

const errores = [];
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 1280, height: 860 }, acceptDownloads: true });
const page = await ctx.newPage();
page.on('pageerror', e => errores.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load resource/.test(m.text())) errores.push('console: ' + m.text()); });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const base = `http://127.0.0.1:${puerto}/index.html?backend=local`;
const paso = (t) => console.log('✓', t);

try {
  await page.goto(base);
  await page.getByText('Tu biblioteca está vacía').waitFor();
  paso('arranca vacía en modo local');
  if (capturas) await page.screenshot({ path: join(capturas, '01-vacia.png') });

  // Agregar material
  await page.getByRole('link', { name: '＋ Agregar material' }).first().click();
  await page.locator('input[name=titulo]').fill('La llegada de los europeos a América');
  await page.getByText('Clasificación (opcional').click();
  await page.locator('select[name=tipoRecurso]').selectOption('cuadernillo_impreso');
  await page.locator('input[name=grados][value="2"]').check();
  await page.locator('input[name=usos][value=imprimir]').check();
  await page.locator('input[name=asignaturas]').fill('Historia');
  await page.locator('.zona-archivos input[type=file]').setInputFiles([join(tmp, 'cuadernillo-colon.pdf'), join(tmp, 'portada.png'), join(tmp, 'actividad.html')]);
  await page.locator('.lista-archivos li').nth(2).waitFor();
  await page.getByText('Versión y uso en clase').click();
  await page.locator('input[name=escuela]').fill('Teocalli');
  await page.locator('input[name=fechaAplicada]').fill('2026-10-14');
  if (capturas) await page.screenshot({ path: join(capturas, '02-agregar.png'), fullPage: true });
  await page.getByRole('button', { name: 'Guardar en la biblioteca' }).click();
  await page.waitForURL(/#\/r\/rec_/);
  await page.getByRole('heading', { name: 'La llegada de los europeos a América' }).waitFor();
  paso('guarda ficha con 3 archivos y abre la ficha');

  // Vista previa aislada del HTML
  await page.getByRole('button', { name: '▶ Vista previa aislada' }).click();
  const marco = page.frameLocator('iframe[sandbox]');
  await marco.locator('#r').waitFor();
  const texto = await marco.locator('#r').textContent();
  assert.equal(texto, 'aislado', 'el HTML importado no debe alcanzar la página ni su almacenamiento: ' + texto);
  assert.equal(await page.evaluate(() => document.body.dataset.intruso), undefined);
  paso('HTML importado corre aislado (sin acceso a la página ni a localStorage)');
  if (capturas) await page.screenshot({ path: join(capturas, '03-ficha.png'), fullPage: true });

  // Elegir versión y crear otra
  await page.getByRole('button', { name: '★ Elegir esta' }).click();
  await page.locator('.version-elegida').waitFor();
  await page.getByRole('button', { name: '＋ Nueva versión' }).click();
  await page.locator('.modal textarea[name=cambios]').fill('Se corrigieron fechas');
  await page.getByRole('button', { name: 'Guardar versión' }).click();
  await page.getByRole('heading', { name: 'Versiones (2)' }).waitFor();
  assert.equal(await page.locator('.version-elegida .mono').first().textContent(), 'v1', 'la elegida sigue siendo v1 aunque exista v2');
  paso('elegir versión; una versión nueva no reemplaza a la elegida');

  // Duplicado
  await page.goto(base + '#/nuevo');
  await page.locator('input[name=titulo]').fill('Copia');
  await page.locator('.zona-archivos input[type=file]').setInputFiles(join(tmp, 'cuadernillo-colon.pdf'));
  await page.getByRole('button', { name: 'Guardar en la biblioteca' }).click();
  await page.getByText('Posibles duplicados encontrados').waitFor();
  paso('avisa duplicado exacto antes de guardar');

  // Búsqueda y filtros
  await page.goto(base + '#/');
  await page.locator('input[type=search]').fill('europeos');
  await page.waitForFunction(() => document.querySelectorAll('.tarjeta').length === 1);
  await page.locator('input[type=search]').fill('colon');
  await page.waitForFunction(() => document.querySelectorAll('.tarjeta').length === 1);
  await page.locator('input[type=search]').fill('');
  await page.locator('select[name=grado]').selectOption('1');
  await page.getByText('Nada coincide').waitFor();
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  paso('búsqueda por título y por nombre de archivo; filtro por grado');

  // Temas de GIS
  await page.goto(base + '#/temas');
  await page.getByRole('button', { name: '⇣ Traer temas de GIS' }).click();
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await page.locator('.arbol-nombre', { hasText: 'Mexicas' }).waitFor({ state: 'attached' });
  assert.equal(await page.locator('.arbol-nombre').count(), 151);
  paso('trae el árbol de temas de GIS');

  // Vista temporal
  await page.goto(base + '#/tiempo');
  await page.getByText('Ciclo 2026-2027').waitFor();
  await page.getByText('Semana del 12 oct 2026').waitFor();
  paso('vista temporal por ciclo, mes y semana');

  // Persistencia
  await page.reload();
  await page.goto(base + '#/');
  await page.waitForFunction(() => document.querySelectorAll('.tarjeta').length === 1);
  paso('los datos persisten al recargar (IndexedDB)');

  // Respaldo ZIP
  await page.goto(base + '#/respaldo');
  const [descarga] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Respaldo completo/ }).click()]);
  const ruta = join(tmp, 'respaldo.zip');
  await descarga.saveAs(ruta);
  const zip = await leerZip(new Blob([readFileSync(ruta)]));
  const catalogo = JSON.parse(await zip.get('catalogo.json').text());
  assert.equal(catalogo.recursos.length, 1);
  assert.equal([...zip.keys()].filter(k => k.startsWith('archivos/')).length, 3);
  paso('respaldo ZIP con catálogo y los 3 archivos');
  if (capturas) await page.screenshot({ path: join(capturas, '04-respaldo.png'), fullPage: true });

  // Importar paquete de publicación (como lo haría Claude Code)
  const { escribirZip } = await import('../app/js/zip.js');
  const manifest = { formato: 'biblioteca-paquete/1', idPublicacion: 'e2e-1', herramienta: 'claude-code', recurso: { titulo: 'Juego del cuerpo humano', tipoRecurso: 'juego', grados: ['1'] }, version: { estado: 'elegida_cesar' }, archivos: [{ nombre: 'juego.html', rol: 'final' }] };
  const paquete = await escribirZip([{ nombre: 'manifest.json', datos: new Blob([JSON.stringify(manifest)]) }, { nombre: 'juego.html', datos: new Blob(['<p>juego</p>']) }]);
  const rutaPaq = join(tmp, 'paquete.zip');
  writeFileSync(rutaPaq, Buffer.from(await paquete.arrayBuffer()));
  await page.locator('input[type=file]').setInputFiles(rutaPaq);
  await page.getByText('Paquete publicado en tu biblioteca').waitFor();
  await page.locator('input[type=file]').setInputFiles(rutaPaq);
  await page.getByText('ya estaba publicado').waitFor();
  await page.goto(base + '#/');
  await page.waitForFunction(() => document.querySelectorAll('.tarjeta').length === 2);
  paso('publicación por paquete: devuelve enlace y el reintento no duplica');

  // Teléfono
  await page.setViewportSize({ width: 390, height: 844 });
  for (const r of ['#/', '#/nuevo', '#/tiempo', '#/respaldo', '#/temas']) {
    await page.goto(base + r);
    await page.waitForTimeout(250);
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(ancho <= 0, `sin desplazamiento horizontal en ${r} (sobra ${ancho}px)`);
  }
  if (capturas) {
    await page.goto(base + '#/');
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(capturas, '05-movil-catalogo.png'), fullPage: true });
    await page.locator('.tarjeta h3 a').first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(capturas, '06-movil-ficha.png'), fullPage: true });
  }
  paso('en teléfono (390 px) no hay desplazamiento horizontal');

  assert.deepEqual(errores, [], 'errores en la consola');
  paso('sin errores de JavaScript');
  console.log('\nE2E: todo pasó');
} catch (e) {
  console.error('\n✗ FALLÓ:', e.message);
  if (errores.length) console.error('Errores de página:\n' + errores.join('\n'));
  await page.screenshot({ path: join(tmp, 'fallo.png'), fullPage: true });
  console.error('Captura:', join(tmp, 'fallo.png'));
  process.exitCode = 1;
} finally {
  await nav.close();
  servidor.kill();
}
