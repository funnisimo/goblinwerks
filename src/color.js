
import { types, make as MAKE, colors } from './gw.js';
import { Color as GWColor, configure } from 'gw-canvas';


configure({
  colorLookup(name) {
    return colors[name] || null
  },
});


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
