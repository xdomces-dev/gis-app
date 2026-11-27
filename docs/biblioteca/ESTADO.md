# Estado actual

**Fase:** 1 — Diagnóstico y definición (documentación lista; Q1 y Q4 respondidas en parte; faltan rutas y el repo privado).
**Última actualización:** 2026-11-27.

## Siguiente paso concreto

1. César crea en GitHub un **repositorio privado** para el inventario (nombre sugerido: `biblioteca-inventario`). Claude no puede crear repositorios desde la sesión en la nube.
2. César indica las **rutas** de la carpeta 2026–2027 en cada computadora (laptop de la escuela y Leviatan).
3. Con la indicación de César de pasar a la Fase 2: en cada computadora, abrir Claude Code dentro de `gis-app` (tras `git pull`), pedir «Fase 2 de la biblioteca» y dar la ruta. El inventario es de solo lectura y se guarda en el repo privado, nunca en `gis-app`.

Q2 (gradualidad) puede responderse durante la Fase 2. Q3 puede esperar hasta antes de la Fase 3.

## Preguntas abiertas

| ID | Pregunta | Bloquea |
|---|---|---|
| Q1 | **Respondida en parte (2026-11-27):** los materiales están en las computadoras (laptop de la escuela y Leviatan); el inventario se hará con Claude Code local. **Falta:** rutas exactas y otras ubicaciones esenciales (Descargas, archivos de WhatsApp). | Fase 2 |
| Q2 | Los «niveles de gradualidad» de Gestión Pedagógica no están en el código de GIS. ¿Dónde viven: otra versión sin subir a GitHub, el libro de planeación Teocalli, papel? | Diseño de la vista temática |
| Q3 | ¿Biblioteca en el mismo proyecto Firebase de GIS (`docenteappd`) o en uno nuevo? ¿Estás dispuesto a activar Blaze (tarjeta, con alerta de presupuesto) para Storage? | Fase 3 |
| Q4 | **Respondida (2026-11-27):** el inventario va en un **repo privado nuevo**. **Falta:** que César lo cree. | Fase 2 |

## Bloqueos

- Sin acceso a las computadoras de César desde la sesión en la nube (no hay carpetas compartidas). Resuelto por método: la Fase 2 corre en Claude Code local.
- Falta el repo privado del inventario.
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

**Actualización (misma sesión):** César respondió: materiales en las computadoras; inventario con Claude Code local; inventario en repo privado nuevo. Se aprobaron P-05 y P-06 (ver `DECISIONES.md`). Faltan rutas y crear el repo privado.
