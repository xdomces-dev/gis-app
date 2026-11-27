import { CONFIG } from '../config.js';
import { crearAlmacenLocal } from './local.js';
import { crearAlmacenMemoria } from './memoria.js';

/** Elige el almacén. `?backend=memoria` o `?backend=local` en la URL sirve para pruebas. */
export async function elegirAlmacen() {
  const pedido = new URLSearchParams(location.search).get('backend');
  const tipo = ['memoria', 'local', 'firebase'].includes(pedido) ? pedido : CONFIG.backend;
  if (tipo === 'memoria') return crearAlmacenMemoria();
  if (tipo === 'firebase') {
    const { crearAlmacenFirebase } = await import('./firebase.js');
    // ?emuladores=1 solo funciona en este equipo (127.0.0.1) y con un proyecto «demo-», que no existe en la nube.
    const local = ['127.0.0.1', 'localhost'].includes(location.hostname);
    if (local && new URLSearchParams(location.search).get('emuladores') === '1') {
      return crearAlmacenFirebase({ ...CONFIG, OWNER_UID: '', emuladores: true, firebase: { ...CONFIG.firebase, projectId: 'demo-biblioteca', storageBucket: 'demo-biblioteca.appspot.com' } });
    }
    return crearAlmacenFirebase(CONFIG);
  }
  return crearAlmacenLocal();
}
