
import { types, color, colors } from './gw.js';


export class Color extends Array {
  constructor(...args) {
    if (args.length == 1 && Array.isArray(args[0])) { args = args[0]; }
    while(args.length < 7) args.push(0);
    super(...args.slice(0,7));
    this.dances = (args.length > 7 && args[7]);
  }

  get red() 	{ return this[0]; }
  set red(v)  { this[0] = v; }
  get green()  { return this[1]; }
  set green(v) { this[1] = v; }
  get blue() 	{ return this[2]; }
  set blue(v) { this[2] = v; }

  get redRand() 	{ return this[3]; }
  set redRand(v)  { this[3] = v; }
  get greenRand()  { return this[4]; }
  set greenRand(v) { this[4] = v; }
  get blueRand() 	{ return this[5]; }
  set blueRand(v) { this[5] = v; }

  get rand() 	{ return this[6]; }
  set rand(v)  { this[6] = v; }

  clone() {
    const other = new Color(...this);
    other.dances = this.dances;
    return other;
  }

  copy(other) {
    for(let i = 0; i < 7; ++i) {
      this[i] = other[i] || 0;
    }
    this.dances = other.dances || false;
    return this;
  }

  clear() {
    for(let i = 0; i < 7; ++i) {
      this[i] = 0;
    }
    this.dances = false;
  }

}

types.Color = Color;



export function applyMix(baseColor, newColor, opacity) {
  if (opacity <= 0) return;
  const weightComplement = 100 - opacity;
  baseColor[0] = Math.floor((baseColor[0] * weightComplement + newColor[0] * opacity) / 100);
  baseColor[1] = Math.floor((baseColor[1] * weightComplement + newColor[1] * opacity) / 100);
  baseColor[2] = Math.floor((baseColor[2] * weightComplement + newColor[2] * opacity) / 100);
}

color.applyMix = applyMix;