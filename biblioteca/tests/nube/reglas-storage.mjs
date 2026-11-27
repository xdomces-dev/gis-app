// Pruebas de storage.rules en el emulador (se ejecuta desde tests/nube/correr.sh).
// Requiere @firebase/rules-unit-testing y firebase instalados donde se ejecute.
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
const env = await initializeTestEnvironment({ projectId: 'demo-biblioteca', storage: { rules: readFileSync('storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 } });
const cesar = env.authenticatedContext('cesar123').storage();
const otro = env.authenticatedContext('otro456').storage();
const anon = env.unauthenticatedContext().storage();
const b = new Uint8Array([1, 2, 3]);
const casos = [
  ['César sube a su carpeta', () => assertSucceeds(uploadBytes(ref(cesar, 'biblioteca/cesar123/rec/ver/a.pdf'), b))],
  ['César lee su archivo', () => assertSucceeds(getBytes(ref(cesar, 'biblioteca/cesar123/rec/ver/a.pdf')))],
  ['César NO sobrescribe', () => assertFails(uploadBytes(ref(cesar, 'biblioteca/cesar123/rec/ver/a.pdf'), b))],
  ['César NO borra', () => assertFails(deleteObject(ref(cesar, 'biblioteca/cesar123/rec/ver/a.pdf')))],
  ['Otra cuenta NO lee lo de César', () => assertFails(getBytes(ref(otro, 'biblioteca/cesar123/rec/ver/a.pdf')))],
  ['Otra cuenta NO sube a la carpeta de César', () => assertFails(uploadBytes(ref(otro, 'biblioteca/cesar123/x.pdf'), b))],
  ['Otra cuenta NO sube ni a su propia carpeta (evita costos)', () => assertFails(uploadBytes(ref(otro, 'biblioteca/otro456/x.pdf'), b))],
  ['Sin sesión NO lee', () => assertFails(getBytes(ref(anon, 'biblioteca/cesar123/rec/ver/a.pdf')))],
  ['César NO escribe fuera de biblioteca/', () => assertFails(uploadBytes(ref(cesar, 'otra/cesar123/x.pdf'), b))],
];
let fallas = 0;
for (const [n, f] of casos) { try { await f(); console.log('✓', n); } catch (e) { fallas++; console.log('✗', n, e.message); } }
await env.cleanup();
process.exit(fallas ? 1 : 0);
