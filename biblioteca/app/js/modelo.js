// Modelo de información de la biblioteca. Funciones puras: no tocan el DOM ni la base de datos.
// Referencia: docs/biblioteca/MODELO-DATOS.md

import { nuevoId, ahoraISO, hoyISO, unico } from './util.js';

export const VERSION_MODELO = 1;

// Colecciones de datos (en Firestore se guardan como users/{uid}/bib_<nombre>).
export const COLECCIONES = ['recursos', 'versiones', 'archivos', 'temas', 'colecciones', 'contextos', 'notas', 'importaciones', 'criterios'];

// a) Qué es el recurso
export const TIPOS_RECURSO = {
  planeacion: 'Planeación', secuencia: 'Secuencia didáctica', proyecto: 'Proyecto interdisciplinario',
  presentacion: 'Presentación', cuadernillo_impreso: 'Cuadernillo imprimible', cuadernillo_digital: 'Cuadernillo digital',
  actividad_interactiva: 'Actividad interactiva', juego: 'Juego educativo', evaluacion: 'Evaluación / examen',
  rubrica: 'Rúbrica', respuestas: 'Respuestas / clave', recortable: 'Recortable', plantilla: 'Plantilla',
  ejemplo: 'Ejemplo terminado', imagen: 'Imagen / infografía', video: 'Video', consigna: 'Consigna / prompt',
  guia_diseno: 'Guía de diseño', guia_metodologica: 'Guía metodológica', articulo: 'Artículo', nota_clase: 'Nota de aplicación',
  otro: 'Otro',
};

// c) Su uso (varios a la vez)
export const USOS = {
  imprimir: 'Imprimir', proyectar: 'Proyectar', whatsapp: 'Enviar por WhatsApp', autonomo: 'Trabajo autónomo',
  en_linea: 'Actividad en línea', evaluar: 'Evaluar', consulta_docente: 'Consulta docente', casa: 'Tarea en casa',
};

export const ROLES_ARCHIVO = {
  final: 'Final', editable: 'Editable', miniatura: 'Miniatura / portada', vista_previa: 'Vista previa',
  respuestas: 'Respuestas', fuente: 'Material fuente', otro: 'Otro',
};

export const ESTADOS_VERSION = {
  elegida_cesar: 'Elegida por César', recomendada_ia: 'Recomendada por la IA', borrador: 'Borrador',
  sustituida: 'Sustituida', pendiente_revision: 'Pendiente de revisión',
};

export const RELACIONES = {
  original: 'Original', correccion: 'Corrección', adaptacion: 'Adaptación a otro contexto', derivada: 'Propuesta derivada',
};

export const ORIGENES_DATO = {
  cesar: 'Confirmado por César', ia: 'Propuesto por IA', archivo: 'Leído del archivo', gis: 'Tomado de GIS', inferido: 'Inferido',
};

export const MODALIDADES = {
  individual: 'Individual', parejas: 'Parejas', equipos: 'Equipos', grupal: 'Grupal', multigrado: 'Multigrado', autonomo: 'Autónomo',
};

export const GRADOS = ['1', '2', '3'];
export const GRADE_COLORS = { '1': '#2563eb', '2': '#c9820a', '3': '#7c3aed' };

export const CAMPOS_FORMATIVOS = [
  'Lenguajes', 'Saberes y pensamiento científico', 'Ética, naturaleza y sociedades', 'De lo humano y lo comunitario',
];

// Las 8 materias de Gestión Pedagógica en GIS, más otras sugeridas. Se puede escribir cualquier otra.
export const ASIGNATURAS_SUGERIDAS = [
  'Lenguajes / Español', 'Matemáticas', 'Biología / Ciencias de la Vida', 'Física y Química', 'Historia', 'Geografía',
  'Formación Cívica y Ética', 'Inglés Básico', 'Artes', 'Educación Física', 'Tecnología',
];

export const NIVELES_TEMA = { campo: 'Campo formativo', asignatura: 'Asignatura', bloque: 'Bloque temático', tema: 'Tema', subtema: 'Subtema' };

export const TIPOS_COLECCION = { coleccion: 'Colección', proyecto: 'Proyecto', propuesta: 'Propuesta metodológica' };

// b) Su formato: se deduce de cada archivo
const EXT_CATEGORIA = {
  png: 'imagen', jpg: 'imagen', jpeg: 'imagen', gif: 'imagen', webp: 'imagen', svg: 'imagen', heic: 'imagen',
  pdf: 'pdf', html: 'html', htm: 'html',
  mp4: 'video', mov: 'video', webm: 'video', m4v: 'video', avi: 'video',
  mp3: 'audio', m4a: 'audio', wav: 'audio', ogg: 'audio', opus: 'audio',
  ppt: 'presentacion', pptx: 'presentacion', key: 'presentacion', odp: 'presentacion',
  doc: 'documento', docx: 'documento', odt: 'documento', rtf: 'documento',
  xls: 'hoja', xlsx: 'hoja', ods: 'hoja', csv: 'hoja',
  txt: 'texto', md: 'texto', json: 'texto',
  zip: 'paquete',
};

export const CATEGORIAS_FORMATO = {
  imagen: 'Imagen', pdf: 'PDF', html: 'HTML', video: 'Video', audio: 'Audio', presentacion: 'Presentación',
  documento: 'Documento', hoja: 'Hoja de cálculo', texto: 'Texto', paquete: 'Paquete', enlace: 'Enlace', otro: 'Otro',
};

export function extension(nombre) {
  const m = /\.([a-z0-9]{1,8})$/i.exec(String(nombre || ''));
  return m ? m[1].toLowerCase() : '';
}

export function formatoDe(nombre, mime) {
  const ext = extension(nombre);
  if (ext) return ext.toUpperCase();
  if (mime && mime.includes('/')) return mime.split('/')[1].toUpperCase();
  return '';
}

export function categoriaFormato(archivo) {
  if (archivo?.url && !archivo?.ruta) return 'enlace';
  const ext = extension(archivo?.nombre);
  if (EXT_CATEGORIA[ext]) return EXT_CATEGORIA[ext];
  const mime = archivo?.mime || '';
  if (mime.startsWith('image/')) return 'imagen';
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'text/html') return 'html';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'otro';
}

/** Un dato clasificatorio con su procedencia. Solo origen 'cesar' cuenta como confirmado. */
export function dato(origen, evidencia = '') {
  if (!ORIGENES_DATO[origen]) throw new Error('Origen de dato desconocido: ' + origen);
  return { origen, evidencia: String(evidencia || ''), fecha: hoyISO() };
}

export function esConfirmado(recurso, campo) {
  return recurso?.procedencia?.[campo]?.origen === 'cesar';
}

const CAMPOS_CLASIFICACION = ['tipoRecurso', 'usos', 'grados', 'asignaturas', 'camposFormativos', 'temaIds', 'coleccionIds', 'modalidades', 'gradualidad'];

export function limpiarLista(v) {
  if (Array.isArray(v)) return unico(v.map(x => String(x).trim()));
  if (typeof v === 'string') return unico(v.split(',').map(x => x.trim()));
  return [];
}

/** Ficha mínima: solo el título es obligatorio. */
export function crearRecurso(ficha = {}, origen = 'cesar', evidencia = '') {
  const titulo = String(ficha.titulo || '').trim();
  if (!titulo) throw new Error('El recurso necesita un título');
  const r = {
    id: ficha.id || nuevoId('rec'),
    titulo,
    descripcion: String(ficha.descripcion || ''),
    tipoRecurso: TIPOS_RECURSO[ficha.tipoRecurso] ? ficha.tipoRecurso : '',
    usos: limpiarLista(ficha.usos).filter(u => USOS[u]),
    grados: limpiarLista(ficha.grados).filter(g => GRADOS.includes(g)),
    asignaturas: limpiarLista(ficha.asignaturas),
    camposFormativos: limpiarLista(ficha.camposFormativos),
    temaIds: limpiarLista(ficha.temaIds),
    coleccionIds: limpiarLista(ficha.coleccionIds),
    modalidades: limpiarLista(ficha.modalidades).filter(m => MODALIDADES[m]),
    gradualidad: String(ficha.gradualidad || ''),
    etiquetas: limpiarLista(ficha.etiquetas),
    versionElegidaId: null,
    versionRecomendadaId: null,
    archivado: false,
    procedencia: {},
    creadoEn: ahoraISO(),
    actualizadoEn: ahoraISO(),
    modelo: VERSION_MODELO,
  };
  for (const c of CAMPOS_CLASIFICACION) {
    const v = r[c];
    if ((Array.isArray(v) && v.length) || (!Array.isArray(v) && v)) r.procedencia[c] = dato(origen, evidencia);
  }
  return r;
}

/** Aplica cambios a la ficha y registra quién los hizo. Devuelve el parche a guardar. */
export function cambiosFicha(recurso, cambios, origen = 'cesar', evidencia = '') {
  const parche = {};
  const procedencia = { ...(recurso.procedencia || {}) };
  for (const [k, v] of Object.entries(cambios)) {
    if (k === 'titulo') {
      const t = String(v || '').trim();
      if (!t) throw new Error('El título no puede quedar vacío');
      parche.titulo = t;
    } else if (k === 'descripcion' || k === 'gradualidad') {
      parche[k] = String(v || '');
    } else if (k === 'tipoRecurso') {
      parche[k] = TIPOS_RECURSO[v] ? v : '';
    } else if (['usos', 'grados', 'asignaturas', 'camposFormativos', 'temaIds', 'coleccionIds', 'modalidades', 'etiquetas'].includes(k)) {
      let lista = limpiarLista(v);
      if (k === 'usos') lista = lista.filter(u => USOS[u]);
      if (k === 'grados') lista = lista.filter(g => GRADOS.includes(g));
      if (k === 'modalidades') lista = lista.filter(m => MODALIDADES[m]);
      parche[k] = lista;
    } else {
      continue; // campos no editables por aquí
    }
    if (CAMPOS_CLASIFICACION.includes(k)) procedencia[k] = dato(origen, evidencia);
  }
  parche.procedencia = procedencia;
  parche.actualizadoEn = ahoraISO();
  return parche;
}

export function siguienteNumero(versionesDelRecurso) {
  return versionesDelRecurso.reduce((m, v) => Math.max(m, v.numero || 0), 0) + 1;
}

/**
 * Las herramientas externas (IA, importaciones) nunca pueden marcar una versión
 * como «elegida por César». Si lo intentan, queda pendiente de revisión.
 */
export function estadoPermitido(estado, origen) {
  if (!ESTADOS_VERSION[estado]) return 'pendiente_revision';
  if (estado === 'elegida_cesar' && origen !== 'cesar') return 'pendiente_revision';
  return estado;
}

export function crearVersion({ recursoId, numero = 1, relacion = 'original', origenVersionIds = [], consigna = '', cambios = '', notas = '', estado = 'borrador', etiqueta = '' }, origen = 'cesar') {
  if (!recursoId) throw new Error('La versión necesita recursoId');
  if (!RELACIONES[relacion]) throw new Error('Relación desconocida: ' + relacion);
  const origenes = limpiarLista(origenVersionIds);
  if (relacion === 'derivada' && origenes.length === 0) throw new Error('Una propuesta derivada necesita al menos un material de origen');
  const est = estadoPermitido(estado, origen);
  return {
    id: nuevoId('ver'),
    recursoId,
    numero,
    etiqueta: String(etiqueta || ''),
    relacion,
    origenVersionIds: origenes,
    consigna: String(consigna || ''),
    cambios: String(cambios || ''),
    notas: String(notas || ''),
    estado: est,
    evidenciasEstado: est === 'elegida_cesar' ? [{ texto: 'Registrada por César al crear la versión', fecha: hoyISO() }] : [],
    creadaPor: origen,
    creadoEn: ahoraISO(),
  };
}

/**
 * César elige una versión. La que estaba elegida pasa a «sustituida» (no se borra).
 * Devuelve los parches: [{coleccion, id, parche}].
 */
export function elegirVersion(recurso, versiones, versionId, evidencia = 'Marcada por César en la biblioteca') {
  const v = versiones.find(x => x.id === versionId && x.recursoId === recurso.id);
  if (!v) throw new Error('La versión no pertenece a este recurso');
  const cambios = [];
  for (const otra of versiones) {
    if (otra.recursoId === recurso.id && otra.id !== versionId && otra.estado === 'elegida_cesar') {
      cambios.push({ coleccion: 'versiones', id: otra.id, parche: { estado: 'sustituida', sustituidaPor: versionId, sustituidaEn: hoyISO() } });
    }
  }
  cambios.push({
    coleccion: 'versiones', id: versionId,
    parche: { estado: 'elegida_cesar', evidenciasEstado: [...(v.evidenciasEstado || []), { texto: evidencia, fecha: hoyISO() }] },
  });
  cambios.push({ coleccion: 'recursos', id: recurso.id, parche: { versionElegidaId: versionId, actualizadoEn: ahoraISO() } });
  return cambios;
}

/** La IA puede recomendar, con justificación obligatoria. No cambia la versión elegida. */
export function recomendarVersion(recurso, versiones, versionId, justificacion) {
  if (!String(justificacion || '').trim()) throw new Error('Una recomendación necesita justificación');
  const v = versiones.find(x => x.id === versionId && x.recursoId === recurso.id);
  if (!v) throw new Error('La versión no pertenece a este recurso');
  const cambios = [];
  if (v.estado !== 'elegida_cesar') {
    cambios.push({ coleccion: 'versiones', id: versionId, parche: { estado: 'recomendada_ia', evidenciasEstado: [...(v.evidenciasEstado || []), { texto: 'Recomendación IA: ' + justificacion, fecha: hoyISO() }] } });
  }
  cambios.push({ coleccion: 'recursos', id: recurso.id, parche: { versionRecomendadaId: versionId, actualizadoEn: ahoraISO() } });
  return cambios;
}

/** Versión que se muestra por defecto: la elegida; si no hay, la recomendada; si no, la más reciente. */
export function versionPrincipal(recurso, versiones) {
  const delRecurso = versiones.filter(v => v.recursoId === recurso.id);
  return delRecurso.find(v => v.id === recurso.versionElegidaId)
    || delRecurso.find(v => v.id === recurso.versionRecomendadaId)
    || delRecurso.sort((a, b) => (b.numero || 0) - (a.numero || 0))[0]
    || null;
}

export function crearArchivo({ versionId, recursoId, rol = 'final', nombre, mime = '', tamano = null, hash = '', ruta = '', url = '', fechaArchivo = '' }) {
  if (!versionId || !recursoId) throw new Error('El archivo necesita versión y recurso');
  if (!ruta && !url) throw new Error('El archivo necesita un archivo guardado o un enlace');
  if (url && !/^https?:\/\//i.test(url)) throw new Error('El enlace debe empezar con http:// o https://');
  return {
    id: nuevoId('arc'),
    versionId,
    recursoId,
    rol: ROLES_ARCHIVO[rol] ? rol : 'otro',
    nombre: String(nombre || (url ? url : 'archivo')),
    formato: url && !ruta ? 'ENLACE' : formatoDe(nombre, mime),
    mime: String(mime || ''),
    tamano,
    hash: String(hash || ''),
    ruta: String(ruta || ''),
    url: String(url || ''),
    fechaArchivo: String(fechaArchivo || ''), // fecha de creación/modificación del archivo ≠ fecha de aplicación
    creadoEn: ahoraISO(),
  };
}

/** Ruta en el almacén: estable y sin nombres de archivo del usuario (evita caracteres problemáticos). */
export function rutaArchivo(recursoId, versionId, archivoId, nombre) {
  const ext = extension(nombre);
  return `${recursoId}/${versionId}/${archivoId}${ext ? '.' + ext : ''}`;
}

/** Contexto de uso: dónde y cuándo se usó (o se prevé usar) una versión. */
export function crearContexto(c = {}) {
  if (!c.recursoId) throw new Error('El uso necesita un recurso');
  const fechaOk = f => !f || /^\d{4}-\d{2}-\d{2}$/.test(f);
  if (!fechaOk(c.fechaPrevista) || !fechaOk(c.fechaAplicada)) throw new Error('Fecha con formato AAAA-MM-DD');
  return {
    id: nuevoId('uso'),
    recursoId: c.recursoId,
    versionId: c.versionId || null,
    escuela: String(c.escuela || ''),
    ciclo: String(c.ciclo || ''),
    grados: limpiarLista(c.grados).filter(g => GRADOS.includes(g)),
    periodo: String(c.periodo || ''),
    fechaPrevista: c.fechaPrevista || '',
    fechaAplicada: c.fechaAplicada || '',
    fechaOrigen: ORIGENES_DATO[c.fechaOrigen] ? c.fechaOrigen : 'cesar',
    ordenPrevisto: c.ordenPrevisto ?? null,
    ordenAplicado: c.ordenAplicado ?? null,
    modalidad: MODALIDADES[c.modalidad] ? c.modalidad : '',
    notasClase: String(c.notasClase || ''),
    creadoEn: ahoraISO(),
  };
}

export function crearTema({ nombre, nivel = 'tema', padreId = null, notas = '', vinculoGis = null }) {
  const n = String(nombre || '').trim();
  if (!n) throw new Error('El tema necesita nombre');
  return { id: nuevoId('tema'), nombre: n, nivel: NIVELES_TEMA[nivel] ? nivel : 'tema', padreId: padreId || null, notas: String(notas || ''), vinculoGis, creadoEn: ahoraISO() };
}

export function crearColeccion({ nombre, tipo = 'coleccion', descripcion = '', escuela = '', ciclos = [] }) {
  const n = String(nombre || '').trim();
  if (!n) throw new Error('La colección necesita nombre');
  return { id: nuevoId('col'), nombre: n, tipo: TIPOS_COLECCION[tipo] ? tipo : 'coleccion', descripcion: String(descripcion || ''), escuela: String(escuela || ''), ciclos: limpiarLista(ciclos), creadoEn: ahoraISO() };
}

export function crearNota({ sobreTipo, sobreId, texto, tipo = 'nota', autor = 'cesar' }) {
  const t = String(texto || '').trim();
  if (!t) throw new Error('La nota está vacía');
  if (!['nota', 'decision', 'mejora', 'aplicacion'].includes(tipo)) tipo = 'nota';
  return { id: nuevoId('nota'), sobreTipo, sobreId, texto: t, tipo, autor: autor === 'ia' ? 'ia' : 'cesar', fecha: ahoraISO() };
}

/** Descendientes de un tema (para filtrar «Historia» y encontrar también sus subtemas). */
export function descendientesTema(temaId, temas) {
  const res = new Set([temaId]);
  let creció = true;
  while (creció) {
    creció = false;
    for (const t of temas) if (t.padreId && res.has(t.padreId) && !res.has(t.id)) { res.add(t.id); creció = true; }
  }
  return res;
}

export function rutaTema(temaId, temasPorId) {
  const partes = [];
  let t = temasPorId.get(temaId);
  const vistos = new Set();
  while (t && !vistos.has(t.id)) { partes.unshift(t.nombre); vistos.add(t.id); t = t.padreId ? temasPorId.get(t.padreId) : null; }
  return partes.join(' › ');
}

/** Ciclo escolar SEP de una fecha: agosto en adelante abre el ciclo. */
export function cicloDeFecha(iso) {
  if (!iso) return '';
  const [y, m] = iso.split('-').map(Number);
  return m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}
