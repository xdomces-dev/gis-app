## Proyecto: GIS — Sistema de Registro Docente

### Qué es
GIS (antes DocenteApp) es una herramienta personal del maestro César para gestionar su aula de Telesecundaria multigrado (1°, 2° y 3°) en la escuela Teocalli. No es un SaaS ni un producto comercial — es un expediente docente digital de uso exclusivamente personal.

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
2. **Diagnóstico en pantalla Inicio** — resumen del nivel diagnóstico del grupo
3. Ajustes y bugs que surjan en el ciclo escolar real 2026-2027

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
