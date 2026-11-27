# Publicación en la biblioteca

«Publica este material en mi biblioteca» = incorporarlo a la biblioteca **privada**. Nunca exponerlo en internet.

## Mecanismo común: paquete de publicación

Cualquier herramienta que pueda crear un ZIP (o César a mano) usa el mismo formato. La biblioteca lo importa en **Respaldo › Importar**.

```
paquete.zip
  manifest.json
  juego.html
  portada.png
```

```json
{
  "formato": "biblioteca-paquete/1",
  "idPublicacion": "claude-code-3f9a…",
  "herramienta": "claude-code",
  "recurso": {
    "titulo": "Juego del cuerpo humano",
    "tipoRecurso": "juego",
    "descripcion": "",
    "grados": ["1"],
    "asignaturas": ["Biología / Ciencias de la Vida"],
    "usos": ["proyectar"],
    "temas": ["Aparatos y sistemas"]
  },
  "version": {
    "estado": "pendiente_revision",
    "consigna": "Convierte la presentación en un juego",
    "cambios": "",
    "recursoExistenteId": "(opcional: para agregar una versión a un recurso existente)",
    "relacion": "correccion | adaptacion",
    "origenVersionIds": []
  },
  "archivos": [
    { "nombre": "juego.html", "rol": "final" },
    { "nombre": "portada.png", "rol": "miniatura" },
    { "url": "https://youtu.be/…", "nombre": "Video de apoyo", "rol": "final" }
  ],
  "fuentes": [{ "tipo": "conversacion", "descripcion": "Claude Code, sesión del 2026-11-27" }]
}
```

Garantías (probadas en `biblioteca/tests/`):

1. **Sin duplicados al reintentar.** El mismo `idPublicacion` no crea otro recurso; si la primera vez faltó un archivo, el reintento sube solo lo que falta en la misma versión.
2. **Reporte de lo guardado y lo que falta.** Archivos guardados, fallidos y faltantes en el paquete.
3. **No inventa aprobaciones.** Una herramienta externa no puede marcar «elegida por César»: queda «pendiente de revisión». Lo que propone (grados, tipo…) queda marcado como «propuesto», no confirmado.
4. **Temas por nombre.** Si existen en el catálogo se enlazan; si no, quedan en una nota para revisarlos.
5. **Enlace verificable.** Al importar, la app muestra el enlace `#/r/<id>` al recurso.

## Por herramienta (evaluación, sin prometer conexiones)

| Herramienta | Hoy | Después (Fase 7, por verificar) |
|---|---|---|
| **Claude Code** en la computadora de César | `node biblioteca/herramientas/empaquetar.mjs …` crea el paquete; César lo importa. | Script que publique directo con la sesión de César, sin guardar credenciales en el repo. |
| **Claude** (web/app) | Descargar el archivo y usar «Agregar» o pedir el paquete. | Conector personalizado (servidor MCP propio) si el plan lo permite. Requiere un servicio con credenciales privadas. |
| **ChatGPT** | Descargar el archivo y usar «Agregar». | Depende de las funciones del plan de César. Sin verificar. |
| **Manual** | «Agregar material». Un paquete siempre cuenta como externo, aunque lo arme César: después se confirma en la ficha. | — |
