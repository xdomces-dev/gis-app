// Arranque: elige almacén, inicia sesión si hace falta, carga el catálogo y enruta.
import { h } from './util.js';
import { elegirAlmacen } from './store/index.js';
import { crearCatalogo } from './catalogo.js';
import { vistaCatalogo } from './ui/catalogo.js';
import { vistaRecurso } from './ui/recurso.js';
import { vistaNuevo, vistaDerivar } from './ui/formularios.js';
import { vistaTemas, vistaColecciones, vistaTiempo, vistaCriterios } from './ui/organizar.js';
import { vistaRespaldo } from './ui/respaldo.js';
import { toast } from './ui/comun.js';

const app = document.getElementById('app');
const principal = () => document.getElementById('principal');

const RUTAS = [
  { re: /^#?\/?$/, vista: (c, el, p) => vistaCatalogo(c, el, p), nav: 'catalogo', reactiva: true },
  { re: /^#\/r\/([\w-]+)$/, vista: (c, el, p, m) => vistaRecurso(c, el, m[1]), nav: 'catalogo', reactiva: true },
  { re: /^#\/nuevo$/, vista: vistaNuevo, nav: 'nuevo' },
  { re: /^#\/derivar$/, vista: vistaDerivar, nav: 'catalogo' },
  { re: /^#\/temas$/, vista: vistaTemas, nav: 'temas', reactiva: true },
  { re: /^#\/colecciones$/, vista: vistaColecciones, nav: 'colecciones', reactiva: true },
  { re: /^#\/tiempo$/, vista: vistaTiempo, nav: 'tiempo', reactiva: true },
  { re: /^#\/criterios$/, vista: vistaCriterios, nav: 'criterios', reactiva: true },
  { re: /^#\/respaldo$/, vista: vistaRespaldo, nav: 'respaldo', reactiva: true },
];

const NAV = [
  ['catalogo', '#/', '📚', 'Catálogo'], ['nuevo', '#/nuevo', '＋', 'Agregar'], ['tiempo', '#/tiempo', '🗓️', 'Vista temporal'],
  ['temas', '#/temas', '🧭', 'Temas'], ['colecciones', '#/colecciones', '🗂️', 'Colecciones'], ['criterios', '#/criterios', '✦', 'Criterios'],
  ['respaldo', '#/respaldo', '💾', 'Respaldo'],
];

let rutaActual = null;
let repintarAlCerrar = false; // hubo cambios mientras una ventana estaba abierta

function resolver() {
  const [ruta, qs] = location.hash.split('?');
  const params = Object.fromEntries(new URLSearchParams(qs || ''));
  for (const r of RUTAS) { const m = r.re.exec(ruta || ''); if (m) return { r, m, params }; }
  return { r: RUTAS[0], m: [], params };
}

function pintar(cat, { porCambio = false } = {}) {
  const { r, m, params } = resolver();
  if (porCambio && !r.reactiva) return;
  if (porCambio && document.querySelector('.modal-fondo')) { repintarAlCerrar = true; return; }
  const scroll = porCambio ? window.scrollY : 0;
  rutaActual = r;
  document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('activo', a.dataset.nav === r.nav));
  try {
    r.vista(cat, principal(), params, m);
  } catch (e) {
    console.error(e);
    principal().replaceChildren(h('div', { class: 'aviso' }, 'Error al mostrar esta pantalla: ' + e.message));
  }
  window.scrollTo(0, scroll);
  if (!porCambio) principal().focus({ preventScroll: true });
}

function marco(cat, almacen) {
  const usuario = almacen.usuario();
  app.replaceChildren(
    h('a', { class: 'saltar', href: '#principal' }, 'Saltar al contenido'),
    h('header', { class: 'lateral' },
      h('div', { class: 'marca' }, h('span', { class: 'marca-icono', 'aria-hidden': 'true' }, '📚'), h('span', {}, 'Biblioteca', h('small', {}, 'Pedagógica'))),
      h('nav', { class: 'nav', 'aria-label': 'Secciones' }, NAV.map(([k, href, ico, txt]) => h('a', { href, dataset: { nav: k } }, h('span', { 'aria-hidden': 'true' }, ico), h('span', { class: 'nav-txt' }, txt)))),
      h('div', { class: 'sesion' },
        almacen.tipo === 'local' ? h('p', { class: 'modo-local', title: 'Los datos viven solo en este navegador. Haz respaldos.' }, 'Modo local') : null,
        usuario?.email && almacen.tipo === 'firebase' ? h('small', {}, usuario.email) : null,
        almacen.salir ? h('button', { class: 'btn btn-sm btn-tiza', type: 'button', onclick: async () => { await almacen.salir(); location.replace(location.pathname + location.search); } }, 'Salir') : null)),
    h('main', { id: 'principal', class: 'principal', tabindex: '-1' }));
  pintar(cat);
}

function pantallaLogin(almacen, error) {
  return new Promise((res) => {
    const msg = h('p', { class: 'error', role: 'alert' }, error || '');
    const form = h('form', { class: 'login' },
      h('div', { class: 'marca marca-login' }, h('span', { 'aria-hidden': 'true' }, '📚'), h('span', {}, 'Biblioteca', h('small', {}, 'Pedagógica'))),
      h('p', {}, 'Biblioteca privada. Entra con tu cuenta de GIS.'),
      h('label', { class: 'campo' }, h('span', { class: 'campo-etq' }, 'Correo'), h('input', { type: 'email', name: 'correo', required: true, autocomplete: 'username' })),
      h('label', { class: 'campo' }, h('span', { class: 'campo-etq' }, 'Contraseña'), h('input', { type: 'password', name: 'contrasena', required: true, autocomplete: 'current-password' })),
      msg,
      h('button', { class: 'btn btn-primario', type: 'submit' }, 'Entrar'));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.textContent = '';
      try { res(await almacen.entrar(form.correo.value.trim(), form.contrasena.value)); }
      catch (err) { msg.textContent = /auth\//.test(err.code || '') ? 'Correo o contraseña incorrectos.' : (err.message || String(err)); }
    });
    app.replaceChildren(h('main', { class: 'pantalla-login' }, form));
  });
}

async function arrancar() {
  app.replaceChildren(h('p', { class: 'cargando' }, 'Abriendo la biblioteca…'));
  const almacen = await elegirAlmacen();
  let usuario = null, error = '';
  try { usuario = await almacen.iniciar(); } catch (e) { error = e.message; }
  if (almacen.requiereLogin && !usuario) usuario = await pantallaLogin(almacen, error);
  else if (error) throw new Error(error);
  const cat = crearCatalogo(almacen);
  await cat.cargar();
  window.__biblioteca = cat; // útil para depurar desde la consola
  marco(cat, almacen);
  window.addEventListener('hashchange', () => pintar(cat));
  cat.alCambiar(() => pintar(cat, { porCambio: true }));
  document.addEventListener('modal-cerrado', () => { if (repintarAlCerrar) { repintarAlCerrar = false; pintar(cat, { porCambio: true }); } });
}

arrancar().catch(e => {
  console.error(e);
  app.replaceChildren(h('div', { class: 'aviso' }, h('p', {}, 'No se pudo abrir la biblioteca.'), h('p', {}, e.message || String(e))));
  toast(e.message || String(e), 'error');
});
