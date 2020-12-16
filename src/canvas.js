
import { Canvas, Canvas2D, NotSupportedError, Glyphs, withImage, configure } from 'gw-canvas';

import { cosmetic } from 'gw-utils';
import * as GW from './gw.js';


const DEFAULT_FONT = 'monospace';

GW.types.Canvas = Canvas;

export { Canvas };

configure({
  random: cosmetic.value.bind(cosmetic),
});


export function makeGlyphs(opts={}) {
  if (typeof opts === 'string') {
    opts = { font: opts };
  }
  else if (typeof opts === 'number') {
    opts = { size: opts };
  }
  opts.font = opts.font || DEFAULT_FONT;
  opts.basic = true;

  const glyphs = Glyphs.fromFont(opts);

  [
    // arrows (4)
    '\u2190', '\u2191', '\u2192', '\u2193',

    // border drawing (11)
    '\u2550','\u2551','\u2554','\u2557','\u255A','\u255D','\u2560','\u2563','\u2566','\u2569','\u256C',

    // Floor,  dagger   omega    target 1, target 2, open flag, flag      3 dots    4 dots
    '\u2219', '\u2020', '\u03A9', '\u25ef', '\u25ce', '\u2690', '\u2691', '\u2234', '\u2237',

  ].forEach( (ch, i) => {
    glyphs.draw(i + 1, ch);
  });

  return glyphs;
}

GW.make.glyphs = makeGlyphs;


function makeCanvas(opts={}) {
  const glyphs = makeGlyphs(opts);
  opts.glyphs = glyphs;
  try {
    return new Canvas(opts);
  }
  catch(e) {
    if (!(e instanceof NotSupportedError)) throw e;
  }

  return new Canvas2D(opts);
}

GW.make.canvas = makeCanvas;
