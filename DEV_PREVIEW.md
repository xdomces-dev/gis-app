# DEV PREVIEW — DocenteApp

Guía para trabajar en modo "developer preview" local sin hacer deploy.

---

## 1. Abrir el proyecto

En PowerShell o terminal:

```
cd C:\Users\xdomc\mi-primer-proyecto
```

---

## 2. Iniciar el servidor local

### Opción A — Firebase Hosting Emulator (recomendada)

Replica exactamente el comportamiento de producción, incluyendo los headers de seguridad de `firebase.json`.

```
npm run dev
```

- URL: **http://localhost:5000**
- Se detiene con `Ctrl + C`

> Requiere tener Firebase CLI instalado (`npm install -g firebase-tools`) y haber hecho `firebase login` al menos una vez.

### Opción B — Servidor estático simple (alternativa rápida)

No requiere Firebase CLI. Sirve directamente la carpeta `public/`.

```
npm run preview
```

- URL: **http://localhost:5000**
- Se detiene con `Ctrl + C`

---

## 3. Ver la app en modo celular (Chrome o Edge)

1. Abre **http://localhost:5000** en Chrome o Edge.
2. Presiona **F12** para abrir DevTools.
3. Presiona **Ctrl + Shift + M** para activar el modo dispositivo móvil.
4. En el menú desplegable de dispositivos, elige **iPhone 14 Pro Max** o **Galaxy S20 Ultra** para ver la app como la verían tus usuarios.
5. Para desactivar el modo móvil: vuelve a presionar **Ctrl + Shift + M**.

---

## 4. Acomodar ventanas en Windows

El flujo ideal: navegador a la izquierda, editor/terminal a la derecha.

| Acción | Atajo |
|--------|-------|
| Pegar ventana a la **izquierda** | `Win + ←` |
| Pegar ventana a la **derecha** | `Win + →` |
| Maximizar | `Win + ↑` |
| Restaurar / minimizar | `Win + ↓` |

**Configuración recomendada:**
- `Win + ←` en la ventana del navegador → se ancla a la mitad izquierda
- Windows te pregunta qué poner a la derecha → elige la terminal o el editor
- La terminal con el servidor puede quedar en un tercer espacio o snap en cuarto de pantalla con `Win + ← → ↑`

---

## 5. Flujo de trabajo diario

```
1. cd C:\Users\xdomc\mi-primer-proyecto
2. npm run dev          ← inicia servidor local en localhost:5000
3. Abre Chrome → http://localhost:5000
4. F12 → Ctrl+Shift+M  ← modo celular
5. Editas archivos en public/ → recargas la página (F5)
6. Cuando todo está listo → npm run deploy
```

> Los cambios en `public/index.html` o `public/supervisor.html` se ven al recargar la página (F5). No hay hot-reload automático — es intencional para mantener el proyecto simple.

---

## 6. Cuándo usar `firebase deploy`

```
npm run deploy
```

Úsalo **solo** cuando:
- Ya revisaste los cambios en local y todo funciona bien.
- Quieres publicar la versión actualizada para tus usuarios reales.
- No hay errores visibles en consola (F12 → Console).

Nunca es necesario hacer deploy para ver cambios localmente.

---

## Scripts disponibles

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Firebase Hosting Emulator en localhost:5000 |
| `npm run preview` | Servidor estático simple en localhost:5000 |
| `npm run deploy` | Publica a Firebase Hosting (producción) |

---

## Notas

- La carpeta pública es `public/` — todos los archivos ahí se sirven tal cual.
- `firebase.json` define las reglas de hosting; el emulador las respeta.
- Firestore, Auth y datos de usuarios **no se ven afectados** por este flujo local.
