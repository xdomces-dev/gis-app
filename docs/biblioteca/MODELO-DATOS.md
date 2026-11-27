# Modelo de información — borrador v0

Estado: **borrador para discutir.** Se ajusta con lo que aparezca en el inventario (Fase 2) y se fija en la Fase 3.

## Principios

1. **Identificadores estables** generados por la biblioteca (no el nombre del archivo). El nombre del archivo es un dato más.
2. **Ficha mínima**: para registrar un recurso basta título + un archivo o enlace. Todo lo demás se completa después.
3. **Procedencia de cada dato clasificatorio**: quién lo puso y con qué evidencia. Así se puede corregir sin perder la historia.
4. **Nada se borra**: los registros se marcan (sustituido, archivado), no se eliminan.
5. **Sin datos de alumnos** en el catálogo.

## Dato con procedencia

Los campos que pueden ser inferidos (tema, grado, fecha de aplicación, tipo, etc.) se guardan así:

```js
{ valor: 'Historia', origen: 'cesar' | 'ia' | 'archivo' | 'gis' | 'inferido', evidencia: 'texto o referencia', fecha: '2026-11-27' }
```

`origen: 'cesar'` es el único que cuenta como confirmado.

## Entidades

| Entidad | Qué representa | Campos clave (mínimos en **negrita**) |
|---|---|---|
| **Recurso** | Una propuesta pedagógica tangible (un cuadernillo, una rúbrica, un juego). | **id**, **titulo**, tipoRecurso, usos[], temaIds[], gradoIds[], coleccionIds[], proyectoIds[], estadoRevision, versionElegidaId, notas |
| **Versión** | Un intento o edición concreta del recurso. | **id**, **recursoId**, numero, estado, relacion, origenIds[], consigna, cambios, creadoEn, evidenciasEleccion[] |
| **Archivo** | Un archivo físico de una versión: editable, PDF, miniatura… | **id**, **versionId**, **rol** (editable, final, miniatura, vista previa, fuente), formato, tamaño, hash, rutaStorage o enlace |
| Colección | Conjunto con identidad propia (p. ej. cuadernillos VGF). Puede tener criterios propios. | id, nombre, descripcion, criteriosIds[] |
| Proyecto | Proyecto interdisciplinario que agrupa recursos. | id, nombre, temaIds[], recursoIds[] |
| Tema | Nodo temático (campo formativo › asignatura › bloque › tema › subtema). | id, nombre, nivel, padreId, relacionadosIds[], vinculoGis |
| Contexto de uso | Dónde y cuándo se usó: escuela, ciclo, grupo/grados, periodo, semana, día. | id, recursoId, versionId, escuela, ciclo, grados[], fechaPrevista, fechaAplicada, modalidad, notasClase |
| Secuencia | Orden de recursos/actividades para un ciclo; reordenable sin tocar ciclos anteriores. | id, ciclo, pasos[{recursoId, versionId, orden, fechaPrevista}] |
| Guía / criterio | Reglas de diseño o metodológicas, versionadas. | id, ambito (general / colección), version, texto, vigenteDesde |
| Fuente de origen | De dónde llegó: carpeta, conversación, herramienta, WhatsApp. | id, tipo, descripcion, ruta, accesible, consultadaEn |
| Nota / decisión | Comentarios, decisiones de diseño, por qué se eligió una versión. | id, sobreTipo, sobreId, autor (cesar / ia), texto, fecha |
| Importación | Registro de cada lote o publicación, para reanudar sin duplicar. | id, claveIdempotencia, estado, archivosOk[], archivosFallidos[] |

## Distinciones obligatorias

**Qué es / formato / uso** son campos distintos:
- `tipoRecurso`: rúbrica, cuadernillo, presentación, juego, ejemplo, recortable…
- `formato`: va en cada **Archivo** (PNG, PDF, PPTX, HTML…).
- `usos[]`: imprimir, proyectar, WhatsApp, trabajo autónomo… (varios a la vez).

**Estado de una versión** (`estado`):
- `elegida_cesar` — solo con evidencia de César (aprobación explícita, uso en clase registrado por él).
- `recomendada_ia` — propuesta justificada, no aprobada.
- `borrador`
- `sustituida` — se conserva y se puede recuperar.
- `pendiente_revision`

**Relación de una versión con otras** (`relacion`):
- `correccion` — mismo recurso, se corrige un error.
- `adaptacion` — mismo recurso, otro contexto (grado, escuela, formato).
- `derivada` — **recurso nuevo** creado a partir de uno o varios (`origenIds[]`), con su consigna de transformación y qué cambió.

**Fechas**: `fechaCreacionArchivo` (del sistema) ≠ `fechaAplicada` (en clase) ≠ `fechaPrevista`. Lo desconocido se guarda como desconocido, no se rellena.

## Ubicación tentativa en Firestore

```
users/{uid}/biblioteca/...   (o un proyecto Firebase aparte; ver Q3)
  recursos/{recursoId}
  recursos/{recursoId}/versiones/{versionId}
  archivos/{archivoId}
  temas/{temaId}
  colecciones/{id}  proyectos/{id}  contextos/{id}  secuencias/{id}
  criterios/{id}  fuentes/{id}  notas/{id}  importaciones/{id}
```

Archivos en Storage: `biblioteca/{uid}/{recursoId}/{versionId}/{archivoId}.{ext}`.
