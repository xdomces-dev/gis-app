# Estado actual

**Fase:** esqueleto y programación hechos por orden de César (2026-11-27). La app funciona en **modo local** (este navegador). **No** se ha activado la nube ni se han buscado archivos.
**Última actualización:** 2026-11-27.

## Qué existe hoy

- App en `biblioteca/` (ver `biblioteca/README.md`): catálogo, búsqueda y filtros cruzados, ficha mínima, versiones con estados y evidencia, elegir versión sin borrar, correcciones, adaptaciones y propuestas derivadas, usos en clase con fecha prevista/aplicada, vista temporal, temas (con los 140 de GIS), colecciones y proyectos, criterios versionados, respaldo ZIP que se abre sin la app, importación sin duplicados, vista previa aislada de HTML.
- Herramientas para Claude Code: `inventario.mjs` (Fase 2, solo lectura) y `empaquetar.mjs` (publicación, ver `PUBLICACION.md`).
- Reglas de Storage probadas en el emulador; propuesta de reglas de Firestore (no aplicada).
- Pruebas: 27 unitarias, flujo completo en Chromium (escritorio y teléfono), modo nube contra emuladores.

## Siguiente paso concreto

César elige uno:
1. **Probar la app en modo local**: `cd biblioteca && python3 -m http.server 5180 --directory app`, abrir <http://localhost:5180>.
2. **Buscar archivos (Fase 2)**: en cada computadora, `git pull` y pedir a Claude Code el inventario con la ruta de la carpeta 2026–2027. Antes, crear el repo privado del inventario.
3. **Decidir la nube (Q3 + Blaze)** para usarla desde el teléfono y con archivos en Storage.

## Preguntas abiertas

| ID | Pregunta | Bloquea |
|---|---|---|
| Q1 | **Respondida en parte (2026-11-27):** los materiales están en las computadoras; el inventario se hará con Claude Code local. **Falta:** rutas exactas y otras ubicaciones (Descargas, archivos de WhatsApp). | Fase 2 |
| Q2 | Los «niveles de gradualidad» no están en el código de GIS. ¿Dónde viven? (La app ya tiene un campo libre «Gradualidad o dificultad».) | Ajustar ese campo |
| Q3 | ¿Biblioteca en el mismo proyecto Firebase de GIS (`docenteappd`) o en uno nuevo? ¿Activar Blaze (tarjeta, con alerta de presupuesto) para Storage? | Uso en la nube y en el teléfono |
| Q4 | **Respondida (2026-11-27):** inventario en un **repo privado nuevo**. **Falta:** que César lo cree. | Fase 2 |

## Bloqueos

- Nube: sin decisión Q3 ni autorización de Blaze. Sin acceso a la consola de Firebase (región del bucket y plan sin verificar).
- Archivos: la sesión en la nube no ve las computadoras de César; la Fase 2 se hace con Claude Code local.
- Falta el repo privado del inventario.

## Lo que NO se ha hecho (a propósito)

- No se desplegó nada ni se activaron servicios de pago.
- No se modificó GIS (`public/`) ni `firestore.rules`.
- No se buscaron ni movieron archivos de César.
- No se eligió colección piloto.

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

### Sesión 2 — 2026-11-27 (Claude Code, nube)

César: «Haz todo el esqueleto y planeación; ya luego buscamos los archivos; haz toda la programación».

**Terminado**
- App completa en `biblioteca/` con almacén local (IndexedDB) y almacén Firebase listo (desactivado).
- Herramientas `inventario.mjs` y `empaquetar.mjs`. Formato de paquete de publicación (`PUBLICACION.md`).
- `storage.rules`, propuesta `firestore-biblioteca.rules`, `firebase.json` (sitio pendiente), `cors.json`.

**Comprobado**
- `npm test`: 27/27 (modelo, catálogo, versiones, derivadas, idempotencia y reanudación, ZIP, respaldo, paquetes, inventario).
- `tests/e2e.mjs` en Chromium: guardar con 3 archivos, HTML aislado, elegir versión, duplicados, búsqueda, temas de GIS, vista temporal, persistencia, respaldo ZIP, paquete sin duplicar, teléfono 390 px sin desbordes, sin errores de JS.
- `tests/nube/correr.sh` con emuladores: reglas de Storage 9/9 (incluye no sobrescribir, no borrar, otra cuenta rechazada) y flujo completo en modo nube.
- Las pruebas encontraron y se corrigieron: reintento que duplicaba, pantalla que no se refrescaba tras una ventana, resultado de importación que se borraba, desborde en teléfono, sobrescritura permitida en Storage, paquete que podía declararse «de César».

**No comprobado**
- El proyecto real de Firebase (no se desplegó). CORS del bucket real. Rendimiento con miles de archivos reales.

**Siguiente paso:** el que elija César en «Siguiente paso concreto».
