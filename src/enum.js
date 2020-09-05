

import { types, def } from './gw.js';

///////////////////////////////////
// ENUM

// export var enums = {};
// export var enum = {};

export class Enum {
  constructor(...names) {
    let offset = 0;
    if (typeof names[0] === 'number') {
      offset = names.shift();
    }
    names.forEach( (name, index) => {
      this[name] = index + offset;
    });
  }

  toString(v) {
    if (v === undefined) return JSON.stringify(this);
    return Object.entries(this).reduce( (out, [key, value]) => (value == v) ? key : out, '?' );
  }
}

types.Enum = Enum;

// export function installEnum(enumName, ...names) {
//   const out = new types.Enum(...names);
//   enums[enumName] = out;
//   return out;
// }
//
// enum.install = installEnum;
