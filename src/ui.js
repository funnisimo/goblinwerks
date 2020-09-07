
import { pause } from './io.js';
import { data as DATA } from './gw.js';


export var ui = {};

export async function messageBox(text, fg, duration) {

  const canvas = DATA.canvas;
  const base = GW.data.canvas.allocBuffer();

  const len = text.length;
  const x = Math.floor((canvas.width - len - 4) / 2) - 2;
  const y = Math.floor(canvas.height / 2) - 1;
  canvas.fillRect(x, y, len + 4, 3, ' ', 'black', 'black');
	canvas.plotText(x + 2, y + 1, text, fg || 'white');
	canvas.draw();

	await pause(duration || 30 * 1000);

	canvas.overlay(base);
}

ui.messageBox = messageBox;
