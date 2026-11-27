# Arquitectura — propuesta preliminar

Estado: **propuesta, no aprobada.** Nada de esto está configurado. Se decide al iniciar la Fase 3.

## Principio

Empezar pequeño y que pueda crecer. Nada de frameworks pesados al inicio; tampoco un solo archivo gigante.

## Piezas propuestas

| Pieza | Propuesta | Motivo |
|---|---|---|
| Código | Carpeta `biblioteca/` en este repo, separada de `public/` (GIS) | No altera el deploy de GIS. HTML + varios módulos JS/CSS sin bundler, como GIS. |
| Acceso | Firebase Authentication (la misma cuenta de César en GIS) | Ya existe y no tiene costo. |
| Catálogo | Cloud Firestore: fichas, versiones, relaciones, temas, registros | Ya existe; plan sin costo suficiente para un catálogo personal. |
| Archivos | Cloud Storage for Firebase | Hecho para archivos grandes con reglas por usuario. **Requiere plan Blaze** (ver costos). |
| Alojamiento | Un segundo sitio de Firebase Hosting en el mismo proyecto (p. ej. `…-biblioteca.web.app`) | La app queda separada de GIS. |
| Servidor | Ninguno al inicio. Cloud Functions solo cuando haga falta una credencial privada (IA, publicación desde otras herramientas). | Functions también requiere Blaze; se evita mientras no aporte valor. |

**Pendiente de decidir (Q3):** mismo proyecto Firebase `docenteappd` o un proyecto nuevo solo para la biblioteca.
- Mismo proyecto: un solo inicio de sesión; pero activar Blaze cambia la facturación del proyecto donde también vive GIS.
- Proyecto nuevo: costos y datos totalmente separados de GIS; el vínculo con GIS sería solo por enlaces.

## Costos y requisitos verificados (documentación oficial, 2026-11-27)

Fuentes: <https://firebase.google.com/pricing> y <https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024>.

- **Cloud Storage for Firebase exige el plan Blaze** (pago por uso) desde el 3 de febrero de 2026. El bucket del proyecto es `docenteappd.firebasestorage.app` (formato nuevo).
- Cuota sin costo de buckets `*.firebasestorage.app`, solo en regiones `us-central1`, `us-east1`, `us-west1`: 5 GB-mes almacenados, 100 GB/mes de descarga, 5,000 subidas/mes, 50,000 descargas/mes. **No se verificó en qué región está el bucket** (requiere la consola).
- Firestore (plan sin costo): 1 GiB almacenado, 50,000 lecturas/día, 20,000 escrituras/día.
- Hosting (plan sin costo): 10 GB almacenados, 360 MB/día de transferencia. Por eso los archivos pesados no deben servirse desde Hosting.
- Cloud Functions: requiere Blaze.

Lectura: para una biblioteca personal es probable que el uso quepa en la cuota sin costo, **pero no es seguro**. Videos y presentaciones pesadas llenan rápido 5 GB. Blaze pide tarjeta. Antes de activarlo: alerta de presupuesto, revisar la región del bucket y autorización explícita de César.

Alternativa sin Blaze (a evaluar si César no quiere tarjeta): ficha en Firestore + archivo guardado en otro lugar (enlace a Drive, carpeta local). Pierde la ventaja de «todo desde la biblioteca».

## Cuatro formas de tratar un HTML (diseñadas por separado)

| Modo | Qué es | Cómo |
|---|---|---|
| Almacenar | Guardar el archivo y su ficha | Storage, tipo `text/plain` o descarga forzada; nunca se interpreta dentro de la app. |
| Descargar | Obtener el archivo original | Enlace de descarga con `Content-Disposition: attachment`. |
| Vista previa | Ver cómo luce sin riesgo | Captura/miniatura, o `iframe` con `sandbox` **sin** `allow-same-origin`, servido desde un origen distinto a la app. |
| Actividad publicada | Que alumnos o la clase la usen | Sitio aparte (otro origen), solo para actividades marcadas «publicable» por César. |

Regla: **un HTML importado nunca se ejecuta con los privilegios de la biblioteca** (no puede leer la sesión, Firestore ni Storage de César).

Nota: GIS envía `X-Frame-Options: DENY` en todo su sitio (`firebase.json`). El sitio de la biblioteca tendría su propia configuración.

## Seguridad

- Reglas de Firestore y Storage que permitan leer y escribir **solo al UID de César** en la biblioteca. Una pantalla de inicio de sesión no basta: GIS permite registrar cuentas nuevas, así que sin regla por UID cualquiera podría subir archivos y generar costos.
- Pruebas de reglas con el emulador antes de publicar.
- Ninguna clave privada (IA, cuentas de servicio) en el navegador ni en el repo. **El repo es público.**
- Archivos con datos de menores (fotos de trabajos, listas): marcarlos y no publicarlos; en capturas, anonimizar.

## Exportación y respaldo

- Exportar el catálogo completo a JSON desde la app (fichas, versiones, relaciones, temas, criterios).
- Descargar los archivos con una estructura de carpetas legible + el JSON con las rutas, para poder recuperar la biblioteca **sin la app**.
- Procedimiento documentado y probado en la Fase 8.

## Publicación desde las IAs — evaluación preliminar

No verificado todavía; se comprueba en la Fase 7. No se promete ninguna conexión.

| Herramienta | Posibilidad probable | A comprobar |
|---|---|---|
| Claude Code (en la computadora de César) | Alta: puede ejecutar un script de publicación que sube archivo + ficha con la sesión de César. | Forma segura de guardar la credencial fuera del repo. |
| Claude (web/app) | Media: conectores personalizados (servidor MCP remoto) si el plan lo permite. Requiere un servicio propio. | Plan de César, disponibilidad en web/escritorio/teléfono. |
| ChatGPT | Incierta: depende de funciones de conectores o acciones del plan de César. | Todo. |
| Cualquiera | Siempre: descargar el archivo y usar **Importar** en la biblioteca (flujo manual). | — |

Requisitos del mecanismo común: identificador de publicación para no duplicar al reintentar; confirmar archivo + ficha; informar qué se guardó y qué falló; devolver un enlace privado que funcione.
