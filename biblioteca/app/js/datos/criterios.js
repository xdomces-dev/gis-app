// Criterios iniciales v1 (docs/biblioteca/CRITERIOS-DISENO.md), dictados por César el 2026-11-27.
// Se siembran una sola vez; después se editan desde la app y cada cambio crea una versión nueva.

const base = { version: 1, vigente: true, fecha: '2026-11-27', autor: 'cesar', coleccionId: null };

export const CRITERIOS_INICIALES = [
  ['C-01', 'Materiales adecuados para telesecundaria.', 'General'],
  ['C-02', 'Diseño cuidado, atractivo y legible.', 'General'],
  ['C-03', 'Estilo ilustrado y colorido cuando corresponda.', 'Según material'],
  ['C-04', 'Estética tipo Canva, evitando apariencia infantil excesiva.', 'General'],
  ['C-05', 'Recursos científicos realistas cuando sean pertinentes.', 'Ciencias'],
  ['C-06', 'Consignas breves y claras.', 'General'],
  ['C-07', 'Actividades variadas.', 'General'],
  ['C-08', 'Los cuadernillos no repiten simplemente las diapositivas.', 'Cuadernillos'],
  ['C-09', 'Campo «Nombre» solo en la primera hoja de cuadernillos de varias páginas, cuando se solicite.', 'Cuadernillos'],
  ['C-10', 'Presentaciones normalmente en 16:9.', 'Presentaciones'],
  ['C-11', 'Revisar contenido, respuestas y correspondencia de opciones.', 'General'],
].map(([codigo, texto, ambito]) => ({ ...base, id: 'crit_' + codigo.toLowerCase().replace('-', ''), codigo, texto, ambito }));
