# Materiales de clase

Páginas sueltas para el aula, independientes de la app GIS (no se publican con `firebase deploy`, porque están fuera de `public/`).

| Carpeta | Qué es | Cómo se usa |
|---|---|---|
| `duelo-teocalli/` | Concurso «100 estudiantes dijeron · Duelo Teocalli» para proyectar. Lo controla solo el docente. | Descargar `index.html` y abrirlo con doble clic en Chrome o Edge. Funciona sin internet. |
| `cuadernillo-colon/` | Examen en video «La llegada de los europeos a América» (Historia). Una sola entrega por teléfono. | Publicar `index.html` en Netlify y compartir el enlace por WhatsApp. |

## Temas del concurso

Después de registrar los equipos se abre el menú **Cultura general**. Cada tema tiene su propio diseño: colores, tablero, papel picado e íconos que flotan en el fondo.

| Tema | Campo formativo (Plan 2022) | Preguntas |
|---|---|---|
| 🌮 México y la escuela | De lo humano y lo comunitario | 23 |
| 🎮 Caricaturas, películas y videojuegos | Lenguajes | 11 |
| 🔬 Ciencias | Saberes y pensamiento científico | 10 |
| 📜 Historia de México | Ética, naturaleza y sociedades | 10 |
| 🌎 Geografía | Ética, naturaleza y sociedades | 10 |
| 🫀 Aparatos y sistemas del cuerpo humano | Saberes y pensamiento científico | 12 |
| 🪅 ¡Bien mexicano! (barrio, comida, música) | Lenguajes | 14 |
| 🎲 Mezcla de todo | Todos | todas |

Cada partida usa 5 preguntas del tema elegido. Los puntajes son de juego, no de una encuesta real.

El tema del cuerpo humano se armó a partir de la presentación de clase «Aparatos y sistemas del cuerpo humano»; su copia en `duelo-teocalli/temas/cuerpo-humano.json` sirve como ejemplo de cómo convertir una clase en tema.

## Agregar un tema

Hay dos formas.

### 1. Cargar un archivo `.json` (sin tocar el código)

1. Copia `duelo-teocalli/temas/plantilla-tema.json` y cámbiale el nombre, por ejemplo `biologia.json`.
2. Ábrelo con el Bloc de notas y cambia `id`, `nombre`, `icono`, `campo`, `descripcion`, `colores`, `motivos` y `preguntas`.
3. En el concurso, en el menú de temas, pulsa **📂 Cargar tema** y elige tu archivo.

El tema se guarda en esa computadora. Para borrarlo, usa **✕ Quitar** en su tarjeta.

### 2. Escribirlo en el código

En `duelo-teocalli/index.html`, busca `TEMAS Y PREGUNTAS · EDITA AQUÍ`. Copia un bloque `{ id:"...", ... preguntas:[...] }` completo y pégalo antes del `];` final. Así el tema viaja con el archivo a cualquier computadora.

### Formato de cada pregunta

```
{ "p": "Menciona un planeta del sistema solar", "r": [
  ["Tierra", 30, "la tierra, planeta tierra"],
  ["Marte", 25, "el planeta rojo"],
  ["Júpiter", 18, "jupiter"],
  ["Saturno", 15, ""],
  ["Venus", 12, ""]
]}
```

- Cada respuesta lleva el texto que se muestra, los puntos y los sinónimos separados por comas.
- Van cinco respuestas por pregunta, de mayor a menor, y los puntos suman 100.
- Cada tema necesita al menos 6 preguntas: 5 para las rondas y 1 para el desempate.
- Las preguntas deben ser abiertas, con varias respuestas válidas («Menciona…»), no de una sola respuesta correcta.

### Colores del tema

- `a`, `b` y `c` son los acentos: el marco del tablero y el papel picado.
- `fondo`, `luz1` y `luz2` pintan el escenario.
- `casilla1`, `casilla2` y `borde` pintan las casillas tapadas.
- `motivos` son los emojis que flotan en el fondo.
