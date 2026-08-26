# DocenteApp — Plan de Acción

**Generado por**: gstack /plan-eng-review  
**Fecha**: 2026-06-15  
**Actualizado**: 2026-06-17  
**Estado**: En progreso

---

## FASE 0 — Hotfixes Críticos (Esta Semana, en v6)

> No esperes la v7. Estos errores afectan datos reales de maestros hoy.

### ✅ HOT-1: Bug de IDs duplicados en onboarding — COMPLETADO
- **Archivo**: `docenteapp-v6_10.html` líneas 1590-1595
- **Fix**: Capturar `Date.now()` una sola vez antes del `forEach` y reusar ese timestamp.

### ✅ HOT-2: API offline deprecada — COMPLETADO
- **Fix**: Cambiado a `initializeFirestore(app, { localCache: persistentLocalCache() })`

### ✅ HOT-3: Verificar Reglas de Firestore — COMPLETADO
- Reglas owner-only desplegadas y activas

---

## FASE 1 — Preparación v7 (Semana 2-3)

### T-01: Crear repositorio GitHub + estructura Vite+TS
- [ ] `npm create vite@latest docenteapp-v7 -- --template vanilla-ts`
- [ ] Configurar Firebase en variables de entorno (`.env.local`, no hardcoded)
- [ ] Configurar Firebase Hosting (`firebase init hosting`)
- [ ] GitHub Actions para deploy automático a Firebase Hosting en push a main
- [ ] Instalar nanostores (`npm install nanostores`)
- [ ] Instalar Vitest + Testing Library

### T-02: Módulo de estado con nanostores
- [ ] Definir stores: `alumnosStore`, `asistenciasStore`, `uiStore`
- [ ] Tipado TypeScript para cada store
- [ ] Reemplazar variables globales mutables (`ALUMNOS[]`, `asistencias[]`, etc.)

### T-03: Módulo Firebase (helpers tipados)
- [ ] Migrar `fsGet`, `fsGetCol`, `fsAdd`, `fsSet`, `fsUpdate`, `fsDelete` a TypeScript
- [ ] Configurar `persistentLocalCache()` (reemplaza `enableIndexedDbPersistence`)
- [ ] Implementar detección de cold-start sin cache

### T-04: Nuevo modelo de datos Firestore jerárquico
- [ ] Diseñar schema `users/{uid}/groups/{groupId}/alumnos/{alumnoId}`
- [ ] Script de migración de datos v6 → v7 (sin perder datos actuales)
- [ ] Implementar `collectionGroup('alumnos')` para vistas agregadas
- [ ] Actualizar reglas de seguridad para el nuevo schema

---

## FASE 2 — Migración de Módulos (Semanas 4-8)

### T-05: Módulos de alta prioridad
- [ ] Auth (login/registro/recuperar) — validar email en registro
- [ ] Onboarding con importación CSV (reemplaza captura manual)
- [ ] Asistencia (día a día + vista semanal)
- [ ] Evaluaciones + Concentrado (3 periodos → configurable)
- [ ] Puntos +/- (el feature más diferenciador)

### T-06: Reemplazar window.* con event listeners
- [ ] Auditar las >50 funciones asignadas a `window.*`
- [ ] Migrar a `addEventListener` con `data-action` / `data-id` attributes

### T-07: Reemplazar alert() con toast/snackbar
- [ ] ✅ Completado en v6 (~28 usos → `mostrarCel()`)

---

## FASE 3 — Seguridad y Compliance

### ✅ S-01: XSS — esc() consistente — COMPLETADO 2026-06-17
- 11 puntos de inyección corregidos con `esc()` en nombres, SVG, inputs de formulario

### ✅ S-02: CURP — decisión tomada 2026-06-17
- CURP se mantiene en Firestore en plaintext
- Justificación: necesario para constancias SEP; acceso restringido por reglas Firestore (solo owner); aviso de privacidad en onboarding ya lo menciona
- LFPDPPP: cumplido con aviso + restricción de acceso

### ✅ S-03: Reglas Firestore completas — COMPLETADO 2026-06-17
- Reglas específicas para `alumnos` (nombre no vacío, grado string)
- Reglas específicas para `asistencias` (estado ∈ A/F/J, alumno y fecha strings)
- Reglas específicas para `puntos` (tipo ∈ pos/neg, valor int > 0)
- Reglas para `/escuelas/{cct}/` — director (por `cct`) lee/escribe; maestros vinculados (por `escuelaCct`) leen
- Wildcard owner-only como fallback para el resto

---

## FASE 4 — Tests (Continuo desde T-01)

### T-08: Suite de tests mínima (20 unit tests, Vitest)
- [ ] `guardarAlumnos` — IDs consistentes (el bug del HOT-1)
- [ ] `renderConcentrado` — formato correcto de calificaciones
- [ ] `generarConstancia` — 5 tipos de constancias generan HTML correcto
- [ ] `esc()` — escapa XSS correctamente
- [ ] Stores nanostores — updates reactivos sin race conditions
- [ ] Cold-start detection — timeout + fallback a datos demo
- [ ] Migración v6→v7 — datos preservados en nuevo schema

---

## FASE 5 — Content y Calendario

### ✅ C-01: EVENTOS_SEP configurable — COMPLETADO 2026-06-16
- `public/calendario.json` actualizado con 70 eventos (ciclo 2025-2027)
- Cubre 2025-08-20 → 2027-07-05

---

## Quick Wins — TODOS COMPLETADOS ✅ 2026-06-17

| # | Tarea | Estado |
|---|-------|--------|
| QW-1 | alert() → mostrarCel() (~28 usos) | ✅ HECHO |
| QW-2 | innerHTML sin esc() (11 puntos) | ✅ HECHO |
| QW-3 | window.* críticos → let (7 vars) | ✅ HECHO |
| HOT-1 | Hotfix IDs duplicados onboarding | ✅ HECHO |
| HOT-2 | Hotfix offline API deprecada | ✅ HECHO |
| HOT-3 | Verificar/desplegar reglas Firestore | ✅ HECHO |

---

## FASE M — Monetización en v6

> Prerequisito BLOQUEANTE: tramitar RFC (Persona Física con Actividad Empresarial) en SAT antes de activar Stripe + OXXO Pay. Tiempo: 1-4 semanas. Iniciar inmediatamente.

### M-01: Firebase Cloud Function — Backend de pagos
- [ ] Crear proyecto Firebase Functions (TypeScript)
- [ ] `createPaymentIntent()`: crea PaymentIntent en Stripe, devuelve client_secret al cliente
- [ ] Stripe secret key en Firebase Secret Manager (nunca en HTML)
- [ ] Webhook receiver: actualiza `plan` en Firestore (Admin SDK) al confirmar pago
- [ ] Idempotencia: verificar `stripe_event_id` antes de procesar
- [ ] Cloud Scheduler (job diario): actualizar `plan="free"` cuando OXXO voucher vence sin pago (5 días)

### ✅ M-02: isPremium() + trial logic — COMPLETADO 2026-06-17
- ✅ Campo `plan` en `/users/{uid}/perfil/datos`: `{ plan, trialStartedAt, trialEndsAt }`
- ✅ Al primer open post-deploy: escribe `trialStartedAt = serverTimestamp()` si no existe
- ✅ `isPremium()`: verifica plan individual Y plan escuela (`isEscuelaPremium()`)
- ✅ `isTrial()` y `isEscuelaTrial()` con fechas reales de Firestore
- ✅ Tier FREE: lista de alumnos, asistencia básica, perfil
- ✅ Tier PREMIUM: constancias SEP, evaluaciones, concentrado, puntos, calendario, exportar

### ✅ M-03: UI de paywall + upgrade — COMPLETADO 2026-06-17
- ✅ Badge en nav: "X días de prueba" (individual) o "Escuela: X días" (Plan Escuela)
- ✅ Features premium con lock icon durante el trial
- ✅ Modal upgrade dinámico según estado (trial / escuela_trial / expirado)
- ✅ Dos tiers en modal: Individual $129/mes y Plan Escuela $399/mes (hasta 5 maestros)
- ✅ Botón "Próximamente" — pago real pendiente hasta obtener RFC

### M-04: GA4 + eventos de conversión
- [ ] Agregar script GA4 al HTML (Measurement ID en variable)
- [ ] Evento `trial_started` al primer open
- [ ] Evento `paywall_hit` cuando el maestro toca feature premium post-trial
- [ ] Evento `upgrade_clicked` al abrir pantalla de upgrade
- [ ] Evento `payment_completed` en Cloud Function post-confirmación
- [ ] Evento `payment_failed` si el pago falla

### M-05: GTM / Adquisición (canal principal)
- [ ] Crear video demo corto (~2 min) mostrando constancias SEP + puntos + asistencia
- [ ] Publicar en grupos de Facebook de maestros mexicanos ('Maestros en Red', grupos de zona)
- [ ] Contactar usuarios actuales de v6 directamente (email o WhatsApp) para anunciar Premium
- [ ] Objetivo: 20 maestros en trial activo → 10 pagan en mes 1

### ✅ M-06: Plan Escuela — COMPLETADO 2026-06-17
- ✅ Schema Firestore: `/escuelas/{cct}/datos` + `/escuelas/{cct}/organizacion/{docId}`
- ✅ Plan Escuela: $399 MXN/mes por CCT — UI lista, pago pendiente RFC
- ✅ Flujo de invitación: director genera código → maestro vincula con `escuelaCct`
- ✅ `isPremium()` = individual OR escuela (`isEscuelaPremium()`)
- ✅ `isEscuelaTrial()`: 30 días gratis para directores nuevos
- ✅ Migración automática `/users/{uid}/organizacion/` → `/escuelas/{cct}/organizacion/`
- ✅ Firestore rules: director (por `cct`) lee/escribe; maestros vinculados (por `escuelaCct`) leen
- ✅ Auto-rotación (ORG-TODO-2): `calcRotacionActual()` sin Cloud Functions
- ✅ Datos de escuela bajo CCT, no bajo UID del director (ORG-TODO-3)
- ✅ G-1: Directorio de escuela en config (todos los maestros vinculados visibles)
- ✅ G-2/P-5: Comunicado del día — director publica, maestros ven banner con acuse de lectura
- ✅ G-3: Org tab gratis con 1 ítem activo; ilimitados con premium
- ✅ P-1: `resumen/ultimo` incluye `ultimos5` (asistencias) y `grado`
- ✅ P-2: Exportar organización a PDF (botón en panel directivo herramientas)
- ✅ P-3: Eventos de escuela en calendario (director agrega, maestros ven en sidebar)
- ✅ P-4: Historial de rotación (últimas 12 entregas por comisión/guardia)
- ✅ Todas las funciones cableadas y desplegadas en producción

---

## Decisiones de Arquitectura (Bloqueadas en /plan-eng-review)

| ID | Decisión | Opción elegida |
|----|----------|----------------|
| D1 | Bug IDs onboarding | Hotfix esta semana en v6 |
| D2 | State management | nanostores (no Zustand) |
| D3 | Estrategia de carga | Lazy load con onSnapshot por sección |
| D4 | Patrón UI interactions | Event listeners + data attributes (no window.*) |
| D5 | Modelo Firestore | Jerárquico: groups/{id}/alumnos/{id} |
| D6 | Cobertura de tests | 20 unit tests mínimo (Vitest) |
| D7 | API offline | Hotfix a persistentLocalCache() esta semana |
| D8 | Cross-model: estado | nanostores confirmado (no React-centric) |
| D9 | Cross-model: queries | collectionGroup('alumnos') para agregados |
| D10 | Cold-start sin cache | Mensaje claro + datos demo en pantalla |

---

---

## TODOs — Pestaña Organización (de /plan-eng-review · 2026-06-16)

### ORG-TODO-1: Validación de demanda con un director real
**What:** Hablar 20 minutos con un director real antes de mostrar la pestaña a usuarios reales.
**Why:** El feature se construyó sobre conocimiento de dominio del desarrollador, no en entrevistas de usuario. Sin validar, los 10 templates podrían no ser los correctos, el flujo podría no ser natural para directores, y el precio (¿incluir en plan directivo base?) sería una adivinanza.
**Pros:** Confirma o refuta la hipótesis antes de que llegue a producción. Las 3 preguntas están definidas en el design doc.
**Cons:** Requiere coordinar una llamada/visita.
**Context:** Ver design doc `xdomc-unknown-design-20260616-173616.md` → sección "The Assignment" para las 3 preguntas exactas: (1) cómo llevan la guardia ahorita, (2) cuáles templates usarían, (3) si pagarían extra.
**Depends on:** Ninguno. Hacer antes de deploy a producción real.

### ✅ ORG-TODO-2: v2 Auto-rotación — COMPLETADO 2026-06-17
**What:** La app asigna automáticamente al siguiente maestro en la lista de rotación según la temporalidad (semanal, quincenal, etc.).
**Implementado:** `calcRotacionActual(item)` calcula responsable en turno client-side sin Cloud Functions. Soporta permanente, semanal, quincenal, mensual, bimestral, anual. Muestra "⚠️ Avanzar" si está vencida. Botón "↻ Avanzar" actualiza `rotacionIndex` y `rotacionFecha` en Firestore.

### ✅ ORG-TODO-3: Modelo de datos a nivel escuela — COMPLETADO 2026-06-17
**What:** Migrar `/users/{directivoUid}/organizacion/` a `/escuelas/{cct}/organizacion/`.
**Implementado:** Migración automática en `cargarOrganizacion()` al primer acceso con CCT. Datos de la escuela sobreviven cambios de director. Ver M-06.

---

*Plan generado por gstack /plan-eng-review · 2026-06-15*  
*Próximos pasos: /plan-ceo-review → /investigate → /cso → /retro*
