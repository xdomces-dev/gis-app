# Plan por fases

Regla: se trabaja una fase a la vez. Al terminar una fase se muestra el resultado y se espera la indicación de César.

> 2026-11-27: César pidió adelantar «todo el esqueleto y toda la programación» y dejar la búsqueda de archivos para después. Por eso las fases 3–8 tienen código, pero ninguna está «comprobada» con materiales reales.

| Fase | Nombre | Estado |
|---|---|---|
| 1 | Diagnóstico y definición | Hecha; quedan Q1–Q3 |
| 2 | Inventario del ciclo 2026–2027 | Herramienta lista (`inventario.mjs`); falta correrla: rutas y repo privado |
| 3 | Biblioteca básica | **Programada y probada en modo local** y contra emuladores; falta activar la nube (Q3, Blaze) |
| 4 | Colección piloto | Funciones listas (relaciones, versiones, procedencia, teléfono); falta elegir e incorporar el piloto |
| 5 | Incorporación del ciclo | Funciones listas (vistas temporal y temática, progreso, reanudar sin duplicar); falta importar |
| 6 | Bibliotecario | Reglas, estados y evidencia programados; IA dentro de la app **no** iniciada (requiere servidor y costos) |
| 7 | Publicación conectada | Paquete común y `empaquetar.mjs` listos; conexión directa de herramientas no iniciada |
| 8 | Reutilización y evolución | Derivadas, adaptaciones, exportar/restaurar listos; secuencias por ciclo y sitio de actividades no iniciados |

## Fase 1. Diagnóstico y definición
- [x] Revisar instrucciones del repositorio y el entorno.
- [x] Identificar carpetas y proyectos disponibles.
- [x] Revisar GIS / Gestión Pedagógica (código en este repo; los datos reales en Firestore no se consultaron).
- [x] Verificar requisitos y costos de Firebase en documentación oficial.
- [x] Documentar visión, reglas, decisiones, fuentes y modelo preliminar.
- [ ] César responde las preguntas abiertas de `ESTADO.md`.

**Comprobación:** tenemos claro qué construiremos, qué podemos consultar y qué falta.

## Fase 2. Inventario del ciclo 2026–2027
- Explorar únicamente las ubicaciones que indique César.
- Inventariar sin mover ni borrar originales (solo lectura).
- Registrar ruta, formato, tamaño, fechas del archivo, huella (hash), posibles temas y procedencia.
- Marcar duplicados candidatos (mismo hash o nombre/tamaño parecido) y archivos incompletos.
- Separar datos confirmados de inferencias.
- Proponer una colección piloto abundante y variada (no Decimales por defecto).
- Se ejecuta con Claude Code en cada computadora (D-12). El inventario se guarda en un repo privado aparte, **no** en este repositorio público (D-13).

**Comprobación:** César puede revisar qué se encontró, dónde está y qué sigue pendiente.

## Fase 3. Biblioteca básica
- Acceso personal; almacenamiento y catálogo; carga, ficha, búsqueda y filtros básicos.
- Vistas previas cuando sean viables; abrir y descargar.
- Pruebas de permisos (que otra cuenta no pueda leer ni subir).

**Comprobación:** un material de prueba se guarda, se encuentra y se recupera.

## Fase 4. Colección piloto
- Incorporar la colección elegida; relacionar planeación, presentación, cuadernillos, imágenes y evaluación.
- Probar versiones y procedencia; revisar en computadora y teléfono.

**Comprobación:** se encuentran y usan los recursos del proyecto sin perder relaciones.

## Fase 5. Incorporación del ciclo
- Importación progresiva; vistas temporal y temática; progreso de recuperación.
- Corregir relaciones y fechas; reanudar importaciones sin duplicar.

**Comprobación:** el catálogo refleja lo recuperado y señala lo pendiente.

## Fase 6. Bibliotecario
- Reglas de clasificación y consulta; comparación de versiones según evidencia.
- Consultar guías y criterios; registrar decisiones; IA con costos visibles.

**Comprobación:** encuentra recursos y propone clasificaciones justificadas sin inventar fuentes ni aprobaciones.

## Fase 7. Publicación conectada
- Conectar primero una herramienta; probar publicación completa y fallos; mantener alternativa manual.

**Comprobación:** la orden de publicación devuelve un enlace que abre el recurso correcto con su historial.

## Fase 8. Reutilización y evolución
- Secuencias para otro ciclo; reordenar según diagnóstico; adaptaciones y derivadas; historial intacto.
- Probar exportación y recuperación.

**Comprobación:** se prepara un ciclo nuevo usando y transformando materiales anteriores sin perderlos.
