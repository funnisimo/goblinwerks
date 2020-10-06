
import { types, make, def, flag, flags } from './gw.js';


///////////////////////////////////
// FLAG

export function Fl(N) { return (1 << N); }

flag.fl = Fl;

// takes a flag of the form Fl(n) and returns n
function unflag(flag) {
  let i;
  for (i=0; i<32; i++) {
    if (flag >> i == 1) {
      return i;
    }
  }
  return -1;
}

function flagToText(flagObj, value) {
  const inverse = Object.entries(flagObj).reduce( (out, [key, value]) => {
    out[value] = key;
    return out;
  }, {});

  const out = [];
  for(let index = 0; index < 32; ++index) {
    const fl = (1 << index);
    if (value & fl) {
      out.push(inverse[fl]);
    }
  }
  return out.join(' | ');
}

function toFlag(obj, ...args) {
  let result = 0;
  for(let index = 0; index < args.length; ++index) {
    let value = args[index];
    if (value === undefined) continue;
    if (typeof value == 'number') {
      result |= value;
      continue;	// next
    }
    else if (typeof value === 'string') {
      value = value.split(/[,|]/).map( (t) => t.trim() );
    }

    if (Array.isArray(value)) {
      value.forEach( (v) => {
        if (typeof v == 'string') {
          v = v.trim();
          if (v.startsWith('!')) {
            const f = obj[v.substring(1)];
            result &= ~f;
          }
          else {
            const f = obj[v];
            if (f) { result |= f; }
          }
        }
        else {
          result |= v;
        }
      });
    }
  }
  return result;
}


export class Flag {
  constructor() {
  }
  toString(v) {
    return flagToText(this, v);
  }
  toFlag(...args) {
    return toFlag(this, ...args);
  }
  install(obj) {
    Object.getOwnPropertyNames(this).forEach( (name) => {
      obj[name] = this[name];
    });
  }
}

types.Flag = Flag;

export function makeFlag(values) {
  const flag = new Flag();
  Object.entries(values).forEach( ([key, value]) => {
    if (typeof value === 'string') {
      value = value.split(/[,|]/).map( (t) => t.trim() );
    }
    if (Array.isArray(value)) {
      value = value.reduce( (out, name) => {
        return out | flag[name];
      }, 0);
    }
    flag[key] = def[key] = value;
  });
  return flag;
}

make.flag = makeFlag;

export function installFlag(flagName, values) {
  const flag = make.flag(values);
  flags[flagName] = flag;
  return flag;
}

flag.install = installFlag;
