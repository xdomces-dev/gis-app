// Búsqueda, filtros cruzados y vista temporal. Funciones puras.

import { normalizar, nombreMes } from './util.js';
import { categoriaFormato, descendientesTema, cicloDeFecha, TIPOS_RECURSO, USOS } from './modelo.js';

/** Índices auxiliares para buscar rápido. */
export function crearIndice(datos) {
  const porRecurso = (lista) => {
    const m = new Map();
    for (const x of lista) { if (!m.has(x.recursoId)) m.set(x.recursoId, []); m.get(x.recursoId).push(x); }
    return m;
  };
  return {
    temasPorId: new Map(datos.temas.map(t => [t.id, t])),
    coleccionesPorId: new Map(datos.colecciones.map(c => [c.id, c])),
    archivosPorRecurso: porRecurso(datos.archivos),
    versionesPorRecurso: porRecurso(datos.versiones),
    contextosPorRecurso: porRecurso(datos.contextos),
    notasPorRecurso: (() => { const m = new Map(); for (const n of datos.notas) if (n.sobreTipo === 'recurso') { if (!m.has(n.sobreId)) m.set(n.sobreId, []); m.get(n.sobreId).push(n); } return m; })(),
    temas: datos.temas,
  };
}

function textoRecurso(r, ix) {
  const partes = [r.titulo, r.descripcion, r.gradualidad, TIPOS_RECURSO[r.tipoRecurso], ...r.asignaturas, ...r.camposFormativos, ...(r.etiquetas || [])];
  for (const u of r.usos) partes.push(USOS[u]);
  for (const id of r.temaIds) partes.push(ix.temasPorId.get(id)?.nombre);
  for (const id of r.coleccionIds) partes.push(ix.coleccionesPorId.get(id)?.nombre);
  for (const a of ix.archivosPorRecurso.get(r.id) || []) partes.push(a.nombre, a.formato);
  for (const v of ix.versionesPorRecurso.get(r.id) || []) partes.push(v.consigna, v.cambios, v.notas, v.etiqueta);
  for (const c of ix.contextosPorRecurso.get(r.id) || []) partes.push(c.escuela, c.ciclo, c.notasClase);
  for (const n of ix.notasPorRecurso.get(r.id) || []) partes.push(n.texto);
  return normalizar(partes.filter(Boolean).join(' '));
}

/**
 * Filtros cruzados. Todos opcionales:
 * q, tipo, formato, uso, grado, asignatura, campo, temaId, coleccionId, ciclo, escuela, estado, sinClasificar, verArchivados
 */
export function filtrar(recursos, f, ix) {
  const palabras = normalizar(f.q || '').split(/\s+/).filter(Boolean);
  const temasOk = f.temaId ? descendientesTema(f.temaId, ix.temas) : null;
  return recursos.filter(r => {
    if (!f.verArchivados && r.archivado) return false;
    if (f.tipo && r.tipoRecurso !== f.tipo) return false;
    if (f.uso && !r.usos.includes(f.uso)) return false;
    if (f.grado && !r.grados.includes(f.grado)) return false;
    if (f.asignatura && !r.asignaturas.includes(f.asignatura)) return false;
    if (f.campo && !r.camposFormativos.includes(f.campo)) return false;
    if (temasOk && !r.temaIds.some(id => temasOk.has(id))) return false;
    if (f.coleccionId && !r.coleccionIds.includes(f.coleccionId)) return false;
    if (f.formato && !(ix.archivosPorRecurso.get(r.id) || []).some(a => categoriaFormato(a) === f.formato)) return false;
    if (f.estado) {
      const vs = ix.versionesPorRecurso.get(r.id) || [];
      if (f.estado === 'sin_elegida') { if (r.versionElegidaId) return false; }
      else if (!vs.some(v => v.estado === f.estado)) return false;
    }
    if (f.ciclo || f.escuela) {
      const cs = ix.contextosPorRecurso.get(r.id) || [];
      if (f.ciclo && !cs.some(c => c.ciclo === f.ciclo)) return false;
      if (f.escuela && !cs.some(c => normalizar(c.escuela) === normalizar(f.escuela))) return false;
    }
    if (f.sinClasificar && (r.tipoRecurso && r.temaIds.length && r.grados.length)) return false;
    if (palabras.length) {
      const t = textoRecurso(r, ix);
      if (!palabras.every(p => t.includes(p))) return false;
    }
    return true;
  });
}

export function ordenar(recursos, criterio = 'reciente') {
  const copia = [...recursos];
  if (criterio === 'titulo') copia.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
  else copia.sort((a, b) => (b.actualizadoEn || '').localeCompare(a.actualizadoEn || ''));
  return copia;
}

/** Valores presentes para llenar los filtros con lo que realmente existe. */
export function facetas(datos) {
  const ciclos = new Set(), escuelas = new Set(), asignaturas = new Set(), campos = new Set();
  for (const c of datos.contextos) { if (c.ciclo) ciclos.add(c.ciclo); if (c.escuela) escuelas.add(c.escuela); }
  for (const r of datos.recursos) { r.asignaturas.forEach(a => asignaturas.add(a)); r.camposFormativos.forEach(c => campos.add(c)); }
  const ord = s => [...s].sort((a, b) => a.localeCompare(b, 'es'));
  return { ciclos: ord(ciclos).reverse(), escuelas: ord(escuelas), asignaturas: ord(asignaturas), campos: ord(campos) };
}

/** Lunes de la semana de una fecha AAAA-MM-DD. */
export function lunesDe(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  const dia = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dia);
  return d.toISOString().slice(0, 10);
}

/**
 * Vista temporal: ciclo › mes › semana › usos.
 * Usa la fecha aplicada; si no existe, la prevista (y lo marca). Los usos sin fecha van aparte.
 */
export function agruparPorTiempo(contextos, { ciclo = '' } = {}) {
  const ciclos = new Map();
  const sinFecha = [];
  for (const c of contextos) {
    const fecha = c.fechaAplicada || c.fechaPrevista;
    const cic = c.ciclo || cicloDeFecha(fecha);
    if (ciclo && cic !== ciclo) continue;
    if (!fecha) { sinFecha.push(c); continue; }
    const mesClave = fecha.slice(0, 7);
    const sem = lunesDe(fecha);
    if (!ciclos.has(cic)) ciclos.set(cic, new Map());
    const meses = ciclos.get(cic);
    if (!meses.has(mesClave)) meses.set(mesClave, new Map());
    const semanas = meses.get(mesClave);
    if (!semanas.has(sem)) semanas.set(sem, []);
    semanas.get(sem).push({ ...c, fechaUsada: fecha, esPrevista: !c.fechaAplicada });
  }
  const res = [...ciclos.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([cic, meses]) => ({
    ciclo: cic || 'Sin ciclo',
    meses: [...meses.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([mes, semanas]) => ({
      mes,
      nombre: nombreMes(Number(mes.slice(5, 7)) - 1) + ' ' + mes.slice(0, 4),
      semanas: [...semanas.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([lunes, usos]) => ({
        lunes,
        usos: usos.sort((a, b) => a.fechaUsada.localeCompare(b.fechaUsada) || (a.ordenAplicado ?? a.ordenPrevisto ?? 0) - (b.ordenAplicado ?? b.ordenPrevisto ?? 0)),
      })),
    })),
  }));
  return { ciclos: res, sinFecha };
}

/** Candidatos a duplicado: mismo hash = exacto; mismo nombre y tamaño = probable. */
export function duplicadosDe({ hash, nombre, tamano }, archivos) {
  const exactos = hash ? archivos.filter(a => a.hash && a.hash === hash) : [];
  const ids = new Set(exactos.map(a => a.id));
  const probables = archivos.filter(a => !ids.has(a.id) && nombre && normalizar(a.nombre) === normalizar(nombre) && tamano != null && a.tamano === tamano);
  return { exactos, probables };
}
