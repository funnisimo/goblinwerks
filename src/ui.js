
import { utils as UTILS } from './utils.js';
import { io as IO } from './io.js';
import { data as DATA, types } from './gw.js';


export var ui = {};


export function init(opts={}) {

  UTILS.setDefaults(opts, {
    width: 100,
    height: 34,
    bg: 'black',
    sidebar: false,
    messages: false,
    flavor: false,
    menu: false,
    div: 'canvas',
    io: true,
  });


  if (!ui.canvas) {
    ui.canvas = new types.Canvas(opts.width, opts.height, opts.div, opts);

    if (opts.io && typeof document !== 'undefined') {
      ui.canvas.element.onmousedown = ui.onmousedown;
      ui.canvas.element.onmousemove = ui.onmousemove;
    	document.onkeydown = ui.onkeydown;
    }
  }

  // TODO - init sidebar, messages, flavor, menu

  ui.buffer = ui.canvas.buffer;
  return ui.canvas;
}

ui.init = init;


export function onkeydown(e) {
	if (IO.ignoreKeyEvent(e)) return;

	if (e.code === 'Escape') {
		IO.clearEvents();	// clear all current events, then push on the escape
  }

	const ev = IO.makeKeyEvent(e);
	IO.pushEvent(ev);
}

ui.onkeydown = onkeydown;

export function onmousemove(e) {
	const x = ui.canvas.toX(e.clientX);
	const y = ui.canvas.toY(e.clientY);
	const ev = IO.makeMouseEvent(e, x, y);
	IO.pushEvent(ev);
}

ui.onmousemove = onmousemove;

export function onmousedown(e) {
	const x = ui.canvas.toX(e.clientX);
	const y = ui.canvas.toY(e.clientY);
	const ev = IO.makeMouseEvent(e, x, y);
	IO.pushEvent(ev);
}

ui.onmousedown = onmousedown;



export async function messageBox(text, fg, duration) {

  const canvas = ui.canvas;
  const base = canvas.allocBuffer();

  const len = text.length;
  const x = Math.floor((canvas.width - len - 4) / 2) - 2;
  const y = Math.floor(canvas.height / 2) - 1;
  canvas.fillRect(x, y, len + 4, 3, ' ', 'black', 'black');
	canvas.plotText(x + 2, y + 1, text, fg || 'white');
	canvas.draw();

	await IO.pause(duration || 30 * 1000);

	canvas.overlay(base);
}

ui.messageBox = messageBox;
