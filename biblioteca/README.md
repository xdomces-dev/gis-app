# Biblioteca Pedagógica — aplicación

App web de la biblioteca personal de materiales docentes. Visión, reglas, decisiones y estado: [`../docs/biblioteca/`](../docs/biblioteca/README.md).

Está **separada de GIS**: no toca `public/` ni el deploy de GIS. HTML + módulos JS + CSS, sin bundler ni dependencias en producción.

## Cómo probarla ya (modo local, sin servicios)

```bash
cd biblioteca
python3 -m http.server 5180 --directory app     # o: npm run servir
```

Abrir <http://localhost:5180>. Los datos se guardan **solo en ese navegador** (IndexedDB). Para no perderlos: **Respaldo › Respaldo completo (ZIP)**.

## Qué hace

| Pantalla | Qué permite |
|---|---|
| Catálogo | Buscar en título, temas, archivos, consignas, notas y usos; filtros cruzados (tipo, formato, uso, grado, asignatura, campo, tema, colección, ciclo, escuela, estado de versión, por clasificar); miniaturas; seleccionar materiales para combinarlos |
| Agregar | Ficha mínima (solo el título es obligatorio), varios archivos y enlaces por versión con su rol (final, editable, miniatura…), aviso de duplicados por huella SHA-256 antes de guardar |
| Ficha del recurso | Datos con su procedencia (✓ confirmado por César / ? propuesto o inferido), versiones con estado y evidencia, elegir versión (la anterior queda «sustituida», nunca se borra), corregir o adaptar, vista previa, abrir, descargar, imprimir, usos en clase (fecha prevista ≠ aplicada ≠ fecha del archivo), notas y decisiones, propuestas derivadas |
| Combinar | Propuesta **derivada**: recurso nuevo que guarda sus materiales de origen, la consigna de transformación y qué cambió |
| Vista temporal | Ciclo › mes › semana, según la fecha aplicada (o prevista, marcada) |
| Temas | Árbol campo › asignatura › bloque › tema › subtema; botón para traer los 140 temas de Gestión Pedagógica (GIS) con vínculo |
| Colecciones | Colecciones, proyectos y propuestas metodológicas |
| Criterios | Criterios de diseño versionados (editar crea versión nueva) |
| Respaldo | Estado de la recuperación; ZIP completo que se abre sin la app; importar respaldos o paquetes de publicación sin duplicar |

## Seguridad de los HTML importados

- Nunca se insertan en la página de la biblioteca.
- La vista previa usa `<iframe sandbox="allow-scripts …">` **sin** `allow-same-origin`: el HTML corre en un origen opaco y no puede leer la sesión, IndexedDB, Firestore ni Storage. Probado en `tests/e2e.mjs`.
- La descarga se entrega como archivo; en Storage se guardan con `Content-Disposition: attachment`.
- Pendiente (Fase 8): publicar actividades para alumnos en un sitio aparte con otro origen.

## Estructura

```
biblioteca/
  app/                    lo que se publicaría (Firebase Hosting, sitio aparte)
    index.html, css/app.css
    js/config.js          backend ('local' hoy), OWNER_UID, configuración pública de Firebase
    js/modelo.js          modelo de datos (funciones puras)
    js/busqueda.js        búsqueda, filtros, vista temporal, duplicados
    js/catalogo.js        operaciones (registrar, versionar, derivar, importar, exportar)
    js/store/             almacenes con la misma interfaz: local (IndexedDB), firebase, memoria (pruebas)
    js/zip.js, respaldo.js, vista-previa.js
    js/ui/                pantallas
    js/datos/             temas de GIS (copia) y criterios v1
  herramientas/
    inventario.mjs        inventario de SOLO LECTURA de carpetas (Fase 2)
    empaquetar.mjs        crea paquetes de publicación (ver docs/biblioteca/PUBLICACION.md)
  tests/                  pruebas (node:test), e2e en Chromium, pruebas en la nube con emuladores
  storage.rules           reglas de Storage (UID_DE_CESAR por reemplazar)
  firestore-biblioteca.rules  PROPUESTA de reglas de Firestore (no aplicada)
  firebase.json, .firebaserc, cors.json
```

## Pruebas

```bash
cd biblioteca
npm test                      # 26 pruebas: modelo, catálogo, versiones, derivadas, ZIP, respaldo, paquetes, herramientas
node tests/e2e.mjs            # flujo completo en Chromium (modo local), HTML aislado, teléfono 390 px
bash tests/nube/correr.sh     # modo nube contra emuladores de Firebase (requiere Java); reglas de Storage + flujo
```

## Herramientas para Claude Code

```bash
# Inventario (Fase 2): solo lectura; la salida NO puede quedar en este repo público
node herramientas/inventario.mjs --raiz "D:\Escuela\2026-2027" --salida "C:\biblioteca-inventario\laptop" --equipo laptop

# Paquete de publicación
node herramientas/empaquetar.mjs --titulo "Juego del cuerpo humano" --tipo juego --grados 1 --salida ./paquetes juego.html portada.png:miniatura
```

## Activar la nube (NO hecho; requiere autorización de César)

Decisiones pendientes: Q3 (mismo proyecto `docenteappd` o uno nuevo) y P-04 (plan Blaze para Storage). Pasos, cuando se autoricen:

1. Activar Blaze con alerta de presupuesto; crear o verificar el bucket (región con cuota sin costo: `us-central1`, `us-east1` o `us-west1`).
2. Reemplazar `UID_DE_CESAR` en `storage.rules` y poner el mismo UID en `app/js/config.js` (`OWNER_UID`).
3. Crear el sitio de Hosting (`firebase hosting:sites:create <nombre>`) y ponerlo en `firebase.json` (`SITIO_PENDIENTE`).
4. Poner ese dominio en `cors.json` y aplicarlo: `gsutil cors set cors.json gs://<bucket>` (lo necesitan la vista previa de HTML, la descarga y el respaldo).
5. Cambiar `backend` a `'firebase'` en `app/js/config.js`.
6. Desde `biblioteca/`: `firebase deploy --only storage,hosting` (después de `git push`, como indica CLAUDE.md).
7. Opcional: aplicar `firestore-biblioteca.rules` (toca las reglas de GIS; probar con el emulador antes).
8. Pasar los datos del modo local: Respaldo › ZIP en modo local → Importar en modo nube.
