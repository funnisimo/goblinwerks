
import { utils } from './gw.js';

export function NOOP()  {}
utils.NOOP = NOOP;

export function TRUE()  { return true; }
utils.TRUE = TRUE;

export function FALSE() { return false; }
utils.FALSE = FALSE;

export function IDENTITY(x) { return x; }
utils.IDENTITY = IDENTITY;


export function clamp(v, min, max) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

utils.clamp = clamp;

export function copyXY(dest, src) {
  dest.x = src.x || src[0] || 0;
  dest.y = src.y || src[1] || 0;
}

utils.copyXY = copyXY;

export function addXY(dest, src) {
  dest.x += src.x || src[0] || 0;
  dest.y += src.y || src[1] || 0;
}

utils.addXY = addXY;

export function equalsXY(dest, src) {
  return (dest.x == (src.x || src[0] || 0))
  && (dest.y == (src.y || src[1] || 0));
}

utils.equalsXY = equalsXY;

export function distanceBetween(x1, y1, x2, y2) {
  const x = Math.abs(x1 - x2);
  const y = Math.abs(y1 - y2);
  const min = Math.min(x, y);
  return x + y - (0.6 * min);
}

utils.distanceBetween = distanceBetween;

export function distanceFromTo(a, b) {
  return distanceBetween(a.x || a[0] || 0, a.y || a[1] || 0, b.x || b[0] || 0, b.y || b[1] || 0);
}

utils.distanceFromTo = distanceFromTo;

export function dirBetween(x, y, toX, toY) {
	let diffX = toX - x;
	let diffY = toY - y;
	if (diffX && diffY) {
		const absX = Math.abs(diffX);
		const absY = Math.abs(diffY);
		if (absX >= 2 * absY) { diffY = 0; }
		else if (absY >= 2 * absX) { diffX = 0; }
	}
	return [Math.sign(diffX), Math.sign(diffY)];
}

utils.dirBetween = dirBetween;

export function dirFromTo(a, b) {
  return dirBetween(a.x || a[0] || 0, a.y || a[1] || 0, b.x || b[0] || 0, b.y || b[1] || 0);
}

utils.dirFromTo = dirFromTo;


export function extend(obj, name, fn) {
  const base = obj[name] || NOOP;
  const newFn = fn.bind(obj, base.bind(obj));
  newFn.fn = fn;
  newFn.base = base;
  obj[name] = newFn;
}

utils.extend = extend;

export function rebase(obj, name, newBase) {
  const fns = [];
  let fn = obj[name];

  while(fn && fn.fn) {
    fns.push(fn.fn);
    fn = fn.base;
  }

  obj[name] = newBase;

  while(fns.length) {
    fn = fns.pop();
    extend(obj, name, fn);
  }
}

utils.rebase = rebase;

export function cloneObject(obj) {
  const other = Object.create(obj.__proto__);
  utils.assignObject(other, obj);
  return other;
}

utils.cloneObject = cloneObject;

function assignField(dest, src, key) {
  const current = dest[key];
  const updated = src[key];
  if (current && current.copy && updated) {
    current.copy(updated);
  }
  else if (current && current.clear && !updated) {
    current.clear();
  }
  else if (updated && updated.clone) {
    dest[key] = updated.clone();	// just use same object (shallow copy)
  }
  else if (updated && Array.isArray(updated)) {
    dest[key] = updated.slice();
  }
  else if (current && Array.isArray(current)) {
    current.length = 0;
  }
  else {
    dest[key] = updated;
  }
}

export function copyObject(dest, src) {
  Object.keys(dest).forEach( (key) => {
    assignField(dest, src, key);
  });
}

utils.copyObject = copyObject;

export function assignObject(dest, src) {
  Object.keys(src).forEach( (key) => {
    assignField(dest, src, key);
  });
}

utils.assignObject = assignObject;

export function setDefault(obj, field, val) {
  if (obj[field] === undefined) {
    obj[field] = val;
  }
}

utils.setDefault = setDefault;

export function setDefaults(obj, def) {
  Object.keys(def).forEach( (key) => {
    const current = obj[key];
    if (current === undefined) {
      obj[key] = def[key];
    }
  });
}

utils.setDefaults = setDefaults;

export function ERROR(message) {
  throw new Error(message);
}

utils.ERROR = ERROR;

export function WARN(...args) {
  console.warn(...args);
}

utils.WARN = WARN;

export function getOpt(obj, member, _default) {
  const v = obj[member];
  if (v === undefined) return _default;
  return v;
}

utils.getOpt = getOpt;


export function first(field, ...args) {
  for(let arg of args) {
    if (typeof arg !== 'object' || Array.isArray(arg)) {
      return arg;
    }
    if (arg[field] !== undefined) {
      return arg[field];
    }
  }
  return undefined;
}

utils.first = first;

export function arraysIntersect(a, b) {
  return a.some( (av) => b.includes(av) );
}

utils.arraysIntersect = arraysIntersect;


export function sequence(listLength) {
  const list = [];
  let i;
  for (i=0; i<listLength; i++) {
      list[i] = i;
  }
  return list;
}

utils.sequence = sequence;
