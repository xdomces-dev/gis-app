# Materiales de clase

Páginas sueltas para el aula, independientes de la app GIS (no se publican con `firebase deploy`, porque están fuera de `public/`).

| Carpeta | Qué es | Cómo se usa |
|---|---|---|
| `duelo-teocalli/` | Concurso «100 estudiantes dijeron · Duelo Teocalli» para proyectar. Lo controla solo el docente. | Descargar `index.html` y abrirlo con doble clic en Chrome o Edge. Funciona sin internet. |
| `cuadernillo-colon/` | Examen en video «La llegada de los europeos a América» (Historia). Una sola entrega por teléfono. | Publicar `index.html` en Netlify y compartir el enlace por WhatsApp. |

## Editar las preguntas del concurso

En `duelo-teocalli/index.html`, busca `BANCO DE PREGUNTAS · EDITA AQUÍ`. Cada respuesta es:

```
["Papitas",30,"papas, papitas, papas fritas, sabritas"],
```

Nombre que se muestra, puntos y sinónimos separados por comas. Cinco respuestas por pregunta; los puntos suman 100.
