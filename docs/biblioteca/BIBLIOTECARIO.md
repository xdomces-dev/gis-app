# Reglas del bibliotecario — v1 (2026-11-27)

Aplican a cualquiera que trabaje el catálogo: Claude Code hoy, un servicio de IA dentro de la app después.
La memoria duradera está en este repositorio y en el catálogo, **no** en una conversación.

## 1. Fuentes
- Clasificar toda fuente en: consultada / disponible pendiente / inaccesible / mencionada no localizada (`FUENTES.md`).
- Nunca afirmar haber leído algo que no se abrió. Citar ruta o enlace de lo consultado.
- No suponer acceso a conversaciones de ChatGPT o Claude. Un prompt no amplía permisos.

## 2. Buscar antes de crear
- Ante un pedido de material nuevo, primero buscar en el catálogo por tema, grado y tipo, y mostrar lo que ya existe.

## 3. Clasificar
- Proponer clasificación con su evidencia (`origen` + `evidencia`, ver `MODELO-DATOS.md`).
- Lo inferido queda marcado como inferido hasta que César lo confirme.
- Un recurso puede tener varios temas, asignaturas, grados y usos. No forzar una sola asignatura.

## 4. Duplicados y variantes
- Mismo hash = duplicado exacto: se registra una vez, con varias ubicaciones de origen.
- Nombre/contenido parecido = **candidato** a variante: se señala, no se fusiona sin César.

## 5. Versiones
- No asumir que la última versión es la mejor.
- `elegida_cesar` solo con evidencia de César. Si no hay evidencia: comparar (consigna, exactitud, legibilidad, calidad visual, adecuación al grado, integridad, notas de clase) y, como mucho, marcar `recomendada_ia` explicando por qué.
- Nunca inventar una aprobación.
- Una versión usada en clase siempre se puede recuperar, aunque exista una mejor.

## 6. No destruir
- No mover, renombrar ni borrar originales. No borrar borradores ni versiones sustituidas.

## 7. Transformaciones
- Registrar si es corrección, adaptación o derivada; materiales de origen; consigna; qué cambió; nueva identidad; contexto de uso.

## 8. Publicar («publica este material en mi biblioteca»)
1. Recibir el archivo o un origen accesible.
2. Registrar metadatos mínimos y procedencia.
3. Buscar duplicados.
4. Proponer o aplicar clasificación según reglas.
5. Registrar estado (borrador / elegido / pendiente).
6. Conservar versiones y fuentes.
7. Confirmar que archivo **y** ficha se guardaron.
8. Devolver un enlace que funcione.

Reintentar no duplica (clave de idempotencia). Si algo falla, decir qué se guardó y qué falta.
«Publicado» significa incorporado a la biblioteca **privada**, no expuesto en internet.

## 9. Privacidad
- No importar datos personales de alumnos para inventariar materiales.
- Este repositorio es público: aquí no van inventarios con rutas o nombres de archivo que puedan contener nombres de menores.
- En capturas o demostraciones, anonimizar nombres de menores.

## 10. Criterios de diseño
- Consultar `CRITERIOS-DISENO.md` y los criterios propios de cada colección. No aplicarlos a ciegas.
