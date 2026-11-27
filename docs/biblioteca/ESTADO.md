# Estado actual

**Fase:** 1 — Diagnóstico y definición (documentación lista; esperando respuestas de César).
**Última actualización:** 2026-11-27.

## Siguiente paso concreto

César responde Q1, Q2 y Q4. Con eso se prepara la Fase 2 (inventario de solo lectura del ciclo 2026–2027).
Q3 puede esperar hasta antes de la Fase 3.

## Preguntas abiertas

| ID | Pregunta | Bloquea |
|---|---|---|
| Q1 | ¿Dónde está la carpeta 2026–2027 (equipo y ruta) y qué otras ubicaciones esenciales hay (Descargas, carpeta de WhatsApp, repos)? ¿Cómo prefieres dar acceso: Claude Code en tu computadora (recomendado), carpeta compartida por Remote Control desde la app de escritorio, o subir a Drive? | Fase 2 |
| Q2 | Los «niveles de gradualidad» de Gestión Pedagógica no están en el código de GIS. ¿Dónde viven: otra versión sin subir a GitHub, el libro de planeación Teocalli, papel? | Diseño de la vista temática |
| Q3 | ¿Biblioteca en el mismo proyecto Firebase de GIS (`docenteappd`) o en uno nuevo? ¿Estás dispuesto a activar Blaze (tarjeta, con alerta de presupuesto) para Storage? | Fase 3 |
| Q4 | El repo `gis-app` es **público**. ¿Dónde guardamos el inventario: un repo privado nuevo, o solo en tu computadora? (Otra opción: volver privado `gis-app`; afectaría a quien hoy lo consulte.) | Fase 2 |

## Bloqueos

- Sin acceso a las computadoras de César desde esta sesión (no hay carpetas compartidas).
- Sin acceso a la consola de Firebase (región del bucket y plan actual sin verificar).

## Alcance inicial propuesto

**Dentro:**
- Fase 2: inventario de solo lectura del ciclo 2026–2027 en las ubicaciones que indique César; resumen y propuesta de piloto.
- Fase 3: app mínima — inicio de sesión, subir archivo con ficha mínima, búsqueda y filtros básicos, vista previa de imágenes y PDF, descarga, reglas por UID con pruebas.

**Fuera (por ahora):** ciclos anteriores (VGF), bibliotecario con IA dentro de la app, publicación conectada, cambios en GIS, importación desde Drive.

---

## Bitácora de sesiones

### Sesión 1 — 2026-11-27 (Claude Code, nube)

**Terminado**
- Revisión del repo `gis-app`: instrucciones, especificación, pendientes, reglas, configuración y materiales de clase.
- Revisión del código de Gestión Pedagógica (`GIS-CONEXION.md`).
- Verificación de requisitos y costos de Firebase en documentación oficial (`ARQUITECTURA.md`).
- Documentación de la Fase 1 en `docs/biblioteca/`.

**Comprobado**
- El repo es público (`list_repos`: visibility public).
- No hay carpetas de las computadoras de César compartidas con la sesión.
- Storage exige Blaze desde 2026-02-03 (documentación oficial).
- Gestión Pedagógica no tiene grados, gradualidad, subtemas ni proyectos en el código.
- «Exportar datos» de GIS no incluye `contenidos`.

**Pendiente:** respuestas Q1–Q4; aprobación o ajuste de las propuestas P-01 a P-08.

**Bloquea:** Q1 y Q4 (ubicación, acceso y dónde guardar el inventario).

**Siguiente paso:** con Q1 y Q4 resueltas, diseñar el script de inventario de solo lectura y ejecutarlo donde estén los archivos.
