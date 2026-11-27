// Selección de materiales para combinarlos en una propuesta nueva (derivada).
import { h } from '../util.js';
import { versionPrincipal } from '../modelo.js';

const elegidas = new Map(); // versionId → recursoId
const oyentes = new Set();
const avisar = () => oyentes.forEach(f => f());

export const seleccion = {
  versiones: () => [...elegidas.keys()],
  tiene: (versionId) => elegidas.has(versionId),
  alternar(versionId, recursoId) { if (elegidas.has(versionId)) elegidas.delete(versionId); else elegidas.set(versionId, recursoId); avisar(); },
  vaciar() { elegidas.clear(); avisar(); },

  /** Casilla en la tarjeta: selecciona la versión principal del recurso. */
  casilla(cat, r) {
    const v = versionPrincipal(r, cat.versionesDe(r.id));
    if (!v) return null;
    const input = h('input', { type: 'checkbox', checked: elegidas.has(v.id), 'aria-label': 'Seleccionar para combinar' });
    input.addEventListener('change', () => seleccion.alternar(v.id, r.id));
    return h('label', { class: 'casilla casilla-sel' }, input, h('span', {}, 'Combinar'));
  },

  /** Barra que aparece cuando hay materiales seleccionados. */
  barra(cat) {
    const el = h('div', { class: 'barra-seleccion' });
    const pintar = () => {
      if (!elegidas.size) { el.hidden = true; el.replaceChildren(); return; }
      el.hidden = false;
      const nombres = [...elegidas].map(([vid, rid]) => `${cat.recurso(rid)?.titulo} (v${cat.version(vid)?.numero})`);
      el.replaceChildren(
        h('span', {}, `🧺 ${elegidas.size} seleccionado(s): `, h('small', {}, nombres.join(' · '))),
        h('a', { class: 'btn btn-sm btn-primario', href: '#/derivar' }, 'Crear propuesta derivada'),
        h('button', { class: 'btn btn-sm', type: 'button', onclick: () => seleccion.vaciar() }, 'Vaciar'));
    };
    oyentes.clear(); // solo la barra visible escucha
    oyentes.add(pintar);
    pintar();
    return el;
  },
};
