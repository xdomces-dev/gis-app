## Proyecto: GIS — Sistema de Registro Docente

### Qué es
GIS (antes DocenteApp) es una herramienta personal del maestro César para gestionar su aula de Telesecundaria multigrado (1°, 2° y 3°) en la escuela Teocalli. Hoy es de uso personal (ciclo 2026-2027), pero es además el **objeto de estudio de su tesis doctoral** (Doctorado en Gestión Educativa, CINADE; investigación-acción) y a futuro se busca venderla. La retroalimentación del piloto de la tesis guía el producto.

### Tesis doctoral (contexto)
- Pregunta: ¿en qué medida GIS flexibiliza los procesos administrativos de una telesecundaria multigrado rural, y en qué casos solo digitaliza su rigidez?
- Cap. I (Diagnóstico + FODA) entregado y calificado 100/100 (2026-10-18). Asesor: Dr. Jaime Domínguez Muñoz. Recomendaciones: portada CINADE y **anonimizar nombres de menores en capturas**.
- Alternativas de la tesis que tocan la app: 1) registro único con varias salidas; 2) planeación por Temas Generadores ligada a evaluación; 3) asistencia con motivo y recuperación; 4) **panel de director y vista de supervisión**; 5) continuidad (manual, respaldo, protección de datos).
- Datos de menores: nunca dar acceso a la cuenta real a terceros; usar el modo privado (👁️) o datos ficticios.

**Deploy**: https://docenteappd.web.app
**Deploy cmd**: `firebase deploy --only hosting`
**Archivo principal**: `public/index.html` (~8,500+ líneas, single-file app)

### Tecnología
- **Frontend**: Vanilla JS + HTML/CSS — single file, sin bundler
- **Backend**: Firebase Auth + Firestore v10.12.0 (CDN)
- **Hosting**: Firebase Hosting (proyecto: `docenteappd`)
- **Sin frameworks**: sin React, sin Node en producción

> Nota: La API key de Firebase en `index.html` es pública por diseño (modelo de seguridad Firebase). La seguridad real está en `firestore.rules`.

### Estado actual (2026-08-26)
Funcionalidades completadas:
- Asistencia diaria (A/F/R/J) con historial completo
- Tareas con estados (entregó / no entregó / incompleta)
- Evaluaciones: diagnóstico (lectura, comprensión, matemáticas, escritura, expresión oral), formativo, sumativo, examen, proyecto, oral, participación
- Puntos de conducta + bitácora de incidentes/logros/citatorios
- Perfil de alumno con tabs: Datos | Bitácora | Diagnóstico
- Constancias imprimibles (estudios, calificaciones, conducta, traslado, beca)
- Estadísticas del grupo: tendencia semanal, faltas por día, comparativo por grupo, diagnóstico por área
- Calendario escolar SEP 2025-2027 con eventos CTE y festivos
- Sistema multi-ciclo y multi-grupo (`cicloActivo`, `grupoActivo`, master arrays)
- Expediente familiar (padre, madre, teléfonos, NEE)
- `isPremium()` retorna `true` siempre — sin gates comerciales

### Diseño: Sistema Pizarrón Escolar
Leer siempre `DESIGN.md` antes de cualquier decisión visual. Resumen:
```css
--font-display: 'Syne'      /* headings */
--font: 'DM Sans'           /* body */
--font-mono: 'DM Mono'      /* datos numéricos */
--accent: #204b3a           /* verde pizarrón */
--gis-bg: #2a4728           /* sidebar */
--chalk: #f0c435            /* tiza amarilla — solo en fondos oscuros */
```
Regla crítica: opacidades mínimas 0.70. Serif italic rechazada.

### Sistema por grado (colores + orden de lista) — aplicar en TODA pantalla nueva
- **Colores**: 1° azul `#2563eb`, 2° ámbar `#c9820a`, 3° morado `#7c3aed` (`GRADE_COLORS`, `gradeColorOf(g)`; `gradeColorNum('1')` para claves numéricas).
- **Orden de lista**: `ALUMNOS` ya viene ordenado desde `aplicarFiltrosCicloGrupo` (grado y luego apellido, vía `ordenLista`). No reordenar alfabéticamente por nombre.
- **Helpers**: `gridPorGrado(card,{wrap,cls})` tarjetas con encabezado por grado · `filaGrado(g,cols)` fila de grado en tablas · `gradoChip(g)` etiqueta de color junto al nombre · `subtabsGradoHTML` subpestañas Multigrado | 1° | 2° | 3° · `renderHistorial` historiales agrupados por día/semana con "Ver más".

### Firestore paths
```
/users/{uid}/perfil/datos     → escuelaData, cicloActivo, ciclos[]
/users/{uid}/alumnos/         → datos personales del alumno
/users/{uid}/asistencias/     → {alumno, fecha, estado, campo, ciclo}
/users/{uid}/tareas/          → {alumno, fecha, campo, estado, ciclo}
/users/{uid}/evaluaciones/    → {alumno, fecha, tipo, nombre, cal, subtipo?, ciclo}
/users/{uid}/puntos/          → {alumno, fecha, tipo, categoria, valor, ciclo}
/users/{uid}/bitacora/        → {alumno, fecha, tipo, texto, ciclo}
```

### Pendientes
1. **Plan Analítico** — módulo para el documento SEP que se entrega al supervisor. Bloqueado hasta que César defina la estructura con la nueva escuela Teocalli. Referencia local: `Downloads/Libro_Planeacion_Anual_Teocalli.docx`
2. ~~Diagnóstico en pantalla Inicio~~ — hecho (resumen de diagnóstico del grupo en Inicio).
3. Ajustes y bugs que surjan en el ciclo escolar real 2026-2027
4. **Respaldos automáticos** de Firestore (datos sensibles de menores: CURP, médicos, NEE). Hoy solo existe "Exportar datos" manual. — siguiente en la lista (2026-09-25)
5. **Limpiar código comercial sin uso** (planes/trial/candados, panel directivo, app supervisor): ~230 referencias.
6. A futuro: separar CSS/JS del `index.html` (~9,800 líneas) y agregar pruebas básicas.
7. **Rol observador / supervisor (solo lectura)** — ligado a la Alternativa 4 de la tesis y al piloto del Cap. IV: usuario que ve datos sin editar, reglas de Firestore que lo garanticen y nombres anonimizados. Pendiente.
8. **Cuenta demo con datos ficticios** para mostrar la app al asesor / colegas sin exponer menores. Pendiente.

### Modo privado (ojito 👁️)
Botón en la barra superior (`toggleModoAnon`). Muestra alumnos como "Alumno 01…" (número de lista) y oculta tutores, teléfonos, CURP, dirección, notas médicas y NEE. Solo cambia la vista; no toca Firestore. Preferencia por dispositivo en `localStorage['gis-anon']`. En Configuración > Alumnos bloquea la edición mientras está activo.
**En pantallas nuevas**: mostrar nombres siempre con `fmtNombre(n)` / `nomV(n)` / `initials(n)` y datos sensibles con `datoV(v)`; nunca `a.n` directo. Si la pantalla se dibuja una vez y se guarda, agregar su render a `toggleModoAnon`.

### Nota técnica
Funciones llamadas desde `onclick`/`onchange` en el HTML deben ser globales: definirlas como `window.fn=function…` o agregarlas al `Object.assign(window,{…})` al final del `<script type="module">`. Si no, fallan con ReferenceError.

### Flujo multi-máquina (laptop escuela ↔ Leviatan casa)
`git pull` al empezar · commit + `git push` al terminar · `firebase deploy --only hosting` SOLO después del push (nunca publicar sin subir a GitHub).

### Skill routing
Cuando el request del usuario coincida con un skill disponible, invocarlo vía Skill tool:
- Product ideas/brainstorming → `/office-hours`
- Strategy/scope → `/plan-ceo-review`
- Arquitectura → `/plan-eng-review`
- Diseño → `/design-consultation` o `/plan-design-review`
- Review completo → `/autoplan`
- Bugs/errores → `/investigate`
- QA → `/qa` o `/qa-only`
- Code review → `/review`
- Pulido visual → `/design-review`
- Ship/deploy → `/ship` o `/land-and-deploy`
- Guardar contexto → `/context-save`
- Restaurar contexto → `/context-restore`
- Spec/issue → `/spec`
