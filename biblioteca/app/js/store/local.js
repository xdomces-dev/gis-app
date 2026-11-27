// Almacén local: IndexedDB de este navegador. Sirve para probar la biblioteca sin
// activar servicios. Los datos NO salen de este equipo y se pierden si se borran
// los datos del sitio. Para conservarlos: Respaldo › Exportar.

import { COLECCIONES } from '../modelo.js';

const BD = 'biblioteca-pedagogica';
const VERSION_BD = 1;

function abrir() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(BD, VERSION_BD);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const c of COLECCIONES) if (!db.objectStoreNames.contains(c)) db.createObjectStore(c, { keyPath: 'id' });
      if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs');
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

function tx(db, store, modo, fn) {
  return new Promise((res, rej) => {
    const t = db.transaction(store, modo);
    const s = t.objectStore(store);
    let resultado, error = null;
    Promise.resolve(fn(s)).then(r => { resultado = r; }, e => { error = e; try { t.abort(); } catch { /* ya terminada */ } });
    t.oncomplete = () => (error ? rej(error) : res(resultado));
    t.onerror = () => rej(error || t.error);
    t.onabort = () => rej(error || t.error || new Error('Transacción cancelada'));
  });
}

const pedir = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });

export function crearAlmacenLocal() {
  let db = null;
  const urls = new Map();
  return {
    tipo: 'local',
    descripcion: 'Este navegador (modo local)',
    async iniciar() { db = await abrir(); return { uid: 'local' }; },
    usuario() { return { uid: 'local', email: 'modo local' }; },
    async listar(n) { return tx(db, n, 'readonly', s => pedir(s.getAll())); },
    async guardar(n, obj) { if (!obj.id) throw new Error('Falta id'); await tx(db, n, 'readwrite', s => pedir(s.put(obj))); return obj; },
    async actualizar(n, id, parche) {
      await tx(db, n, 'readwrite', async s => {
        const actual = await pedir(s.get(id));
        if (!actual) throw new Error(`No existe ${n}/${id}`);
        await pedir(s.put({ ...actual, ...parche }));
      });
    },
    async subirArchivo(ruta, blob) { await tx(db, 'blobs', 'readwrite', s => pedir(s.put(blob, ruta))); return { ruta }; },
    async leerArchivo(ruta) {
      const b = await tx(db, 'blobs', 'readonly', s => pedir(s.get(ruta)));
      if (!b) throw new Error('Archivo no encontrado: ' + ruta);
      return b;
    },
    async urlArchivo(ruta) {
      if (urls.has(ruta)) return urls.get(ruta);
      const u = URL.createObjectURL(await this.leerArchivo(ruta));
      urls.set(ruta, u);
      return u;
    },
    async existeArchivo(ruta) { return !!(await tx(db, 'blobs', 'readonly', s => pedir(s.getKey(ruta)))); },
  };
}
