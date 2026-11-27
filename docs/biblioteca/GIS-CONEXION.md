# Conexión con GIS / App Docente

Revisión del **código** de GIS en este repositorio (2026-11-27, commit `1accd27`).
Los **datos reales** de César en Firestore no se consultaron.

## Qué hace hoy Gestión Pedagógica

Ubicación: `public/index.html`, sección `// ===== GESTIÓN PEDAGÓGICA =====` (~línea 10084).

- **Materias fijas** (`GP_MATERIAS`, 8): Lenguajes/Español, Matemáticas, Biología, Física y Química, Historia, Geografía, FCyE, Inglés Básico.
- **Campo formativo por materia** (`GP_CAMPO`): `LEN`, `SPC`, `ENS`. No aparece «De lo humano y lo comunitario».
- **Mapa maestro de temas** (`MAPA_MAESTRO`): lista fija en el código, ~140 temas en total.
- **Distribución mensual** (`MESES_DIST`): cuántos temas por materia y mes, de septiembre a junio, con periodo P1/P2/P3.
- La primera vez que se abre, **siembra** un documento por tema en Firestore: `users/{uid}/contenidos/{id}`.
- **Vista por materia**: lista de temas con botones 📋 Plan, 📦 Material, ✅ Impartido, campo de fecha libre, 📝 Tarea, 📊 Eval.
- **Vista temporal**: temas agrupados por mes sugerido, con avance y alerta de meses pasados sin impartir.
- **Portafolio** en el perfil del alumno: tareas ligadas a un contenido (`contenidoId`) y si la evidencia física se archivó.

### Documento `contenidos` (forma actual)

```js
{
  materia: 'Historia',
  nombre: 'Llegada de los europeos a América',
  orden: 16,                 // posición en MAPA_MAESTRO
  mesSugerido: 'Diciembre',  // orden previsto
  periodo: 'P1',
  plan: false,               // ¿planeación lista?
  material: false,           // ¿material listo?  ← punto natural de enlace con la biblioteca
  impartido: false,
  fecha: '',                 // texto libre: fecha real de aplicación
  generaEvidencia: false,
  tareaId: null,
  temaGeneradorId: null,     // reservado, nunca se llena hoy
  ciclo: '2026-2027'         // se agrega al sembrar
}
```

## Hallazgos

1. **Lo útil para la biblioteca**
   - Ya distingue **orden previsto** (`mesSugerido`) de **aplicación real** (`impartido` + `fecha`). Es la misma distinción que pide la biblioteca.
   - El catálogo de temas por materia es un buen **punto de partida** para la vista temática.
   - La bandera `material` es el lugar natural para enlazar después «material usado en este tema».
   - `temaGeneradorId` está reservado para Temas Generadores (Alternativa 2 de la tesis).
2. **Lo que no existe en el código**
   - **No hay «niveles de gradualidad»**, ni grado (1°/2°/3°) por contenido, ni subtemas, ni proyectos. → Pregunta abierta Q2.
   - No hay relación tema ↔ varias asignaturas (transversalidad).
3. **Limitaciones a tener en cuenta**
   - Los temas viven como texto en el código; el `id` de cada contenido es por cuenta y por siembra, no un identificador estable del tema entre ciclos.
   - `fecha` es texto libre (no siempre se puede ordenar).
   - El respaldo «Exportar datos» de GIS **no incluye `contenidos`** (tampoco bitácora ni organización). Se anota para el pendiente 4 de GIS (respaldos); no se cambia ahora.

## Propuesta de conexión (para aprobación)

**Aplicación conectada, no módulo dentro de `index.html`.**

Motivos:
- `index.html` ya tiene ~10,500 líneas; meter la biblioteca ahí aumenta el riesgo de romper GIS en pleno ciclo.
- GIS maneja datos de menores; la biblioteca no los necesita. Separarlas reduce lo que puede salir mal.
- La biblioteca debe sobrevivir a cambios de escuela, ciclo o incluso de app de gestión.

Cómo se conectan, en orden de menor a mayor esfuerzo:
1. **Fase 3–5 (sin tocar GIS):** la biblioteca tiene su propio catálogo de temas. Cada tema puede guardar un vínculo opcional al tema de GIS (`materia` + `nombre` de GIS), sin copiar datos de alumnos.
2. **Más adelante (con autorización):** en GIS, junto a 📦 Material, un enlace «ver en la biblioteca» al recurso exacto usado. Cambio pequeño y aislado.
3. **Opcional:** que la biblioteca lea el avance de `contenidos` (previsto vs. aplicado) para su vista temporal, **solo lectura**.

Qué **no** se hace: importar alumnos, calificaciones, asistencia ni portafolios. El objetivo es el patrimonio de materiales, no las calificaciones.
