// Almacén en memoria: para pruebas automáticas. No guarda nada al cerrar.
// Todos los almacenes cumplen la misma interfaz:
//   iniciar(), usuario(), listar(col), guardar(col, obj), actualizar(col, id, parche),
//   subirArchivo(ruta, blob, meta), urlArchivo(ruta), leerArchivo(ruta)
// No hay función para borrar: la biblioteca no elimina registros ni archivos.

export function crearAlmacenMemoria() {
  const cols = new Map();
  const blobs = new Map();
  const col = (n) => { if (!cols.has(n)) cols.set(n, new Map()); return cols.get(n); };
  const clonar = (o) => JSON.parse(JSON.stringify(o));
  return {
    tipo: 'memoria',
    descripcion: 'Memoria (pruebas)',
    async iniciar() { return { uid: 'prueba' }; },
    usuario() { return { uid: 'prueba', email: 'prueba@local' }; },
    async listar(n) { return [...col(n).values()].map(clonar); },
    async guardar(n, obj) { if (!obj.id) throw new Error('Falta id'); col(n).set(obj.id, clonar(obj)); return obj; },
    async actualizar(n, id, parche) {
      const actual = col(n).get(id);
      if (!actual) throw new Error(`No existe ${n}/${id}`);
      col(n).set(id, { ...actual, ...clonar(parche) });
    },
    async subirArchivo(ruta, blob) { blobs.set(ruta, blob); return { ruta }; },
    async urlArchivo(ruta) { if (!blobs.has(ruta)) throw new Error('Archivo no encontrado: ' + ruta); return 'memoria://' + ruta; },
    async leerArchivo(ruta) { if (!blobs.has(ruta)) throw new Error('Archivo no encontrado: ' + ruta); return blobs.get(ruta); },
    async existeArchivo(ruta) { return blobs.has(ruta); },
  };
}
