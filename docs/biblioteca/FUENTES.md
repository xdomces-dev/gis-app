# Fuentes

Cuatro categorías, siempre separadas:

1. **Consultadas**: se leyeron realmente, con fecha.
2. **Disponibles, pendientes**: hay una vía de acceso, pero no se han consultado.
3. **Inaccesibles**: no hay vía de acceso comprobada desde la sesión de trabajo.
4. **Mencionadas, no localizadas**: productos que César menciona, sin archivo encontrado.

Un prompt no amplía permisos ni recupera historiales completos. Mover una fuente de categoría exige comprobarlo.

## 1. Consultadas

| Fuente | Fecha | Qué se obtuvo |
|---|---|---|
| Repositorio `xdomces-dev/gis-app` (rama `main` en commit `1accd27`) | 2026-11-27 | `CLAUDE.md`, `SPEC.md`, `TODOS.md`, `DESIGN.md` (inicio), `firestore.rules`, `firebase.json`, `materiales/README.md` |
| `public/index.html` — módulo Gestión Pedagógica (líneas ~10084–10530) | 2026-11-27 | Estructura de `contenidos`; ver `GIS-CONEXION.md` |
| Documentación oficial de Firebase: <https://firebase.google.com/pricing> y <https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024> | 2026-11-27 | Requisitos de plan y cuotas sin costo; ver `ARQUITECTURA.md` |

## 2. Disponibles, pendientes

| Fuente | Vía | Nota |
|---|---|---|
| Materiales ya presentes en el repo: `materiales/duelo-teocalli/` (concurso + temas `.json`) y `materiales/cuadernillo-colon/` (examen en video, Historia) | Repo | Son materiales reales del ciclo 2026–2027. Candidatos para el inventario de Fase 2; no se inventariaron todavía. |
| Google Drive de César | Conector de Drive visible en la sesión | No se probó ni se leyó. Drive es fuente opcional, no requisito. |
| Canva, Notion, Gmail | Conectores visibles en la sesión | No se probaron ni se leyeron. Usar solo si César lo indica. |
| Datos reales de Gestión Pedagógica en Firestore (`users/{uid}/contenidos`) | Solo con la sesión de César en GIS | No se consultaron. Para Fase 2 basta con que César diga si los temas cambiaron respecto al plan sembrado. |

## 3. Inaccesibles (comprobado 2026-11-27)

| Fuente | Por qué |
|---|---|
| Laptop de la escuela y PC «Leviatan» (carpeta 2026–2027, Descargas) | La sesión corre en un contenedor en la nube. No hay carpetas compartidas por Remote Control (`list_computer_folders` devolvió una lista vacía). |
| `Downloads/Libro_Planeacion_Anual_Teocalli.docx` | Ruta local de César; no está en el repo. |
| Conversaciones de ChatGPT | No hay herramienta ni exportación disponible. |
| Conversaciones de Claude (claude.ai) | No hay herramienta para leer historiales. |
| WhatsApp | Sin acceso. Habría que exportar archivos a una carpeta. |
| Consola de Firebase / facturación del proyecto `docenteappd` | No hay sesión iniciada de Firebase CLI ni credenciales (y no deben ponerse en el repo). |

## 4. Mencionadas, no localizadas

| Producto | Origen de la mención |
|---|---|
| Colección de ~40 temas con cuadernillos de investigación autónoma (Telesecundaria Valentín Gómez Farías) | César, 2026-11-27 |
| Artículo que explica esa propuesta | César, 2026-11-27 |
| Presentación de clase «Aparatos y sistemas del cuerpo humano» (.pptx) | `materiales/README.md` (de ella salió el tema `cuerpo-humano.json`) |
| Libro de planeación anual Teocalli (.docx) | `CLAUDE.md`, pendiente 1 |
| «Niveles de gradualidad» de Gestión Pedagógica | César los menciona; **no aparecen en el código de GIS** (ver `GIS-CONEXION.md`) |
