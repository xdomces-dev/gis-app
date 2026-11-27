// Configuración de la biblioteca.
//
// backend:
//   'local'    → datos en este navegador (IndexedDB). No usa servicios en la nube. ES EL VALOR ACTUAL.
//   'firebase' → Firebase Auth + Firestore + Storage. Activarlo solo cuando César lo autorice
//                (Storage exige el plan Blaze; ver docs/biblioteca/ARQUITECTURA.md y DECISIONES.md, Q3).
//
// OWNER_UID: UID de la cuenta de César. Si se llena, cualquier otra cuenta es rechazada en la app.
//   La protección real está en las reglas (storage.rules y firestore). Este UID no es secreto.
//
// La configuración de Firebase es pública por diseño (igual que en GIS). No poner aquí
// claves privadas, cuentas de servicio ni claves de IA.

export const CONFIG = {
  backend: 'local',
  OWNER_UID: '',
  firebase: {
    // Proyecto de GIS. Si se decide un proyecto nuevo (Q3), reemplazar estos valores.
    apiKey: 'AIzaSyA8FQoPPFVFqvFvStjSLGHAMVCPeo3w68s',
    authDomain: 'docenteappd.firebaseapp.com',
    projectId: 'docenteappd',
    storageBucket: 'docenteappd.firebasestorage.app',
  },
  // Tamaño máximo por archivo (debe coincidir con storage.rules).
  maxBytesArchivo: 200 * 1024 * 1024,
};
