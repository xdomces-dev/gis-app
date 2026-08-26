# DocenteApp v7 — Especificación de Producto

**Versión**: 1.0 | **Fecha**: 2026-06-15 | **Autor**: Generado por gstack /spec  
**Fuente analizada**: `docenteapp-v6_10.html` — 3,761 líneas (HTML + CSS + JS embebidos)

---

## 1. Visión del Producto

DocenteApp es una herramienta de gestión escolar diseñada para **maestros mexicanos de escuelas multigrado** (telesecundaria, primaria rural, preescolar comunitario). Resuelve el problema concreto de un docente que atiende múltiples grados simultáneamente y no tiene secretaria, subdirector, ni internet confiable: todo el registro de asistencia, calificaciones, puntos, constancias y reportes para padres de familia debe ocurrir desde su celular o laptop en el salón de clases.

La v6 existe y funciona como monolito HTML de un archivo. La v7 debe preservar la **velocidad de uso en campo** (sin bundlers que se tarden, sin npm install que falle) mientras elimina las deudas técnicas críticas que impiden escalar a multi-escuela o comercializar.

**Propuesta de valor única**: El único sistema de gestión escolar que funciona offline, genera constancias SEP con formato oficial en 10 segundos, y envía reportes por WhatsApp con un toque — sin capacitación, sin soporte técnico, sin servidor propio.

---

## 2. Usuarios Target

### Usuario Principal
**Maestro(a) de escuela multigrado mexicana**
- Atiende 2-6 grados simultáneamente (niveles: preescolar, primaria, secundaria/telesecundaria)
- 15-40 alumnos totales, mezcla de grados
- Zona rural o semi-urbana, internet intermitente o via hotspot del celular
- Dispositivo: laptop básica o tablet, a veces solo celular Android
- Nivel técnico: usa WhatsApp, no conoce npm, no instalará apps nativas
- No tiene asistente administrativo — él/ella captura, imprime y entrega todo
- Trabaja bajo supervisión de zona escolar (CCT, reportes a supervisor de zona)

### Usuario Secundario (v7+)
**Director(a) de escuela** (cuando hay más de un docente)
- Quiere consolidado de todos los grupos
- No captura datos, solo visualiza y firma documentos

### Fuera de alcance
- Padres de familia (no acceden directamente a la app)
- Alumnos
- Supervisores de zona (pueden recibir PDFs por WhatsApp/email, no tienen login)

---

## 3. Stack Técnico Actual (v6)

| Componente | Tecnología | Versión | Riesgo |
|------------|-----------|---------|--------|
| Frontend | HTML/CSS/JS puro | — | Monolito 3,761 líneas |
| Auth | Firebase Authentication | 10.12.0 vía CDN | API key expuesta en HTML |
| Base de datos | Cloud Firestore | 10.12.0 vía CDN | Sin reglas de seguridad visibles |
| Offline | IndexedDB (enableIndexedDbPersistence) | — | API DEPRECADA en Firebase 10+ |
| Fuentes | Google Fonts CDN | Syne + DM Sans | Requiere internet al cargar |
| Build | Ninguno | — | Todo manual |
| Tests | Ninguno | — | 0 cobertura |
| TypeScript | No | — | Sin tipado |
| State Management | Variables globales mutables | — | Race conditions en async |

---

## 4. Stack Técnico Propuesto — v7

### Opción Recomendada: Vite + Vanilla TS + Firebase (evolución mínima)

**Filosofía**: El maestro no puede "npm install" en campo. v7 debe seguir siendo deployable como un build estático en Firebase Hosting, con offline-first real. No necesitas Next.js ni tRPC — son overhead sin beneficio para un usuario single-tenant offline.

```
Frontend:   Vite + TypeScript (build a HTML/JS/CSS estático)
Estado:     nanostores 460B (vanilla JS, sin React — confirmado sobre Zustand)
UI:         CSS Modules (misma estética, sin rediseñar)
Backend:    Firebase Auth + Firestore (mismo, pero con reglas correctas)
Offline:    Firebase v10 persistentLocalCache() (reemplaza API deprecada)
            Cold-start sin cache → mensaje claro + pantalla de datos demo
Hosting:    Firebase Hosting (gratis, CDN global)
Tests:      Vitest + Testing Library (mínimo 20 unit tests)
CI/CD:      GitHub Actions → Firebase Hosting
Queries:    collectionGroup('alumnos') para vistas agregadas multi-grupo
```

### Por qué NO Next.js/tRPC/PostgreSQL (ahora)
- Requiere servidor siempre activo → costo mensual
- Sin internet en campo = app muerta (SSR no funciona offline)
- PostgreSQL duplica Firestore sin agregar valor para un usuario
- La migración de datos es traumática con 0 tests
- El maestro no notará diferencia — lo que necesita es **estabilidad y velocidad**

### Opción Alternativa: Next.js (solo si hay monetización multi-escuela)
Si en 6 meses hay >50 escuelas y necesitas dashboard de director/supervisor:
```
Frontend:   Next.js 15 + TypeScript
Estado:     Zustand + React Query
Backend:    tRPC + Drizzle ORM + PostgreSQL (Neon o Supabase)
Auth:       Clerk o NextAuth v5
Hosting:    Vercel
Offline:    Service Worker + IndexedDB propio (Firebase queda fuera)
```

---

## 5. Módulos Identificados — Estado Actual y Prioridades

### Módulos Existentes (v6)

| Módulo | Estado | Prioridad v7 | Notas |
|--------|--------|-------------|-------|
| Auth (login/registro/recuperar) | ✅ Funcional | Alta — corregir | Sin validación de email en registro |
| Onboarding (4 pasos) | ✅ Funcional | Alta — simplificar | Paso 4 de alumnos es tedioso |
| Alumnos / Config | ✅ Funcional | Alta — refactorizar | Bug en IDs al guardar en onboarding |
| Asistencia (día a día) | ✅ Funcional | Alta | |
| Vista Semanal | ✅ Funcional | Alta | Función más poderosa, sub-utilizada |
| Tareas | ✅ Funcional | Media | |
| Evaluación (boleta por alumno) | ✅ Funcional | Alta | Solo 3 periodos, SEP usa más |
| Concentrado de Calificaciones | ✅ Funcional | Alta | Ya imprimible |
| Estadísticas | ✅ Funcional | Media | |
| Puntos +/- | ✅ Funcional | Alta | Feature más diferenciador |
| Meta Grupal | ✅ Funcional | Alta | Feature diferenciador |
| Reportes / Constancias SEP | ✅ Funcional | Alta | 5 tipos de constancias |
| Envío WhatsApp | ✅ Funcional | Alta | |
| Cumpleaños | ✅ Funcional | Media | |
| Calendario SEP 2025-2026 | ✅ Funcional | Alta — hardcoded 🚨 | Se rompe en ciclo 2026-2027 |
| Modo Pantalla (proyección) | ✅ Funcional | Media | |
| Herramientas (Timer/Aleatorio/Equipos/PES) | ✅ Funcional | Media | |

### Módulos Nuevos (v7 MVP)

| Módulo | Prioridad | Por qué |
|--------|-----------|---------|
| Importar lista desde Excel/CSV | Alta | El maestro ya tiene la lista en Word/Excel |
| Exportar datos (backup JSON) | Alta | Actualmente los datos quedan atrapados en Firestore |
| Reglas de seguridad Firestore | Alta 🚨 | Sin esto, cualquier usuario puede leer datos de otro |
| Ciclo escolar configurable | Alta 🚨 | EVENTOS_SEP hardcoded para 2025-2026 |
| Notificaciones de cumpleaños (push) | Media | Ya existe el badge, falta push |
| Multi-grupo (varias secciones) | Media | Un maestro puede tener más de un grupo |

### Módulos Fuera de Alcance (v7 MVP)

- Dashboard para director/supervisor
- App móvil nativa
- Pagos/suscripción en-app
- Integración con SISEN/SIGED (sistema SEP)
- Generación de CURP (solo almacenamiento)
- Fotografías de alumnos
- Chat con padres de familia

---

## 6. Modelo de Datos — v6 Actual y v7 Propuesto

### v6 (actual — estructura plana)

```
users/{uid}/
  perfil/datos          → escuela, cct, municipio, zona, director, turno,
                          correo, tel, docente, grados[], nivel, modalidad, ciclo
  alumnos/{id}          → n, grado, tel, curp, fnac, tutor, tel2, dir,
                          notas, beca, av (clase CSS avatar)
  asistencias/{id}      → fecha, campo ('DIA'), alumno (id), estado (A/F/J)
  tareas/{id}           → fecha, campo, alumno, tipo, nombre, entrego, cal, obs
  evaluaciones/{id}     → fecha, campo (P1/P2/P3), alumno, tipo (boleta/tarea/etc),
                          nombre (asignatura), cal (1-10)
  puntos/{id}           → fecha, alumno, tipo (pos/neg), cat, valor, obs
  meta/datos            → valor (50), premio, celebrada (bool)
  eventos/{id}          → fecha, titulo, tipo, notas
```

**Problema crítico**: No hay subcolecciones por grupo. Un maestro con 2 grupos
mezcla todos los alumnos en la misma colección `alumnos/`. Multigrado funciona
porque los alumnos tienen campo `grado`, pero un maestro con grupos A y B de
mismo grado no puede distinguirlos.

### v7 (propuesto — estructura jerárquica, confirmado en /plan-eng-review)

```
users/{uid}/
  perfil/datos          → (mismo que v6)
  groups/{groupId}/     → nombre, grado, turno, ciclo
    alumnos/{alumnoId}  → n, grado, tel, curp_hash (no plaintext), fnac, ...
    asistencias/{id}    → fecha, alumnoId, estado
    evaluaciones/{id}   → fecha, periodo, alumnoId, asignatura, cal
    puntos/{id}         → fecha, alumnoId, tipo, cat, valor
  meta/datos            → valor, premio, celebrada
  eventos/{id}          → fecha, titulo, tipo, notas
```

**Vistas agregadas**: `collectionGroup('alumnos')` permite queries cross-group
para reportes de concentrado sin duplicar datos. Confirmado vía /plan-eng-review D9.

---

## 7. Problemas Críticos del Monolito (Encontrados en Código)

### 🚨 CRÍTICO — Seguridad

1. **Firebase API key en HTML** (`apiKey: "AIzaSyA8FQoPPFVFqvFvStjSLGHAMVCPeo3w68s"`)  
   El `apiKey` de Firebase en apps web es semi-público por diseño, pero el `appId` y `messagingSenderId` también están expuestos. Sin reglas de Firestore robustas, cualquier persona que inspeccione el código puede leer/escribir datos de cualquier usuario.

2. **Reglas de Firestore desconocidas** — No están en el código. Si están en modo "test" (allow read, write: if true), cualquier persona con el projectId puede acceder a todos los datos de todos los maestros incluyendo CURP y teléfonos de menores.

3. **CURP de menores sin cifrado** — Se almacena en texto plano en Firestore. Si las reglas fallan, quedan expuestas.

4. **innerHTML sin escape consistente** — La función `esc()` existe (línea 1356) pero no se usa en todos los lugares donde se concatena HTML con datos del usuario. Hay riesgo de XSS.

### 🚨 CRÍTICO — Correctitud de Datos

5. **Bug en IDs del onboarding** (`guardarAlumnos`, línea 1590-1595):  
   ```js
   const id='al'+Date.now()+i;  // ← genera ID para Firestore
   ...
   ALUMNOS=validos.map((a,i)=>({id:'al'+Date.now()+i,...})); // ← genera OTRO Date.now()
   ```
   El ID almacenado en Firestore y el ID en memoria son diferentes (`Date.now()` cambia entre las dos llamadas). Cualquier lookup por ID falla inmediatamente después del onboarding hasta que el usuario recarga.

6. **Carga total en memoria al inicio** — `cargarTodosLosDatos()` (línea 1402) hace `Promise.all` de 8 colecciones sin paginación. Con 300 registros de asistencia (normal en un ciclo) + 500 de puntos + 400 de evaluaciones = >1,000 documentos cargados en arrays JS en memoria. Funciona hoy, se rompe al escalar.

7. **Eventos SEP hardcoded para 2025-2026** (líneas 3459-3484):  
   ```js
   const EVENTOS_SEP = [
     {fecha:'2025-08-25', titulo:'Inicio ciclo escolar 2025-2026',...},
     ...
     {fecha:'2026-07-06', titulo:'Inicio vacaciones de verano',...},
   ];
   ```
   El 7 de julio de 2026 el calendario queda vacío para siempre. El maestro no verá eventos SEP del siguiente ciclo.

### ⚠️ IMPORTANTE — Deuda Técnica

8. **`enableIndexedDbPersistence` deprecada** (línea 1211) — Firebase 10 usa `persistentLocalCache()`. La API actual muestra warning en consola y puede dejar de funcionar en una actualización futura de Firebase.

9. **CSS duplicado** — `.nav` y `.nav-brand` están definidos dos veces (líneas 21-30 y 97-108) con valores diferentes. El segundo overridea al primero, pero es código muerto que confunde.

10. **Estado global mutable sin sincronización** — 8 variables globales (`ALUMNOS`, `asistencias`, etc.) son modificadas directamente desde funciones async. Si dos operaciones corren en paralelo (el usuario hace click rápido), el estado puede quedar inconsistente.

11. **`alert()` para feedback** — Usado en >15 lugares. Bloquea el hilo principal, no es accesible (no respeta lectores de pantalla), y se ve mal en proyectores (modo pantalla usa `alert()`).

12. **Funciones asignadas a `window`** (>50 funciones) — Patrón necesario para `onclick` en HTML, pero hace imposible el tree-shaking, testing unitario, y análisis estático.

13. **0 tests** — Sin unit tests, integration tests, ni e2e. Cualquier refactor es de alto riesgo.

---

## 8. Flujo de Datos Crítico — Diagrama

```
Usuario → Login (Firebase Auth)
  ↓
onAuthStateChanged → cargarTodosLosDatos() → 8 colecciones en paralelo
  ↓
Variables globales en memoria: ALUMNOS[], asistencias[], evaluaciones[], etc.
  ↓
Render directo al DOM con innerHTML (sin virtual DOM)
  ↓
Usuario interactúa → función en window.* → fsAdd/fsSet/fsUpdate (Firestore)
                                         → actualiza variable global
                                         → re-render del componente afectado
```

**Problema**: Si Firestore falla (sin internet), `setSyncError()` muestra el punto rojo pero la operación se pierde. IndexedDB guarda el write offline pero no hay confirmación al usuario de que "se guardará cuando haya conexión".

---

## 9. Criterios de Aceptación — v7 MVP

Para considerarse v7 lista, debe cumplir todos los siguientes:

1. ✅ Reglas de Firestore implementadas y probadas: `users/{uid}/**` solo accesible por el propietario
2. ✅ CURP cifrada en reposo (o excluida de Firestore si no es esencial)
3. ✅ Bug de IDs en onboarding corregido — IDs consistentes entre Firestore y memoria
4. ✅ API de offline actualizada a `persistentLocalCache()` — sin deprecation warnings
5. ✅ `alert()` reemplazado por toast/snackbar accesible en 100% de usos
6. ✅ Ciclo escolar de EVENTOS_SEP configurable desde perfil (no hardcoded)
7. ✅ Importación de lista desde CSV con validación
8. ✅ Export/backup de todos los datos del usuario a JSON descargable
9. ✅ `esc()` aplicado en 100% de los `innerHTML` con datos del usuario
10. ✅ Al menos 20 tests unitarios cubriendo funciones críticas (guardarAlumnos, renderConcentrado, generarConstancia)

---

## 10. Fuera de Alcance — MVP v7

- Rediseño visual (el diseño actual funciona bien para el usuario)
- Migración a Next.js/React (overhead sin beneficio directo al usuario ahora)
- Base de datos relacional (Firestore es suficiente para el modelo actual)
- Multi-tenancy (un maestro = una cuenta, mantener así en MVP)
- App nativa iOS/Android
- Integración con sistemas SEP (SISEN, SIGED)
- Dashboard para directores

---

## 11. Estimación de Esfuerzo por Módulo (v7 MVP)

| Tarea | Esfuerzo humano | Con CC+gstack |
|-------|----------------|---------------|
| Migrar a Vite+TS (estructura) | ~3 días | ~2 horas |
| Corregir bug IDs onboarding | ~1 hora | ~10 min |
| Reglas Firestore + tests | ~1 día | ~30 min |
| Reemplazar `alert()` con toast | ~4 horas | ~20 min |
| Fix API offline deprecada | ~2 horas | ~15 min |
| Calendario SEP configurable | ~1 día | ~45 min |
| Import CSV alumnos | ~2 días | ~1 hora |
| Export/backup JSON | ~4 horas | ~20 min |
| Fix XSS (`esc()` consistente) | ~2 horas | ~15 min |
| Tests unitarios (20) | ~2 días | ~1 hora |
| **TOTAL** | **~2 semanas** | **~7 horas** |

---

## 12. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Reglas Firestore en modo "test" | Alta | Crítico | Verificar en consola Firebase y corregir inmediatamente |
| Bug de IDs afecta datos actuales | Alta | Alto | Migración de IDs en script de fix + reload forzado |
| EVENTOS_SEP vence en julio 2026 | Certeza | Medio | Configurar en perfil antes de inicio del ciclo 2026-2027 |
| `enableIndexedDbPersistence` falla en update de Firebase | Media | Alto | Migrar a `persistentLocalCache()` antes de actualizar Firebase SDK |
| Pérdida de datos offline sin confirmación | Media | Alto | Implementar cola de operaciones pendientes con UI visible |

---

## 13. Siguiente Paso Accionable

**Esta semana (Quick Wins, sin migrar a v7):**

1. **HOY**: Verificar reglas de Firestore en Firebase Console. Si dice `allow read, write: if true;` — cambiar inmediatamente a `allow read, write: if request.auth.uid == userId;`
2. **Mañana**: Corregir bug de IDs (líneas 1590-1595) — es 2 líneas de fix
3. **Esta semana**: Actualizar `enableIndexedDbPersistence` a `persistentLocalCache()` — es 3 líneas

**Próxima semana (preparar v7):**
4. Crear repo en GitHub con Vite+TS configurado
5. Migrar la lógica de Firebase helpers a un módulo TypeScript
6. Escribir los primeros 5 tests unitarios

---

*Generado por /spec · gstack · DocenteApp v6_10 → v7 · 2026-06-15*
