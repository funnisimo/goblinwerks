
import * as Utils from './utils.js';
import * as GW from './gw.js';


export function frequency(v) {
  if (!v) return 100;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const parts = v.split(',');
    v = {};
    parts.forEach( (p) => v[p] = 100 );
  }
  if (typeof v === 'object') {
    const parts = Object.entries(v);

    const funcs = parts.map( ([levels,frequency]) => {
      frequency = Number.parseInt(frequency);

      if (levels.includes('-')) {
        let [start, end] = levels.split('-');
        start = Number.parseInt(start);
        end = Number.parseInt(end);
        return ((level) => (level >= start && level <= end) ? frequency : 0);
      }
      else if (levels.endsWith('+')) {
        const found = Number.parseInt(levels);
        return ((level) => (level >= found) ? frequency : 0);
      }
      else {
        const found = Number.parseInt(levels);
        return ((level) => (level === found) ? frequency : 0);
      }
      Utils.WARN('Unknown frequency configuration: ', levels, frequency);
      return (() => 0);
    });

    if (funcs.length == 1) return funcs[0];

    return ((level) => funcs.reduce( (out, fn) => out || fn(level), 0) );
  }
  return 0;
}

GW.make.frequency = frequency;

export function forDanger(frequency, danger) {
  if (typeof frequency === 'number') {
    return frequency;
  }
  if (typeof frequency === 'function') {
    if (danger === undefined || danger < 0) {
      if (GW.data.map && GW.data.map.config.danger) {
        danger = GW.data.map.config.danger;
      }
      else if (GW.data.danger) {
        danger = GW.data.danger;
      }
      danger = 0;
    }
    return frequency(danger);
  }
  return 0;
}
