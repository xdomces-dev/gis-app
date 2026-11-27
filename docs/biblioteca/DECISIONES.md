# Decisiones

Dos listas separadas. Una propuesta pasa a «aprobada» solo cuando César lo dice; se anota la fecha.

## Aprobadas por César

Tomadas de sus instrucciones del 2026-11-27.

| ID | Decisión | Motivo |
|---|---|---|
| D-01 | Nombre provisional «Biblioteca Pedagógica»; el definitivo después. | — |
| D-02 | Ciclo inicial de recuperación: 2026–2027. Ciclos anteriores después. | Empezar por lo más reciente y accesible. |
| D-03 | Decimales **no** es piloto por defecto. El piloto se elige después del inventario. | Matemáticas genera pocos archivos (libreta y pintarrón). Pocos archivos ≠ poco trabajo. |
| D-04 | Aplicación web propia, computadora y teléfono, inicio de sesión personal, nube con Firebase. | — |
| D-05 | Drive es fuente opcional de importación, no almacén principal ni requisito. | Carga y organización desde la propia biblioteca. |
| D-06 | No forzar la app en un solo archivo HTML. | Mantenimiento y crecimiento. |
| D-07 | El repositorio de código no es almacén obligatorio de materiales. | — |
| D-08 | «Publicado en mi biblioteca» = incorporado a la biblioteca privada. | — |
| D-09 | No borrar originales, borradores ni versiones. La última versión no es automáticamente la mejor. | Patrimonio y trazabilidad. |
| D-10 | No importar datos personales de alumnos para inventariar materiales. | Protección de menores. |
| D-11 | Trabajo por fases; al cerrar cada una, esperar indicación. Sin servicios de pago sin autorización. | — |
| D-12 | (2026-11-27, antes P-06) El inventario de la Fase 2 se hace con **Claude Code en las computadoras de César** (laptop de la escuela y Leviatan), en modo solo lectura. | Los archivos están ahí; no salen del equipo para inventariarse. |
| D-13 | (2026-11-27, antes P-05) El inventario se guarda en un **repositorio privado nuevo** de GitHub, no en `gis-app` (público). | Rutas y nombres pueden contener datos de menores; el repo privado se sincroniza entre ambas computadoras. |

## Propuestas (pendientes de aprobación)

| ID | Propuesta | Motivo | Estado |
|---|---|---|---|
| P-01 | Biblioteca como **aplicación conectada** a GIS, no como módulo dentro de `public/index.html`. | Ver `GIS-CONEXION.md`. | Pendiente |
| P-02 | Código en carpeta `biblioteca/` de este repo; HTML + módulos JS/CSS sin bundler. | Mismo estilo de trabajo que GIS, sin romper su deploy. | Pendiente |
| P-03 | Firebase Auth + Firestore + Storage; segundo sitio de Hosting. Proyecto: mismo `docenteappd` o nuevo (Q3). | Ver `ARQUITECTURA.md`. | Pendiente (Q3) |
| P-04 | Activar plan Blaze **solo** con alerta de presupuesto y autorización explícita, cuando inicie la Fase 3. | Storage lo exige desde 2026-02-03. | Pendiente |
| P-05 | → Aprobada como D-13. | | Aprobada |
| P-06 | → Aprobada como D-12. | | Aprobada |
| P-07 | Reglas de Firestore y Storage de la biblioteca limitadas al UID de César. | GIS permite registrar cuentas nuevas; sin esto, cualquiera podría subir archivos. | Pendiente |
| P-08 | HTML importado: almacenar, descargar, vista previa y actividad publicada como cuatro modos distintos; vista previa en `iframe` sandbox desde otro origen. | Que un HTML no se ejecute con los privilegios de la app. | Pendiente |
