
import { utils as UTILS } from './utils.js';
import { cosmetic } from './random.js';
import { types, make } from './gw.js';

export var color = {};
export var colors = {};


export class Color extends Array {
  constructor(...args) {
    if (args.length == 1 && Array.isArray(args[0])) { args = args[0]; }
    while(args.length < 7) args.push(0);
    super(...args.slice(0,7));
    this.dances = (args.length > 7 && !!args[7]);
  }

  get red() 	{ return this[0]; }
  set red(v)  { this[0] = v; }
  get green()  { return this[1]; }
  set green(v) { this[1] = v; }
  get blue() 	{ return this[2]; }
  set blue(v) { this[2] = v; }

  get rand() 	{ return this[3]; }
  set rand(v)  { this[3] = v; }

  get redRand() 	{ return this[4]; }
  set redRand(v)  { this[4] = v; }
  get greenRand()  { return this[5]; }
  set greenRand(v) { this[5] = v; }
  get blueRand() 	{ return this[6]; }
  set blueRand(v) { this[6] = v; }

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

export function makeColor(...args) {
  let hex = args[0];
  if (args.length == 0) { return new types.Color(0,0,0); }
  if (args.length == 1 && hex instanceof types.Color) {
    return hex.clone();
  }
  else if (Array.isArray(hex)) {
    return new types.Color(...hex);
  }
  else if (args.length >= 3) {
    return new types.Color(...args);
  }
  if (typeof hex === 'string') {
    let color = colors[hex] || null;
    if (color) return color.clone();

    if (!hex.startsWith('#')) return null;
    if (hex.length === 4) {
      const r = hex.charAt(1);
      const g = hex.charAt(2);
      const b = hex.charAt(3);
      hex = `#${r}${r}${g}${g}${b}${b}`;
    }
    hex = Number.parseInt(hex.substring(1), 16);
  }

  if (typeof hex === 'number') {
    const r = Math.floor( ((hex & 0xFF0000) >> 16) / 2.55 );
    const g = Math.floor( ((hex & 0x00FF00) >> 8)  / 2.55 );
    const b = Math.floor( (hex & 0x0000FF) / 2.55 );
    return new types.Color(r,g,b);
  }

  return null;
}

make.color = makeColor;


export function installColor(name, ...args) {
	const color = make.color(...args);
	colors[name] = color;
	return color;
}

color.install = installColor;

export function colorFrom(arg) {
  if (typeof arg === 'string') {
    return colors[arg] || make.color(arg);
  }
  return make.color(arg);
}

color.from = colorFrom;


export function applyMix(baseColor, newColor, opacity) {
  if (opacity <= 0) return;
  const weightComplement = 100 - opacity;
  for(let i = 0; i < baseColor.length; ++i) {
    baseColor[i] = Math.floor((baseColor[i] * weightComplement + newColor[i] * opacity) / 100);
  }
  baseColor.dances = (baseColor.dances || newColor.dances);
  return baseColor;
}

color.applyMix = applyMix;
color.applyAverage = applyMix;


function toRGB(v, vr) {
  return UTILS.clamp(Math.round(2.551 * (v + cosmetic.value() * vr) ), 0, 255);
}

const V_TO_CSS = [];
for(let i = 0; i < 256; ++i) {
  V_TO_CSS[i] = i.toString(16).padStart(2, '0');
}

function toCSS(v) {
  return V_TO_CSS[Math.floor(v)];
}

export function css(color) {
  const rand = cosmetic.value() * (color.rand || 0);
  const red = toRGB(color.red + rand, color.redRand);
  const green = toRGB(color.green + rand, color.greenRand);
  const blue = toRGB(color.blue + rand, color.blueRand);
  return `#${toCSS(red)}${toCSS(green)}${toCSS(blue)}`;
}

color.css = css;

export function equals(a, b) {
  return a.every( (v, i) => v == b[i] ) && a.dances == b.dances;
}

color.equals = equals;

export function clampColor(theColor) {
  theColor.red		= UTILS.clamp(theColor.red, 0, 100);
  theColor.green	= UTILS.clamp(theColor.green, 0, 100);
  theColor.blue		= UTILS.clamp(theColor.blue, 0, 100);
}

color.clamp = clampColor;


export function bakeColor(/* color */theColor) {
  let rand;
  rand = cosmetic.range(0, theColor.rand);
  theColor.red   += Math.round(cosmetic.range(0, theColor.redRand) + rand);
  theColor.green += Math.round(cosmetic.range(0, theColor.greenRand) + rand);
  theColor.blue  += Math.round(cosmetic.range(0, theColor.blueRand) + rand);
  theColor.redRand = theColor.greenRand = theColor.blueRand = theColor.rand = 0;
}

color.bake = bakeColor;


export function lightenColor(destColor, percent) {
  UTILS.clamp(percent, 0, 100);
  destColor.red =    Math.round(destColor.red + (100 - destColor.red) * percent / 100);
  destColor.green =  Math.round(destColor.green + (100 - destColor.green) * percent / 100);
  destColor.blue =   Math.round(destColor.blue + (100 - destColor.blue) * percent / 100);

  // leave randoms the same
  return destColor;
}

color.lighten = lightenColor;

export function darkenColor(destColor, percent) {
  UTILS.clamp(percent, 0, 100);
  destColor.red =    Math.round(destColor.red * (100 - percent) / 100);
  destColor.green =  Math.round(destColor.green * (100 - percent) / 100);
  destColor.blue =   Math.round(destColor.blue * (100 - percent) / 100);

  // leave randoms the same
  return destColor;
}

color.darken = darkenColor;


function applyColorAugment(baseColor, augmentColor, weight) {
  baseColor.red += Math.floor((augmentColor.red * weight) / 100);
  baseColor.redRand += Math.floor((augmentColor.redRand * weight) / 100);
  baseColor.green += Math.floor((augmentColor.green * weight) / 100);
  baseColor.greenRand += Math.floor((augmentColor.greenRand * weight) / 100);
  baseColor.blue += Math.floor((augmentColor.blue * weight) / 100);
  baseColor.blueRand += Math.floor((augmentColor.blueRand * weight) / 100);
  baseColor.rand += Math.floor((augmentColor.rand * weight) / 100);
  return baseColor;
}

color.applyAugment = applyColorAugment;


function applyColorMultiplier(baseColor, multiplierColor) {
  baseColor.red = Math.round(baseColor.red * multiplierColor.red / 100);
  baseColor.redRand = Math.round(baseColor.redRand * multiplierColor.redRand / 100);
  baseColor.green = Math.round(baseColor.green * multiplierColor.green / 100);
  baseColor.greenRand = Math.round(baseColor.greenRand * multiplierColor.greenRand / 100);
  baseColor.blue = Math.round(baseColor.blue * multiplierColor.blue / 100);
  baseColor.blueRand = Math.round(baseColor.blueRand * multiplierColor.blueRand / 100);
  baseColor.rand = Math.round(baseColor.rand * multiplierColor.rand / 100);
  baseColor.dances = baseColor.dances || multiplierColor.dances;
  return baseColor;
}

color.applyMultiplier = applyColorMultiplier;

function applyColorScalar(baseColor, scalar) {
  baseColor.red          = Math.round(baseColor.red        * scalar / 100);
  baseColor.redRand      = Math.round(baseColor.redRand    * scalar / 100);
  baseColor.green        = Math.round(baseColor.green      * scalar / 100);
  baseColor.greenRand    = Math.round(baseColor.greenRand  * scalar / 100);
  baseColor.blue         = Math.round(baseColor.blue       * scalar / 100);
  baseColor.blueRand     = Math.round(baseColor.blueRand   * scalar / 100);
  baseColor.rand         = Math.round(baseColor.rand       * scalar / 100);
}

color.applyScalar = applyColorScalar;

function _randomizeColorByPercent(input, percent) {
  return (cosmetic.range( Math.floor(input * (100 - percent) / 100), Math.floor(input * (100 + percent) / 100)));
}

function randomizeColor(baseColor, randomizePercent) {
  baseColor.red = _randomizeColorByPercent(baseColor.red, randomizePercent);
  baseColor.green = _randomizeColorByPercent(baseColor.green, randomizePercent);
  baseColor.blue = _randomizeColorByPercent(baseColor.blue, randomizePercent);
}

color.randomize = randomizeColor;

function swapColors(color1, color2) {
    const tempColor = color1.clone();
    color1.copy(color2);
    color2.copy(tempColor);
}

color.swap = swapColors;

const MIN_COLOR_DIFF =			600;

// weighted sum of the squares of the component differences. Weights are according to color perception.
function colorDiff(f, b)		 {
  return ((f.red - b.red) * (f.red - b.red) * 0.2126
    + (f.green - b.green) * (f.green - b.green) * 0.7152
    + (f.blue - b.blue) * (f.blue - b.blue) * 0.0722);
}

color.diff = colorDiff;

function normColor(baseColor, aggregateMultiplier, colorTranslation) {

    baseColor.red += colorTranslation;
    baseColor.green += colorTranslation;
    baseColor.blue += colorTranslation;
    const vectorLength =  baseColor.red + baseColor.green + baseColor.blue;

    if (vectorLength != 0) {
        baseColor.red =    Math.round(baseColor.red * 300    / vectorLength * aggregateMultiplier / 100);
        baseColor.green =  Math.round(baseColor.green * 300  / vectorLength * aggregateMultiplier / 100);
        baseColor.blue =   Math.round(baseColor.blue * 300   / vectorLength * aggregateMultiplier / 100);
    }
    baseColor.redRand = 0;
    baseColor.greenRand = 0;
    baseColor.blueRand = 0;
    baseColor.rand = 0;
}

color.normalize = normColor;


// if forecolor is too similar to back, darken or lighten it and return true.
// Assumes colors have already been baked (no random components).
function separateColors(/* color */ fore, /* color */ back) {
  let f, b, modifier = null;
  let failsafe;
  let madeChange;

  f = fore.clone();
  b = back.clone();

  f.red			= UTILS.clamp(f.red, 0, 100);
  f.green		= UTILS.clamp(f.green, 0, 100);
  f.blue		= UTILS.clamp(f.blue, 0, 100);
  b.red			= UTILS.clamp(b.red, 0, 100);
  b.green		= UTILS.clamp(b.green, 0, 100);
  b.blue		= UTILS.clamp(b.blue, 0, 100);

  if (f.red + f.blue + f.green > 50 * 3) {
    modifier = colors.black;
  } else {
    modifier = colors.white;
  }

  madeChange = false;
  failsafe = 10;

  while(color.diff(f, b) < MIN_COLOR_DIFF && --failsafe) {
    applyMix(f, modifier, 20);
    madeChange = true;
  }

  if (madeChange) {
    fore.copy(f);
    return true;
  } else {
    return false;
  }
}

color.separate = separateColors;


export function installColorSpread(name, r, g, b) {
	let baseColor;
	baseColor = installColor(name, r, g, b);
	installColor('light_' + name, color.lighten(baseColor.clone(), 25));
	installColor('lighter_' + name, color.lighten(baseColor.clone(), 50));
	installColor('lightest_' + name, color.lighten(baseColor.clone(), 75));
	installColor('dark_' + name, color.darken(baseColor.clone(), 25));
	installColor('darker_' + name, color.darken(baseColor.clone(), 50));
	installColor('darkest_' + name, color.darken(baseColor.clone(), 75));
	return baseColor;
}

color.installSpread = installColorSpread;

installColor('white', 				100,	100,	100);
installColor('black', 				0,		0,		0);

installColorSpread('teal', 				30,		100,	100);
installColorSpread('brown', 			60,		40,		0);
installColorSpread('tanColor', 		80,		67,		15);
installColorSpread('pink', 				100,	60,		66);
installColorSpread('gray', 				50,		50,		50);
installColorSpread('yellow', 			100,	100,	0);
installColorSpread('purple', 			100,	0,		100);
installColorSpread('green', 			0,		100,	0);
installColorSpread('orange', 			100,	50,		0);
installColorSpread('blue', 				0,		0,		100);
installColorSpread('red', 				100,	0,		0);

installColorSpread('amber', 			100,  75,   0);
installColorSpread('flame', 			100,  25,   0);
installColorSpread('fuchsia', 		100,  0,    100);
installColorSpread('magenta', 		100,  0,    75);
installColorSpread('crimson', 		100,  0,    25);
installColorSpread('lime', 			  75,   100,  0);
installColorSpread('chartreuse',  50,   100,  0);
installColorSpread('sepia', 			50,   40,   25);
installColorSpread('violet', 		  50,   0,    100);
installColorSpread('han', 				25,   0,    100);
installColorSpread('cyan', 			  0,    100,  100);
installColorSpread('turquoise', 	0,    100,  75);
installColorSpread('sea', 				0,    100,  50);
installColorSpread('sky', 				0,    75,   100);
installColorSpread('azure', 			0,    50,   100);
