# Design System — DocenteApp

## Product Context
- **What this is:** App de gestión escolar para maestros y directivos de escuelas primarias en México
- **Who it's for:** Maestros (control de asistencia, evaluación, alumnos) y directivos (dashboard, organización escolar)
- **Space/industry:** EdTech — gestión escolar, México
- **Project type:** Web app / dashboard — single HTML file, Vanilla JS + Firebase, mobile-first
- **Memorable:** "Software serio para trabajo real" — el maestro entra, trabaja, sale

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian con autoridad editorial
- **Decoration level:** Minimal — tipografía hace todo el trabajo; cero ilustraciones, cero decoración
- **Mood:** Pizarrón escolar como metáfora de interfaz. La sidebar ES el pizarrón (verde, tiza blanca/amarilla). El área de contenido ES el cuaderno (blanco cálido, datos precisos). Densa pero escaneable. El maestro reconoce el contexto antes de leer una palabra.
- **Anti-patterns:** Sin gradientes, sin íconos en círculos de color, sin border-radius excesivo, sin ilustraciones de aula, sin paleta playful
- **Reference:** Linear, Notion (seriedad), vs ClassDojo/Seesaw (lo que NO somos)

## Typography

- **Display / Headings:** `Cormorant Garamond` (400, 500, 600) — autoridad editorial en contexto de datos; nadie en edtech la usa porque "los niños no la van a leer" — exactamente el punto
- **Body / UI / Labels:** `DM Sans` (300, 400, 500, 600) — limpia, legible, ligeramente cálida vs Inter; excelente para español
- **Data / Tables / Números:** `DM Mono` (400, 500) — alineación de columnas nativa, señal visual de precisión; usar siempre para conteos, promedios, fechas en tabla
- **Code:** `DM Mono` (mismo)
- **Loading:** Google Fonts CDN — una sola llamada:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Mono:wght@400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
  ```

### Escala tipográfica
```
xs:   12px / DM Sans 400 / line-height 1.4  → timestamps, labels secundarios
sm:   13px / DM Sans 400 / line-height 1.5  → cuerpo de tabla, texto de celda
base: 14px / DM Sans 400 / line-height 1.5  → body principal, párrafos
md:   16px / DM Sans 500 / line-height 1.4  → subtítulos de sección
lg:   20px / DM Sans 600 / line-height 1.3  → títulos de panel
xl:   26px / Cormorant Garamond 500 / line-height 1.2 → page title principal
2xl:  36px / Cormorant Garamond 500 / line-height 1.1 → headings de display

mono: 10px–13px / DM Mono 400 → tablas, contadores, fechas, badges de estado
```

## Color

- **Approach:** Restrained — un solo accent (amber), sidebar oscura, content claro

### Hybrid (variante aprobada: sidebar pizarrón + content area clara)

La metáfora visual es literal: la sidebar es el pizarrón de la escuela (verde, tiza blanca), el área de contenido es el cuaderno donde se trabaja (blanco cálido). Esto comunica "escuela" antes de leer una palabra.

```css
/* ── Sidebar = Pizarrón ── */
--sidebar-bg:      #2a4728;   /* verde pizarrón escolar */
--sidebar-bg-dark: #1f3520;   /* hover / pressed */
--sidebar-text:    #e8e4d4;   /* tiza blanca — no blanco puro */
--sidebar-muted:   #b8b4a4;   /* tiza gastada — labels secundarios */
--sidebar-faint:   #7a7668;   /* sección labels, iconos sutiles */
--sidebar-active:  #f0c435;   /* tiza amarilla — item activo */
--sidebar-border:  #3a5738;   /* línea de pizarrón */

/* ── Content area ── */
--bg:              #fafaf9;   /* fondo app — off-white cálido, no frío */
--surface:         #ffffff;   /* cards, paneles, toolbar */
--surface-raised:  #f5f4f2;   /* hover de fila, fondos secundarios */
--border:          #e7e5e4;   /* bordes de tabla, divisores */
--border-subtle:   #f0eeed;   /* separadores de fila en tabla */

/* ── Texto ── */
--text:            #1c1917;   /* texto principal — negro cálido */
--text-muted:      #78716c;   /* labels secundarios, fechas, meta */
--text-faint:      #a8a29e;   /* placeholders, headers de tabla */

/* ── Acción primaria ── */
--primary:         #0f172a;   /* botón principal, nav activo desktop */
--primary-hover:   #1e293b;

/* ── Accent ── */
--accent:          #f0c435;   /* tiza amarilla — CTA secundario, contadores, active states */
--accent-hover:    #d4aa1e;

/* ── Estados de asistencia ── */
--success:         #16a34a;   /* Presente (A) */
--success-bg:      #f0fdf4;
--danger:          #dc2626;   /* Falta (F) */
--danger-bg:       #fef2f2;
--info:            #2563eb;   /* Justificada (J) */
--info-bg:         #eff6ff;

/* ── Warning ── */
--warning:         #d97706;   /* mismo que accent */
--warning-bg:      #fffbeb;
```

### CSS variables — incluir en :root del HTML
```css
:root {
  --sidebar-bg: #1c1917;
  --sidebar-text: #d6d3d1;
  --sidebar-muted: #a09890;
  --sidebar-faint: #6b6560;
  --sidebar-active: #d97706;
  --sidebar-border: #2a2822;
  --bg: #fafaf9;
  --surface: #ffffff;
  --surface-raised: #f5f4f2;
  --border: #e7e5e4;
  --border-subtle: #f0eeed;
  --text: #1c1917;
  --text-muted: #78716c;
  --text-faint: #a8a29e;
  --primary: #0f172a;
  --primary-hover: #1e293b;
  --accent: #d97706;
  --accent-hover: #b45309;
  --success: #16a34a;
  --success-bg: #f0fdf4;
  --danger: #dc2626;
  --danger-bg: #fef2f2;
  --info: #2563eb;
  --info-bg: #eff6ff;
  --warning: #d97706;
  --warning-bg: #fffbeb;
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'DM Mono', 'Courier New', monospace;
  --radius-sm: 3px;
  --radius: 6px;
  --radius-lg: 8px;
}
```

## Spacing

- **Base unit:** 4px
- **Density:** Compact — herramienta de trabajo, no marketing
- **Scale:**
  ```
  2xs:  2px   → separadores internos de badge
  xs:   4px   → gap entre elementos inline
  sm:   8px   → padding interno de badge/chip
  md:  16px   → padding de celda de tabla, gap entre columnas
  lg:  24px   → padding de sección, gap de stat cards
  xl:  32px   → padding de content area
  2xl: 48px   → separación entre secciones grandes
  ```

## Layout

- **Approach:** Grid-disciplined — estructura fija, alineación estricta
- **Shell:** Sidebar fija izquierda + content area scroll independiente
  - Desktop (≥768px): sidebar 220px fija + content area flexible
  - Tablet (480–767px): sidebar 60px colapsada (solo íconos) + content
  - Mobile (<480px): sidebar desaparece → bottom navigation 4 ítems
- **Content max-width:** 1200px (centrado en pantallas grandes)
- **Header de página:** sticky a 0, altura 56px
- **Border radius:**
  - sm: `3px` → badges de estado, chips, inputs
  - md: `6px` → botones, cards pequeñas
  - lg: `8px` → modales, paneles, sidebar items
  - NUNCA más de 8px en componentes de datos

### Sidebar — estructura
```
sidebar (220px / 60px colapsado)
  ├── logo-area (56px)
  │     logo-mark: DM Sans 600 + subtítulo Mono xs
  ├── nav-section-label: DM Mono 9px uppercase #sidebar-faint
  ├── nav-item (32px alto): ícono 16px + label DM Sans 13px
  │     active: background rgba(--accent, 0.12) + accent text
  └── sidebar-footer: nombre usuario + rol
```

### Stat bar — sobre tabla de asistencia
```
stat-bar (4 cards horizontales)
  card: label DM Mono 9px uppercase + valor DM Mono 22px
  colores de valor: --text (total), --success (presentes), --danger (faltas), --info (justificadas)
```

### Tabla de datos — patrón principal
```css
/* Header de tabla */
thead th {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-faint);
  padding: 10px 12px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
}

/* Filas */
tbody td {
  padding: 9px 12px;
  font-family: var(--font-body);
  font-size: 13px;
  border-bottom: 1px solid var(--border-subtle);
}

/* Número de lista */
td.num {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-faint);
}

/* Datos numéricos */
td.data {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
  text-align: right;
}
```

## Motion

- **Approach:** Minimal-functional — solo transiciones que ayudan a comprender estado
- **Easing:** `ease-out` entrar, `ease-in` salir, `ease-in-out` mover
- **Durations:**
  - micro: 80ms → hover de fila, focus de input
  - short: 150ms → expand/collapse sidebar, toggle de tab
  - medium: 250ms → apertura de modal
  - Sin animaciones decorativas, sin bounce, sin spin decorativo

## Componentes — Patrones clave

### Badge de asistencia
```html
<span class="badge-estado presente">
  <span class="badge-dot"></span>PRE
</span>
```
```css
.badge-estado {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.badge-dot { width: 6px; height: 6px; border-radius: 50%; }
.presente { background: var(--success-bg); color: var(--success); }
.presente .badge-dot { background: var(--success); }
.falta    { background: var(--danger-bg);  color: var(--danger);  }
.falta    .badge-dot { background: var(--danger); }
.justificada { background: var(--info-bg); color: var(--info); }
.justificada .badge-dot { background: var(--info); }
```

### Botón primario
```css
.btn-primary {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: #fafaf9;
  background: var(--primary);
  border: none;
  border-radius: var(--radius-sm);
  padding: 7px 16px;
  cursor: pointer;
  transition: background 80ms ease-out;
}
.btn-primary:hover { background: var(--primary-hover); }
```

### Botón ghost
```css
.btn-ghost {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-muted);
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px 16px;
  cursor: pointer;
  transition: border-color 80ms ease-out, color 80ms ease-out;
}
.btn-ghost:hover { border-color: var(--text-muted); color: var(--text); }
```

### Input
```css
input, select {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 7px 12px;
  outline: none;
  transition: border-color 80ms ease-out;
}
input:focus { border-color: var(--accent); }
```

### Toast / Notificación (reemplaza alert())
```css
.toast {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  padding: 10px 16px;
  border-radius: var(--radius);
  border-left: 3px solid;
  background: var(--surface);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1800;
}
.toast.success { border-color: var(--success); color: var(--success); }
.toast.error   { border-color: var(--danger);  color: var(--danger); }
.toast.info    { border-color: var(--accent);  color: var(--accent); }
```

## Reglas de implementación

1. **Fuentes:** cargar siempre desde Google Fonts CDN. DM Mono para TODOS los números, promedios, fechas, conteos.
2. **Sidebar en desktop:** 220px fija. En tablet: 60px (solo íconos). En móvil: bottom nav.
3. **Tablas:** headers en Mono uppercase 10px. Números siempre Mono right-aligned.
4. **Page titles:** siempre Cormorant Garamond 500. No usar DM Sans para h1 de página.
5. **Sin border-radius > 8px** en ningún componente de datos.
6. **Sin ilustraciones** ni emojis decorativos en la UI (solo en contenido de usuario si aplica).
7. **Toasts en lugar de alert():** usar `.toast` con auto-dismiss 3s.
8. **Accent amber** `#d97706` solo para: CTA secundario, contadores críticos, estado activo en sidebar. Nunca como fondo de bloque grande.
9. **Hover de fila:** `background: var(--surface-raised)` — nunca color fuerte.
10. **Escapeado XSS:** siempre `escHTML()` antes de insertar en innerHTML.

## Decisions Log

| Fecha | Decisión | Rationale |
|-------|----------|-----------|
| 2026-07-02 | Variante Hybrid (sidebar oscura + content claro) | Light seguro para tablets/celulares en salón; sidebar oscura da impacto visual de "herramienta seria" sin sacrificar legibilidad |
| 2026-07-02 | Cormorant Garamond para headings | Autoridad editorial en contexto de datos — ruptura deliberada vs sans uniformes de la categoría |
| 2026-07-02 | DM Mono para todos los datos numéricos | Alineación de columnas, señal visual de precisión |
| 2026-07-02 | Amber #d97706 como único accent | Cálido, visible, diferente al azul corporativo; adecuado para México |
| 2026-07-02 | Sin dark mode toggle | El Hybrid ya resuelve legibilidad en pantallas LCD de salón |
| 2026-07-02 | Border radius máx 8px | Herramienta seria, no consumer app |
