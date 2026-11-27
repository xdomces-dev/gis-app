// Catálogo: operaciones de la biblioteca sobre un almacén (local, nube o memoria).
// Mantiene una copia en memoria para buscar rápido. Nunca borra registros ni archivos.

import { sha256, ahoraISO, hoyISO, nuevoId } from './util.js';
import {
  COLECCIONES, crearRecurso, cambiosFicha, crearVersion, crearArchivo, rutaArchivo, siguienteNumero,
  elegirVersion, recomendarVersion, crearContexto, crearTema, crearColeccion, crearNota, estadoPermitido,
  RELACIONES, VERSION_MODELO,
} from './modelo.js';
import { duplicadosDe } from './busqueda.js';
import { CRITERIOS_INICIALES } from './datos/criterios.js';

export function crearCatalogo(almacen) {
  const datos = Object.fromEntries(COLECCIONES.map(c => [c, []]));
  const oyentes = new Set();
  const avisar = () => oyentes.forEach(f => { try { f(); } catch (e) { console.error(e); } });

  const buscar = (col, id) => datos[col].find(x => x.id === id);

  async function guardar(col, obj) {
    await almacen.guardar(col, obj);
    const i = datos[col].findIndex(x => x.id === obj.id);
    if (i >= 0) datos[col][i] = obj; else datos[col].push(obj);
    return obj;
  }

  async function actualizar(col, id, parche) {
    await almacen.actualizar(col, id, parche);
    const o = buscar(col, id);
    if (o) Object.assign(o, parche);
  }

  async function aplicarCambios(cambios) {
    for (const c of cambios) await actualizar(c.coleccion, c.id, c.parche);
  }

  /**
   * Guarda los archivos de una versión. Cada archivo: { blob, nombre, mime, rol, fechaArchivo } o { url, nombre, rol }.
   * Devuelve { guardados: [archivo], fallos: [{nombre, error}] }.
   */
  async function guardarArchivos(recursoId, versionId, archivos) {
    const guardados = [], fallos = [];
    for (const a of archivos) {
      try {
        if (a.url) {
          guardados.push(await guardar('archivos', crearArchivo({ versionId, recursoId, rol: a.rol, nombre: a.nombre || a.url, url: a.url })));
          continue;
        }
        const hash = a.hash || await sha256(a.blob);
        const id = nuevoId('arc');
        const ruta = rutaArchivo(recursoId, versionId, id, a.nombre);
        // 1) primero el archivo, 2) luego la ficha: si falla el archivo no queda una ficha huérfana.
        await almacen.subirArchivo(ruta, a.blob, { mime: a.mime || a.blob.type, recursoId, hash });
        const reg = crearArchivo({ versionId, recursoId, rol: a.rol, nombre: a.nombre, mime: a.mime || a.blob.type, tamano: a.blob.size, hash, ruta, fechaArchivo: a.fechaArchivo });
        reg.id = id;
        guardados.push(await guardar('archivos', reg));
      } catch (e) {
        fallos.push({ nombre: a.nombre, error: e.message || String(e) });
      }
    }
    return { guardados, fallos };
  }

  /**
   * Si ya hubo un intento con esta clave: completo → no se repite nada;
   * incompleto → se suben solo los archivos que faltan en la misma versión.
   * Devuelve el reporte, o null si nunca hubo intento.
   */
  async function reanudar(clave, archivos) {
    const previa = buscar('importaciones', clave);
    if (!previa) return null;
    if (previa.estado === 'completa') return { ...previa.reporte, repetida: true };
    const { recursoId, versionId } = previa.reporte || {};
    if (!versionId || !buscar('versiones', versionId)) return null;
    const ya = new Set(datos.archivos.filter(a => a.versionId === versionId).map(a => a.nombre));
    const r = await guardarArchivos(recursoId, versionId, archivos.filter(a => !ya.has(a.nombre || a.url)));
    const reporte = { recursoId, versionId, guardados: [...(previa.reporte.guardados || []), ...r.guardados.map(a => a.nombre)], fallos: r.fallos, repetida: false, reanudada: true };
    await actualizar('importaciones', clave, { estado: r.fallos.length ? 'incompleta' : 'completa', reporte, fecha: ahoraISO() });
    avisar();
    return reporte;
  }

  const api = {
    almacen,
    datos,
    alCambiar(f) { oyentes.add(f); return () => oyentes.delete(f); },

    async cargar() {
      for (const c of COLECCIONES) datos[c] = await almacen.listar(c);
      if (datos.criterios.length === 0) {
        for (const cr of CRITERIOS_INICIALES) await guardar('criterios', { ...cr });
      }
      avisar();
    },

    recurso: (id) => buscar('recursos', id),
    version: (id) => buscar('versiones', id),
    archivo: (id) => buscar('archivos', id),
    tema: (id) => buscar('temas', id),
    coleccion: (id) => buscar('colecciones', id),
    versionesDe: (recursoId) => datos.versiones.filter(v => v.recursoId === recursoId).sort((a, b) => a.numero - b.numero),
    archivosDe: (versionId) => datos.archivos.filter(a => a.versionId === versionId),
    archivosDelRecurso: (recursoId) => datos.archivos.filter(a => a.recursoId === recursoId),
    usosDe: (recursoId) => datos.contextos.filter(c => c.recursoId === recursoId),
    notasDe: (tipo, id) => datos.notas.filter(n => n.sobreTipo === tipo && n.sobreId === id).sort((a, b) => b.fecha.localeCompare(a.fecha)),

    /** Huellas y candidatos a duplicado de unos archivos, antes de guardarlos. */
    async revisarDuplicados(archivos) {
      const res = [];
      for (const a of archivos) {
        if (a.url) {
          const exactos = datos.archivos.filter(x => x.url && x.url === a.url);
          res.push({ nombre: a.nombre || a.url, exactos, probables: [] });
          continue;
        }
        a.hash = a.hash || await sha256(a.blob);
        res.push({ nombre: a.nombre, hash: a.hash, ...duplicadosDe({ hash: a.hash, nombre: a.nombre, tamano: a.blob.size }, datos.archivos) });
      }
      return res;
    },

    /**
     * Registra un recurso nuevo con su primera versión y sus archivos.
     * opciones: { ficha, archivos, version: {estado, consigna, ...}, origen, evidencia, claveIdempotencia, fuentes }
     * Devuelve un reporte: qué se guardó y qué falló.
     */
    async registrarRecurso({ ficha, archivos = [], version = {}, origen = 'cesar', evidencia = '', claveIdempotencia = '', fuentes = [] }) {
      if (claveIdempotencia) {
        const previa = await reanudar(claveIdempotencia, archivos);
        if (previa) return previa;
      }
      const reporte = { recursoId: null, versionId: null, guardados: [], fallos: [], repetida: false };
      const recurso = crearRecurso(ficha, origen, evidencia);
      if (fuentes.length) recurso.fuentes = fuentes;
      const ver = crearVersion({ recursoId: recurso.id, numero: 1, ...version }, origen);
      await guardar('recursos', recurso);
      await guardar('versiones', ver);
      reporte.recursoId = recurso.id;
      reporte.versionId = ver.id;
      const r = await guardarArchivos(recurso.id, ver.id, archivos);
      reporte.guardados = r.guardados.map(a => a.nombre);
      reporte.fallos = r.fallos;
      if (ver.estado === 'elegida_cesar') await actualizar('recursos', recurso.id, { versionElegidaId: ver.id });
      if (claveIdempotencia) {
        await guardar('importaciones', { id: claveIdempotencia, estado: r.fallos.length ? 'incompleta' : 'completa', reporte, origen, fecha: ahoraISO() });
      }
      avisar();
      return reporte;
    },

    async editarFicha(recursoId, cambios, origen = 'cesar', evidencia = '') {
      const r = buscar('recursos', recursoId);
      if (!r) throw new Error('Recurso no encontrado');
      await actualizar('recursos', recursoId, cambiosFicha(r, cambios, origen, evidencia));
      avisar();
    },

    /** Corrección o adaptación: nueva versión del mismo recurso. */
    async nuevaVersion(recursoId, { relacion = 'correccion', consigna = '', cambios = '', notas = '', estado = 'borrador', etiqueta = '', archivos = [], basadaEn = null }, origen = 'cesar') {
      if (!['correccion', 'adaptacion', 'original'].includes(relacion)) throw new Error('Para una propuesta nueva usa «Derivar»');
      const r = buscar('recursos', recursoId);
      if (!r) throw new Error('Recurso no encontrado');
      const ver = crearVersion({
        recursoId, numero: siguienteNumero(api.versionesDe(recursoId)), relacion, consigna, cambios, notas, estado, etiqueta,
        origenVersionIds: basadaEn ? [basadaEn] : [],
      }, origen);
      await guardar('versiones', ver);
      const res = await guardarArchivos(recursoId, ver.id, archivos);
      if (ver.estado === 'elegida_cesar') await aplicarCambios(elegirVersion(r, datos.versiones, ver.id, 'Registrada por César al crear la versión'));
      await actualizar('recursos', recursoId, { actualizadoEn: ahoraISO() });
      avisar();
      return { versionId: ver.id, guardados: res.guardados.map(a => a.nombre), fallos: res.fallos };
    },

    /** Propuesta derivada: recurso NUEVO a partir de una o varias versiones de otros recursos. */
    async derivar({ origenVersionIds, ficha, consigna, cambios = '', archivos = [], estado = 'borrador', contexto = null }, origen = 'cesar') {
      if (!origenVersionIds?.length) throw new Error('Selecciona al menos un material de origen');
      for (const id of origenVersionIds) if (!buscar('versiones', id)) throw new Error('Versión de origen no encontrada: ' + id);
      const rep = await api.registrarRecurso({
        ficha, archivos, origen,
        version: { relacion: 'derivada', origenVersionIds, consigna, cambios, estado },
      });
      if (contexto) await api.registrarUso({ ...contexto, recursoId: rep.recursoId, versionId: rep.versionId });
      return rep;
    },

    async agregarArchivos(versionId, archivos) {
      const v = buscar('versiones', versionId);
      if (!v) throw new Error('Versión no encontrada');
      const res = await guardarArchivos(v.recursoId, versionId, archivos);
      avisar();
      return { guardados: res.guardados.map(a => a.nombre), fallos: res.fallos };
    },

    async elegir(versionId) {
      const v = buscar('versiones', versionId);
      await aplicarCambios(elegirVersion(buscar('recursos', v.recursoId), datos.versiones, versionId));
      avisar();
    },

    async recomendar(versionId, justificacion) {
      const v = buscar('versiones', versionId);
      await aplicarCambios(recomendarVersion(buscar('recursos', v.recursoId), datos.versiones, versionId, justificacion));
      avisar();
    },

    /** Cambios manuales de estado (borrador, pendiente, sustituida). Elegir usa elegir(). */
    async cambiarEstado(versionId, estado) {
      if (estado === 'elegida_cesar') return api.elegir(versionId);
      if (estado === 'recomendada_ia') throw new Error('Una recomendación necesita justificación');
      const v = buscar('versiones', versionId);
      const r = buscar('recursos', v.recursoId);
      await actualizar('versiones', versionId, { estado: estadoPermitido(estado, 'cesar') });
      if (r.versionElegidaId === versionId) await actualizar('recursos', r.id, { versionElegidaId: null });
      avisar();
    },

    async editarVersion(versionId, cambios) {
      const permitido = {};
      for (const k of ['consigna', 'cambios', 'notas', 'etiqueta']) if (k in cambios) permitido[k] = String(cambios[k] || '');
      await actualizar('versiones', versionId, permitido);
      avisar();
    },

    async registrarUso(c) {
      const ctx = crearContexto(c);
      await guardar('contextos', ctx);
      avisar();
      return ctx;
    },

    async agregarNota(n) { const nota = crearNota(n); await guardar('notas', nota); avisar(); return nota; },

    async guardarTema(t) {
      const tema = t.id ? { ...buscar('temas', t.id), ...t } : crearTema(t);
      if (tema.padreId === tema.id) throw new Error('Un tema no puede ser su propio padre');
      await guardar('temas', tema);
      avisar();
      return tema;
    },

    /**
     * Crea el árbol campo › asignatura › tema a partir del catálogo sembrado de GIS.
     * Idempotente: no repite temas que ya tengan el mismo vínculo.
     */
    async importarTemasGIS(MAPA_MAESTRO, GP_CAMPO, CAMPO_NOMBRE) {
      let creados = 0;
      const porVinculo = new Map(datos.temas.filter(t => t.vinculoGis).map(t => [t.vinculoGis.materia + '|' + (t.vinculoGis.nombre || ''), t]));
      const asegurar = async (clave, t) => {
        if (porVinculo.has(clave)) return porVinculo.get(clave);
        const nuevo = crearTema(t);
        await guardar('temas', nuevo);
        porVinculo.set(clave, nuevo);
        creados++;
        return nuevo;
      };
      for (const [materia, temas] of Object.entries(MAPA_MAESTRO)) {
        const campo = CAMPO_NOMBRE[GP_CAMPO[materia]] || 'Sin campo';
        const tCampo = await asegurar('campo:' + campo + '|', { nombre: campo, nivel: 'campo', vinculoGis: { materia: 'campo:' + campo, nombre: '' } });
        const tMat = await asegurar(materia + '|', { nombre: materia, nivel: 'asignatura', padreId: tCampo.id, vinculoGis: { materia, nombre: '' } });
        for (const nombre of temas) await asegurar(materia + '|' + nombre, { nombre, nivel: 'tema', padreId: tMat.id, vinculoGis: { materia, nombre } });
      }
      avisar();
      return { creados };
    },

    async guardarColeccion(c) {
      const col = c.id ? { ...buscar('colecciones', c.id), ...c } : crearColeccion(c);
      await guardar('colecciones', col);
      avisar();
      return col;
    },

    /** Criterios versionados: editar crea una versión nueva y conserva la anterior. */
    async guardarCriterio({ id, codigo, texto, ambito = 'General', coleccionId = null }) {
      const t = String(texto || '').trim();
      if (!t) throw new Error('El criterio está vacío');
      if (id) {
        const prev = buscar('criterios', id);
        if (prev.texto === t && prev.ambito === ambito) return prev;
        await actualizar('criterios', id, { vigente: false, sustituidoEn: hoyISO() });
        const nuevo = { ...prev, id: nuevoId('crit'), texto: t, ambito, coleccionId, version: (prev.version || 1) + 1, anteriorId: prev.id, vigente: true, fecha: hoyISO() };
        await guardar('criterios', nuevo);
        avisar();
        return nuevo;
      }
      const nuevo = { id: nuevoId('crit'), codigo: codigo || 'C-' + String(datos.criterios.length + 1).padStart(2, '0'), texto: t, ambito, coleccionId, version: 1, vigente: true, fecha: hoyISO(), autor: 'cesar' };
      await guardar('criterios', nuevo);
      avisar();
      return nuevo;
    },

    async archivar(recursoId, valor = true) {
      await actualizar('recursos', recursoId, { archivado: !!valor, actualizadoEn: ahoraISO() });
      avisar();
    },

    async urlArchivo(a) { return a.url && !a.ruta ? a.url : almacen.urlArchivo(a.ruta); },
    async blobArchivo(a) { return almacen.leerArchivo(a.ruta); },

    /** Catálogo completo como objeto JSON (sin los archivos). */
    exportar() {
      return {
        formato: 'biblioteca-catalogo/1',
        modelo: VERSION_MODELO,
        exportadoEn: ahoraISO(),
        almacen: almacen.tipo,
        ...Object.fromEntries(COLECCIONES.map(c => [c, datos[c]])),
      };
    },

    /**
     * Restaura un catálogo exportado. No sobrescribe registros que ya existen (los respeta).
     * blobs: Map ruta → Blob con los archivos (si vienen en el ZIP).
     */
    async importarCatalogo(json, blobs = new Map()) {
      if (json?.formato !== 'biblioteca-catalogo/1') throw new Error('El archivo no es un catálogo de la biblioteca');
      const rep = { nuevos: 0, existentes: 0, archivosRestaurados: 0, archivosFaltantes: [] };
      for (const c of COLECCIONES) {
        for (const obj of json[c] || []) {
          if (!obj?.id) continue;
          if (buscar(c, obj.id)) { rep.existentes++; continue; }
          await guardar(c, obj);
          rep.nuevos++;
        }
      }
      for (const a of json.archivos || []) {
        if (!a.ruta) continue;
        if (blobs.has(a.ruta)) {
          if (!(await almacen.existeArchivo(a.ruta))) { await almacen.subirArchivo(a.ruta, blobs.get(a.ruta), { mime: a.mime, recursoId: a.recursoId, hash: a.hash }); rep.archivosRestaurados++; }
        } else if (!(await almacen.existeArchivo(a.ruta))) {
          rep.archivosFaltantes.push(a.nombre);
        }
      }
      avisar();
      return rep;
    },

    /**
     * Importa un paquete de publicación (manifest.json + archivos). Ver docs/biblioteca/PUBLICACION.md.
     * Reintentar el mismo paquete no duplica: se usa manifest.idPublicacion.
     */
    async importarPaquete(manifest, archivosPorNombre) {
      if (manifest?.formato !== 'biblioteca-paquete/1') throw new Error('El paquete no tiene formato biblioteca-paquete/1');
      if (!manifest.idPublicacion) throw new Error('El paquete no tiene idPublicacion');
      const clave = 'pub_' + String(manifest.idPublicacion).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
      const herramienta = String(manifest.herramienta || 'desconocida');
      // Todo paquete cuenta como externo, diga lo que diga: un paquete no puede declarar la aprobación de César.
      const origen = 'ia';
      const evidencia = `Paquete ${manifest.idPublicacion} (${herramienta})`;
      const faltantes = [];
      const archivos = [];
      for (const a of manifest.archivos || []) {
        if (a.url) { archivos.push({ url: a.url, nombre: a.nombre || a.url, rol: a.rol }); continue; }
        const blob = archivosPorNombre.get(a.nombre);
        if (!blob) { faltantes.push(a.nombre); continue; }
        archivos.push({ blob, nombre: a.nombre, rol: a.rol || 'final', mime: a.mime || blob.type || '' });
      }
      const v = manifest.version || {};
      const fuentes = (manifest.fuentes || []).map(f => ({ tipo: String(f.tipo || ''), descripcion: String(f.descripcion || ''), herramienta }));
      // Temas por nombre: se enlazan si existen; los que no, quedan anotados para revisar.
      const temaIds = [], temasSinEnlazar = [];
      for (const nombre of manifest.recurso?.temas || []) {
        const t = datos.temas.find(x => x.nombre.toLowerCase() === String(nombre).toLowerCase());
        if (t) temaIds.push(t.id); else temasSinEnlazar.push(nombre);
      }
      let rep;
      if (v.recursoExistenteId) {
        const previa = await reanudar(clave, archivos);
        if (previa) { previa.faltantes = faltantes; if (faltantes.length) await actualizar('importaciones', clave, { estado: 'incompleta' }); return previa; }
        if (!buscar('recursos', v.recursoExistenteId)) throw new Error('El recurso indicado no existe: ' + v.recursoExistenteId);
        const relacion = RELACIONES[v.relacion] && v.relacion !== 'derivada' ? v.relacion : 'correccion';
        const r = await api.nuevaVersion(v.recursoExistenteId, { relacion, consigna: v.consigna, cambios: v.cambios, estado: estadoPermitido(v.estado || 'pendiente_revision', origen), archivos }, origen);
        rep = { recursoId: v.recursoExistenteId, versionId: r.versionId, guardados: r.guardados, fallos: r.fallos, repetida: false };
        await guardar('importaciones', { id: clave, estado: r.fallos.length || faltantes.length ? 'incompleta' : 'completa', reporte: rep, origen, fecha: ahoraISO() });
      } else {
        rep = await api.registrarRecurso({
          ficha: { ...(manifest.recurso || {}), temaIds },
          archivos, origen, evidencia, fuentes, claveIdempotencia: clave,
          version: {
            relacion: v.relacion === 'derivada' && v.origenVersionIds?.length ? 'derivada' : 'original',
            origenVersionIds: v.origenVersionIds || [], consigna: v.consigna, cambios: v.cambios,
            estado: estadoPermitido(v.estado || 'pendiente_revision', origen),
          },
        });
      }
      rep.faltantes = faltantes;
      rep.temasSinEnlazar = temasSinEnlazar;
      if (faltantes.length && !rep.repetida) await actualizar('importaciones', clave, { estado: 'incompleta' });
      if (rep.recursoId && temasSinEnlazar.length && !rep.repetida && !rep.reanudada) {
        await api.agregarNota({ sobreTipo: 'recurso', sobreId: rep.recursoId, autor: 'ia', tipo: 'nota', texto: 'Temas propuestos sin enlazar (no existen en el catálogo): ' + temasSinEnlazar.join(', ') });
      }
      avisar();
      return rep;
    },
  };
  return api;
}
