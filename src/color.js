
import { cosmetic } from './random.js';
import * as Utils from './utils.js';
import { types, make as MAKE, colors } from './gw.js';

import { Color as GWColor, configure } from 'gw-canvas';


configure({
  colorLookup(name) {
    return colors[name] || null
  },
});

// export var color = {};


// export class Color extends Array {
//   constructor(...args) {
//     if (args.length == 1 && Array.isArray(args[0])) { args = args[0]; }
//     while(args.length < 7) args.push(0);
//     super(...args.slice(0,7));
//     this.dances = (args.length > 7 && !!args[7]);
//   }
//
//   get red() 	{ return this[0]; }
//   set red(v)  { this[0] = v; }
//   get green()  { return this[1]; }
//   set green(v) { this[1] = v; }
//   get blue() 	{ return this[2]; }
//   set blue(v) { this[2] = v; }
//
//   get rand() 	{ return this[3]; }
//   set rand(v)  { this[3] = v; }
//
//   get redRand() 	{ return this[4]; }
//   set redRand(v)  { this[4] = v; }
//   get greenRand()  { return this[5]; }
//   set greenRand(v) { this[5] = v; }
//   get blueRand() 	{ return this[6]; }
//   set blueRand(v) { this[6] = v; }
//
//   clone() {
//     const other = new Color(...this);
//     other.dances = this.dances;
//     other.id = this.id;
//     return other;
//   }
//
//   copy(other) {
//     for(let i = 0; i < 7; ++i) {
//       this[i] = other[i] || 0;
//     }
//     this.dances = other.dances || false;
//     this.id = other.id;
//     return this;
//   }
//
//   clear() {
//     for(let i = 0; i < 7; ++i) {
//       this[i] = 0;
//     }
//     this.dances = false;
//     this.id = null;
//   }
//
//   css() {
//     const rand = cosmetic.value() * (this.rand || 0);
//     const red = toRGB(this.red + rand, this.redRand);
//     const green = toRGB(this.green + rand, this.greenRand);
//     const blue = toRGB(this.blue + rand, this.blueRand);
//     return `#${toCSS(red)}${toCSS(green)}${toCSS(blue)}`;
//   }
//
//   equals(other) {
//     if (!other) return false;
//     return this.every( (v, i) => v === other[i] ) && this.dances === other.dances;
//   }
//
//   clamp() {
//     this.red		= Utils.clamp(this.red, 0, 100);
//     this.green	= Utils.clamp(this.green, 0, 100);
//     this.blue		= Utils.clamp(this.blue, 0, 100);
//   }
//
//   add(other, pct=100) {
//     other = from(other);
//
//     this.red += Math.floor((other.red * pct) / 100);
//     this.redRand += Math.floor((other.redRand * pct) / 100);
//     this.green += Math.floor((other.green * pct) / 100);
//     this.greenRand += Math.floor((other.greenRand * pct) / 100);
//     this.blue += Math.floor((other.blue * pct) / 100);
//     this.blueRand += Math.floor((other.blueRand * pct) / 100);
//     this.rand += Math.floor((other.rand * pct) / 100);
//     this.id = null;
//     return this;
//   }
//
//   mix(other, opacity=100) {
//     other = from(other);
//
//     if (opacity <= 0) return this;
//     if (opacity >= 100) {
//       this.copy(other);
//       return this;
//     }
//
//     const weightComplement = 100 - opacity;
//     for(let i = 0; i < this.length; ++i) {
//       this[i] = Math.floor((this[i] * weightComplement + other[i] * opacity) / 100);
//     }
//     this.dances = (this.dances || other.dances);
//     this.id = null;
//     return this;
//   }
//
//   multiply(other) {
//     this.red = Math.round(this.red * other[0] / 100);
//     this.green = Math.round(this.green * other[1] / 100);
//     this.blue = Math.round(this.blue * other[2] / 100);
//
//     if (other instanceof Color) {
//       this.rand = Math.round(this.rand * other.rand / 100);
//       this.redRand = Math.round(this.redRand * other.redRand / 100);
//       this.greenRand = Math.round(this.greenRand * other.greenRand / 100);
//       this.blueRand = Math.round(this.blueRand * other.blueRand / 100);
//       this.dances = this.dances || other.dances;
//     }
//     this.id = null;
//     return this;
//   }
//
//   applyScalar(other) {
//     this.red          = Math.round(this.red        * other / 100);
//     this.redRand      = Math.round(this.redRand    * other / 100);
//     this.green        = Math.round(this.green      * other / 100);
//     this.greenRand    = Math.round(this.greenRand  * other / 100);
//     this.blue         = Math.round(this.blue       * other / 100);
//     this.blueRand     = Math.round(this.blueRand   * other / 100);
//     this.rand         = Math.round(this.rand       * other / 100);
//     this.id = null;
//     return this;
//   }
//
//   bake() {
//     let rand;
//     rand = cosmetic.range(0, this.rand);
//     this.red   += Math.round(cosmetic.range(0, this.redRand) + rand);
//     this.green += Math.round(cosmetic.range(0, this.greenRand) + rand);
//     this.blue  += Math.round(cosmetic.range(0, this.blueRand) + rand);
//     this.redRand = this.greenRand = this.blueRand = this.rand = 0;
//     this.id = null;
//     return this;
//   }
//
//
//   lighten(percent) {
//     Utils.clamp(percent, 0, 100);
//     this.red =    Math.round(this.red + (100 - this.red) * percent / 100);
//     this.green =  Math.round(this.green + (100 - this.green) * percent / 100);
//     this.blue =   Math.round(this.blue + (100 - this.blue) * percent / 100);
//
//     // leave randoms the same
//     this.id = null;
//     return this;
//   }
//
//   darken(percent) {
//     Utils.clamp(percent, 0, 100);
//     this.red =    Math.round(this.red * (100 - percent) / 100);
//     this.green =  Math.round(this.green * (100 - percent) / 100);
//     this.blue =   Math.round(this.blue * (100 - percent) / 100);
//
//     // leave randoms the same
//     this.id = null;
//     return this;
//   }
//
//   randomize(randomizePercent) {
//     this.red = _randomizeColorByPercent(this.red, randomizePercent);
//     this.green = _randomizeColorByPercent(this.green, randomizePercent);
//     this.blue = _randomizeColorByPercent(this.blue, randomizePercent);
//     this.id = null;
//     return this;
//   }
//
//   toString() {
//     return this.id || this.toString(true);
//   }
// }

export class Color extends GWColor {
  constructor(...args) {
    super(...args);
    this.id = null;
    this.dances = !!args[7];
  }

  copy(other) {
    this.dances = other.dances;
    this.id = other.id;
    return super.copy(other);
  }

  _changed() {
    this.id = null;
    return this;
  }

  // fromInt(val, base256) {
  //   this.dances = false;
  //   return super.fromInt(val, base256);
  // }

  mix(other, pct) {
    this.dances = this.dances || other.dances;
    return super.mix(other, pct);
  }

  add(other, pct) {
    this.dances = this.dances || other.dances;
    return super.add(other, pct);
  }

  toString(...args) {
    if (this.id) return this.id;
    return super.toString(...args);
  }
}


export const separate = Color.separate.bind(Color);

types.Color = Color;


export function make(...args) {
  if (args.length == 0) return new Color(0,0,0);
  if (args.length == 1 && typeof args[0] === 'string') {
    const color = colors[args[0]];
    if (color) return color.clone();
  }
  if (args.length >= 3) {
    return Color.make(args);
  }
  return Color.make(...args);
}

MAKE.color = make;




export function from(arg, base256) {
  if (typeof arg === 'string') {
    const color = colors[arg];
    if (color) return color;
  }
  if (arg instanceof Color) {
    return arg;
  }
  return Color.from(arg, base256);
}

export function addKind(name, ...args) {
  let color;
  if (args.length == 1 && args[0] instanceof Color) {
    color = args[0];
  }
  else {
    color = make(...args);
  }
	colors[name] = color;
  color.id = name;
	return color;
}


//
// function toRGB(v, vr) {
//   return Utils.clamp(Math.round(2.551 * (v + cosmetic.value() * vr) ), 0, 255);
// }
//
// const V_TO_CSS = [];
// for(let i = 0; i < 256; ++i) {
//   V_TO_CSS[i] = i.toString(16).padStart(2, '0');
// }
//
// function toCSS(v) {
//   return V_TO_CSS[Math.floor(v)];
// }

// export function css(color) {
//     return color.toString(true);
// }
//
// color.css = css;


// export function intensity(color) {
//   return Math.max(color._r, color._g, color._b);
// }

//
//
// function _randomizeColorByPercent(input, percent) {
//   return (cosmetic.range( Math.floor(input * (100 - percent) / 100), Math.floor(input * (100 + percent) / 100)));
// }



export function swap(color1, color2) {
    const tempColor = color1.clone();
    color1.copy(color2);
    color2.copy(tempColor);
}


const MIN_COLOR_DIFF =			600;

// weighted sum of the squares of the component differences. Weights are according to color perception.
export function diff(f, b)		 {
  return ((f._r - b._r) * (f._r - b._r) * 0.2126
    + (f._g - b._g) * (f._g - b._g) * 0.7152
    + (f._b - b._b) * (f._b - b._b) * 0.0722);
}

//
// export function normalize(baseColor, aggregateMultiplier, colorTranslation) {
//
//     baseColor.red += colorTranslation;
//     baseColor.green += colorTranslation;
//     baseColor.blue += colorTranslation;
//     const vectorLength =  baseColor.red + baseColor.green + baseColor.blue;
//
//     if (vectorLength != 0) {
//         baseColor.red =    Math.round(baseColor.red * 300    / vectorLength * aggregateMultiplier / 100);
//         baseColor.green =  Math.round(baseColor.green * 300  / vectorLength * aggregateMultiplier / 100);
//         baseColor.blue =   Math.round(baseColor.blue * 300   / vectorLength * aggregateMultiplier / 100);
//     }
//     baseColor.redRand = 0;
//     baseColor.greenRand = 0;
//     baseColor.blueRand = 0;
//     baseColor.rand = 0;
// }


//
// // if forecolor is too similar to back, darken or lighten it and return true.
// // Assumes colors have already been baked (no random components).
// export function separate(/* color */ fore, /* color */ back) {
//   let f, b, modifier = null;
//   let failsafe;
//   let madeChange;
//
//   f = fore.clone();
//   b = back.clone();
//
//   f.red			= Utils.clamp(f.red, 0, 100);
//   f.green		= Utils.clamp(f.green, 0, 100);
//   f.blue		= Utils.clamp(f.blue, 0, 100);
//   b.red			= Utils.clamp(b.red, 0, 100);
//   b.green		= Utils.clamp(b.green, 0, 100);
//   b.blue		= Utils.clamp(b.blue, 0, 100);
//
//   if (f.red + f.blue + f.green > 50 * 3) {
//     modifier = colors.black;
//   } else {
//     modifier = colors.white;
//   }
//
//   madeChange = false;
//   failsafe = 10;
//
//   while(diff(f, b) < MIN_COLOR_DIFF && --failsafe) {
//     f.mix(modifier, 20);
//     madeChange = true;
//   }
//
//   if (madeChange) {
//     fore.copy(f);
//     return true;
//   } else {
//     return false;
//   }
// }



export function addSpread(name, r, g, b) {
	let baseColor;
	baseColor = addKind(name, r, g, b);
	addKind('light_' + name, baseColor.clone().lighten(25));
	addKind('lighter_' + name, baseColor.clone().lighten(50));
	addKind('lightest_' + name, baseColor.clone().lighten(75));
	addKind('dark_' + name, baseColor.clone().darken(25));
	addKind('darker_' + name, baseColor.clone().darken(50));
	addKind('darkest_' + name, baseColor.clone().darken(75));
	return baseColor;
}


addKind('white', 				100,	100,	100);
addKind('black', 				0,		0,		0);

addSpread('teal', 				30,		100,	100);
addSpread('brown', 			60,		40,		0);
addSpread('tan', 		    80,		70,   55); // 80, 67,		15);
addSpread('pink', 				100,	60,		66);
addSpread('gray', 				50,		50,		50);
addSpread('yellow', 			100,	100,	0);
addSpread('purple', 			100,	0,		100);
addSpread('green', 			0,		100,	0);
addSpread('orange', 			100,	50,		0);
addSpread('blue', 				0,		0,		100);
addSpread('red', 				100,	0,		0);

addSpread('amber', 			100,  75,   0);
addSpread('flame', 			100,  25,   0);
addSpread('fuchsia', 		100,  0,    100);
addSpread('magenta', 		100,  0,    75);
addSpread('crimson', 		100,  0,    25);
addSpread('lime', 			  75,   100,  0);
addSpread('chartreuse',  50,   100,  0);
addSpread('sepia', 			50,   40,   25);
addSpread('violet', 		  50,   0,    100);
addSpread('han', 				25,   0,    100);
addSpread('cyan', 			  0,    100,  100);
addSpread('turquoise', 	0,    100,  75);
addSpread('sea', 				0,    100,  50);
addSpread('sky', 				0,    75,   100);
addSpread('azure', 			0,    50,   100);
addSpread('silver',      75,   75,   75);
addSpread('gold',        100,  85,   0);
