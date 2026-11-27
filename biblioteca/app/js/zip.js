// ZIP mínimo sin dependencias (funciona en el navegador y en Node 22).
// Escribe sin compresión (PDF, PNG, PPTX ya vienen comprimidos). Lee archivos
// sin compresión o con «deflate» (lo normal al comprimir desde Windows o macOS).
// No admite ZIP64 (archivos de más de 4 GB).

const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = TABLA_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function fechaDOS(d = new Date()) {
  const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const fecha = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { hora, fecha };
}

const aBytes = async (x) => x instanceof Uint8Array ? x : new Uint8Array(await x.arrayBuffer());

/** entradas: [{ nombre: 'carpeta/archivo.pdf', datos: Blob | Uint8Array }] → Blob ZIP */
export async function escribirZip(entradas) {
  const enc = new TextEncoder();
  const partes = [];
  const central = [];
  let offset = 0;
  const { hora, fecha } = fechaDOS();
  for (const e of entradas) {
    const nombre = enc.encode(e.nombre.replace(/^\/+/, ''));
    const datos = await aBytes(e.datos);
    if (datos.length >= 0xffffffff) throw new Error('Archivo demasiado grande para ZIP: ' + e.nombre);
    const crc = crc32(datos);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // nombres en UTF-8
    local.setUint16(8, 0, true); // sin compresión
    local.setUint16(10, hora, true);
    local.setUint16(12, fecha, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, datos.length, true);
    local.setUint32(22, datos.length, true);
    local.setUint16(26, nombre.length, true);
    local.setUint16(28, 0, true);
    partes.push(new Uint8Array(local.buffer), nombre, datos);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(12, hora, true);
    cd.setUint16(14, fecha, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, datos.length, true);
    cd.setUint32(24, datos.length, true);
    cd.setUint16(28, nombre.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), nombre);
    offset += 30 + nombre.length + datos.length;
  }
  const tamCentral = central.reduce((s, p) => s + p.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);
  fin.setUint16(8, entradas.length, true);
  fin.setUint16(10, entradas.length, true);
  fin.setUint32(12, tamCentral, true);
  fin.setUint32(16, offset, true);
  return new Blob([...partes, ...central, new Uint8Array(fin.buffer)], { type: 'application/zip' });
}

async function inflar(bytes) {
  const ds = new DecompressionStream('deflate-raw');
  const res = new Response(new Blob([bytes]).stream().pipeThrough(ds));
  return new Uint8Array(await res.arrayBuffer());
}

/** Blob ZIP → Map nombre → Blob. Ignora carpetas. */
export async function leerZip(blob) {
  const b = new Uint8Array(await blob.arrayBuffer());
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('No es un archivo ZIP válido');
  const total = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  if (p === 0xffffffff) throw new Error('ZIP64 no es compatible');
  const dec = new TextDecoder();
  const res = new Map();
  for (let i = 0; i < total; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('ZIP dañado (directorio central)');
    const metodo = dv.getUint16(p + 10, true);
    const tamComp = dv.getUint32(p + 20, true);
    const lenNombre = dv.getUint16(p + 28, true);
    const lenExtra = dv.getUint16(p + 30, true);
    const lenComent = dv.getUint16(p + 32, true);
    const offLocal = dv.getUint32(p + 42, true);
    const nombre = dec.decode(b.subarray(p + 46, p + 46 + lenNombre));
    p += 46 + lenNombre + lenExtra + lenComent;
    if (nombre.endsWith('/') || nombre.startsWith('__MACOSX/')) continue;
    if (dv.getUint32(offLocal, true) !== 0x04034b50) throw new Error('ZIP dañado (encabezado local)');
    const inicio = offLocal + 30 + dv.getUint16(offLocal + 26, true) + dv.getUint16(offLocal + 28, true);
    const datos = b.subarray(inicio, inicio + tamComp);
    let contenido;
    if (metodo === 0) contenido = datos;
    else if (metodo === 8) contenido = await inflar(datos);
    else throw new Error(`Compresión no compatible en ${nombre} (método ${metodo})`);
    res.set(nombre, new Blob([contenido]));
  }
  return res;
}
