// Almacén en la nube: Firebase Auth + Firestore + Cloud Storage.
// Se activa en config.js (backend: 'firebase') SOLO cuando César lo autorice.
// Storage requiere el plan Blaze (ver docs/biblioteca/ARQUITECTURA.md).
//
// Rutas:
//   Firestore: users/{uid}/bib_<coleccion>/{id}  (cubierto por la regla «solo el dueño» de GIS)
//   Storage:   biblioteca/{uid}/{recursoId}/{versionId}/{archivoId}.{ext}  (ver storage.rules)

const SDK = 'https://www.gstatic.com/firebasejs/10.12.0';

export function crearAlmacenFirebase(config) {
  let fb = null; // módulos cargados
  let auth, db, storage, user = null;

  const colRef = (n) => fb.fs.collection(db, 'users', user.uid, 'bib_' + n);
  const docRef = (n, id) => fb.fs.doc(db, 'users', user.uid, 'bib_' + n, id);
  const objRef = (ruta) => fb.st.ref(storage, `biblioteca/${user.uid}/${ruta}`);

  return {
    tipo: 'firebase',
    descripcion: 'Nube (Firebase)',
    requiereLogin: true,

    async cargarSDK() {
      if (fb) return;
      const [app, au, fs, st] = await Promise.all([
        import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-auth.js`),
        import(`${SDK}/firebase-firestore.js`), import(`${SDK}/firebase-storage.js`),
      ]);
      fb = { app, au, fs, st };
      const a = app.initializeApp(config.firebase, 'biblioteca');
      auth = au.getAuth(a);
      db = fs.initializeFirestore(a, { localCache: fs.persistentLocalCache() });
      storage = st.getStorage(a);
      if (config.emuladores) {
        // Solo para pruebas locales (proyecto demo-*): nunca toca el proyecto real.
        au.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        fs.connectFirestoreEmulator(db, '127.0.0.1', 8080);
        st.connectStorageEmulator(storage, '127.0.0.1', 9199);
      }
    },

    /** Espera la sesión. Devuelve el usuario o null si no hay sesión. */
    async iniciar() {
      await this.cargarSDK();
      user = await new Promise(res => { const off = fb.au.onAuthStateChanged(auth, u => { off(); res(u); }); });
      if (user && config.OWNER_UID && user.uid !== config.OWNER_UID) {
        await fb.au.signOut(auth);
        user = null;
        throw new Error('Esta biblioteca es privada. La cuenta con la que entraste no tiene acceso.');
      }
      return user;
    },

    async entrar(correo, contrasena) {
      await this.cargarSDK();
      const cred = await fb.au.signInWithEmailAndPassword(auth, correo, contrasena);
      if (config.OWNER_UID && cred.user.uid !== config.OWNER_UID) {
        await fb.au.signOut(auth);
        throw new Error('Esta biblioteca es privada. La cuenta con la que entraste no tiene acceso.');
      }
      user = cred.user;
      return user;
    },

    async salir() { await fb.au.signOut(auth); user = null; },

    usuario() { return user ? { uid: user.uid, email: user.email } : null; },

    async listar(n) {
      const snap = await fb.fs.getDocs(colRef(n));
      return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async guardar(n, obj) {
      if (!obj.id) throw new Error('Falta id');
      await fb.fs.setDoc(docRef(n, obj.id), limpiar(obj));
      return obj;
    },
    async actualizar(n, id, parche) { await fb.fs.updateDoc(docRef(n, id), limpiar(parche)); },

    async subirArchivo(ruta, blob, meta = {}) {
      const esHTML = /\.html?$/i.test(ruta) || meta.mime === 'text/html';
      await fb.st.uploadBytes(objRef(ruta), blob, {
        contentType: meta.mime || blob.type || 'application/octet-stream',
        // Un HTML nunca se abre directamente desde el almacén: se descarga.
        contentDisposition: esHTML ? 'attachment' : undefined,
        customMetadata: { recursoId: meta.recursoId || '', hash: meta.hash || '' },
      });
      return { ruta };
    },
    async urlArchivo(ruta) { return fb.st.getDownloadURL(objRef(ruta)); },
    // getBlob necesita que el bucket tenga CORS configurado (ver biblioteca/README.md).
    async leerArchivo(ruta) { return fb.st.getBlob(objRef(ruta)); },
    async existeArchivo(ruta) {
      try { await fb.st.getMetadata(objRef(ruta)); return true; } catch { return false; }
    },
  };
}

// Firestore no acepta undefined.
function limpiar(o) {
  return JSON.parse(JSON.stringify(o));
}
