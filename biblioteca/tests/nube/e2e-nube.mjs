// Flujo completo en modo nube contra emuladores: entrar, subir, encontrar, recargar, descargar.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)('playwright');

const app = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'app');
const puerto = 5900 + Math.floor(Math.random() * 90);
const srv = spawn('python3', ['-m', 'http.server', String(puerto), '--bind', '127.0.0.1', '--directory', app], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));

// Cuenta de prueba con UID fijo (el que permiten las reglas de prueba) y otra cuenta ajena.
async function crearCuenta(localId, email) {
  const r = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/demo-biblioteca/accounts', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ localId, email, password: 'prueba123' }),
  });
  if (!r.ok) throw new Error('No se creó la cuenta de prueba: ' + await r.text());
}
await crearCuenta('cesar123', 'cesar@prueba.local');
await crearCuenta('otro456', 'otro@prueba.local');

const tmp = mkdtempSync(join(tmpdir(), 'nube-'));
writeFileSync(join(tmp, 'portada.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'));
writeFileSync(join(tmp, 'rubrica.txt'), 'Rúbrica de prueba');

const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const nav = await chromium.launch(proxy ? { proxy: { server: proxy, bypass: '127.0.0.1,localhost' } } : {});
const page = await nav.newPage();
const errores = [];
page.on('pageerror', e => errores.push(e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const base = `http://127.0.0.1:${puerto}/index.html?backend=firebase&emuladores=1`;
const paso = (t) => console.log('✓ nube:', t);
try {
  await page.goto(base);
  await page.locator('input[name=correo]').fill('otro@prueba.local');
  await page.locator('input[name=contrasena]').fill('prueba123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByText('Tu biblioteca está vacía').waitFor({ timeout: 30000 });
  await page.goto(base + '#/nuevo');
  await page.locator('input[name=titulo]').fill('Intento de otra cuenta');
  await page.locator('.zona-archivos input[type=file]').setInputFiles(join(tmp, 'rubrica.txt'));
  await page.getByRole('button', { name: 'Guardar en la biblioteca' }).click();
  await page.waitForURL(/#\/r\//);
  await page.getByText(/fallaron: rubrica\.txt/).waitFor();
  paso('otra cuenta: las reglas de Storage rechazan el archivo y la app informa qué falló');
  await page.getByRole('button', { name: 'Salir' }).click();

  await page.locator('input[name=correo]').fill('cesar@prueba.local');
  await page.locator('input[name=contrasena]').fill('prueba123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByText('Tu biblioteca está vacía').waitFor({ timeout: 30000 });
  paso('César entra y no ve los datos de otra cuenta');
  await page.goto(base + '#/nuevo');
  await page.locator('input[name=titulo]').fill('Rúbrica de exposición oral');
  await page.locator('.zona-archivos input[type=file]').setInputFiles([join(tmp, 'rubrica.txt'), join(tmp, 'portada.png')]);
  await page.getByRole('button', { name: 'Guardar en la biblioteca' }).click();
  await page.waitForURL(/#\/r\//);
  await page.getByRole('heading', { name: 'Rúbrica de exposición oral' }).waitFor();
  await page.locator('.archivo img').waitFor({ timeout: 15000 });
  paso('sube 2 archivos a Storage y la ficha a Firestore; la imagen se ve');
  await page.reload();
  await page.getByRole('heading', { name: 'Rúbrica de exposición oral' }).waitFor({ timeout: 30000 });
  const [d] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '⬇ Descargar' }).first().click()]);
  const ruta = await d.path();
  assert.ok(ruta);
  paso('tras recargar sigue ahí y el archivo se descarga');
  assert.deepEqual(errores, []);
  console.log('E2E nube: todo pasó');
} catch (e) {
  console.error('✗ FALLÓ nube:', e.message, errores);
  await page.screenshot({ path: join(tmp, 'fallo-nube.png'), fullPage: true });
  console.error('Captura:', join(tmp, 'fallo-nube.png'));
  process.exitCode = 1;
} finally {
  await nav.close();
  srv.kill();
}
