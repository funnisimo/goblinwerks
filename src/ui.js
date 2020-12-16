
// import { withFont } from 'gw-canvas';

import * as Flags from './flags.js';
import { utils as Utils, io as IO } from 'gw-core';
import * as SPRITE from './sprite.js';
import * as Color from './color.js';
import * as Text from './text.js';
import { Buffer } from './buffer.js';
import * as FX from './fx.js';
import { data as DATA, types, ui, message as MSG, def, viewport as VIEWPORT, flavor as FLAVOR, make, sidebar as SIDEBAR, config as CONFIG, colors as COLORS } from './gw.js';

const COMMANDS = IO.commands;

ui.debug = Utils.NOOP;

let SHOW_FLAVOR = false;
let SHOW_SIDEBAR = false;
let SHOW_CURSOR = false;
let SHOW_PATH = false;
let PATH_ACTIVE = false;
let CLICK_MOVE = false;


let UI_BUFFER = null;
let UI_BASE = null;
let UI_OVERLAY = null;
let IN_DIALOG = false;
let REDRAW_UI = false;

let time = 0;

let LOOP;

function uiLoop(t) {
	t = t || performance.now();

  // if (RUNNING) {
  //   requestAnimationFrame(uiLoop);
  // }

	const dt = Math.floor(t - time);
	time = t;

	if ((!IN_DIALOG) && FX.tick(dt)) {
		ui.draw();
	}
	else {
		const ev = IO.makeTickEvent(dt);
		IO.pushEvent(ev);
	}
  //
	// ui.canvas.render();
}


export function start(opts={}) {

  Utils.setDefaults(opts, {
    width: 100,
    height: 34,
    bg: 'black',
    sidebar: false,
    messages: false,
    wideMessages: false,
		cursor: false,
		flavor: false,
    menu: false,
    div: 'canvas',
    io: true,
    followPlayer: false,
    loop: true,
    autoCenter: false,
    showPath: false,
    clickToMove: false,
  });

  if (!ui.canvas && (opts.canvas !== false)) {
    ui.canvas = make.canvas({ width: opts.width, height: opts.height, div: opts.div, font: opts.font, tileWidth: 14, tileHeight: 16 });
    ui.buffer = new Buffer(ui.canvas);

    if (opts.io && typeof document !== 'undefined') {
      ui.canvas.node.onmousedown = ui.onmousedown;
      ui.canvas.node.onmousemove = ui.onmousemove;
      ui.canvas.node.onmouseup = ui.onmouseup;
    	document.onkeydown = ui.onkeydown;
    }

    // TODO - init sidebar, messages, flavor, menu
    UI_BUFFER = UI_BUFFER || new Buffer(ui.canvas);
    UI_BASE = UI_BASE || new Buffer(ui.canvas);
    // UI_OVERLAY = UI_OVERLAY || new Buffer(ui.canvas);
    // UI_BASE.nullify();
    // UI_OVERLAY.nullify();

    ui.blackOutDisplay();
  }

  IN_DIALOG = false;
  REDRAW_UI = false;

  if (opts.sidebar === true) {
    opts.sidebar = 20;
  }

	let viewX = 0;
	let viewY = 0;
	let viewW = opts.width;
	let viewH = opts.height;

	let flavorLine = -1;

  if (opts.messages) {
    viewH -= Math.abs(opts.messages);
  }
  if (opts.flavor) {
    viewH -= 1;
  }

  if (opts.sidebar) {
    const sideH = (opts.wideMessages ? viewH : opts.height);
    let sideY = (opts.wideMessages && opts.messages > 0) ? opts.height - viewH : 0;

    if (opts.sidebar < 0) { // right side
      viewW += opts.sidebar;  // subtract
      SIDEBAR.setup({ x: viewW, y: sideY, width: -opts.sidebar, height: sideH });
    }
    else {  // left side
      viewW -= opts.sidebar;
      viewX = opts.sidebar;
      SIDEBAR.setup({ x: 0, y: sideY, width: opts.sidebar, height: sideH });
    }
  }

  const msgW = (opts.wideMessages ? opts.width : viewW);
  const msgX = (opts.wideMessages ? 0 : viewX);

	if (opts.messages) {
		if (opts.messages < 0) {	// on bottom of screen
			MSG.setup({x: msgX, y: opts.height + opts.messages, width: msgW, height: -opts.messages, archive: opts.height });
			if (opts.flavor) {
				flavorLine = opts.height + opts.messages - 1;
			}
		}
		else {	// on top of screen
			MSG.setup({x: msgX, y: 0, width: msgW, height: opts.messages, archive: opts.height });
			viewY = opts.messages;
			if (opts.flavor) {
				viewY += 1;
				flavorLine = opts.messages;
			}
		}
	}

	if (opts.flavor) {
		FLAVOR.setup({ x: msgX, y: flavorLine, w: msgW, h: 1 });
    SHOW_FLAVOR = true;
	}

	VIEWPORT.setup({ x: viewX, y: viewY, w: viewW, h: viewH, followPlayer: opts.followPlayer, autoCenter: opts.autoCenter });
	SHOW_CURSOR = opts.cursor;
  SHOW_PATH = opts.showPath;
  CLICK_MOVE = opts.clickToMove;

  if (opts.loop) {
    LOOP = setInterval(uiLoop, 16);
  	// uiLoop();
  }

  return ui.canvas;
}

ui.start = start;


export function stop() {
  if (!LOOP) return;
  clearInterval(LOOP);
	LOOP = null;
}

ui.stop = stop;



export async function dispatchEvent(ev) {

	if (ev.type === IO.CLICK) {
		if (MSG.bounds && MSG.bounds.containsXY(ev.x, ev.y)) {
			await MSG.showArchive();
			return true;
		}
		else if (FLAVOR.bounds && FLAVOR.bounds.containsXY(ev.x, ev.y)) {
			return true;
		}
    else if (VIEWPORT.bounds && VIEWPORT.bounds.containsXY(ev.x, ev.y)) {
      ev.mapX = VIEWPORT.bounds.toInnerX(ev.x);
      ev.mapY = VIEWPORT.bounds.toInnerY(ev.y);
      // if (CONFIG.followPlayer && DATA.player && (DATA.player.x >= 0)) {
      //   const offsetX = DATA.player.x - VIEWPORT.bounds.centerX();
      //   const offsetY = DATA.player.y - VIEWPORT.bounds.centerY();
      //   x0 += offsetX;
      //   y0 += offsetY;
      // }
      // ev.mapX = x0;
      // ev.mapY = y0;
      if (CLICK_MOVE) {
        return await COMMANDS.travel(ev);
      }
    }
    else if (SIDEBAR.bounds && SIDEBAR.bounds.containsXY(ev.x, ev.y)) {
      if (CLICK_MOVE) {
        ev.mapX = CURSOR.x;
        ev.mapY = CURSOR.y;
        return await COMMANDS.travel(ev);
      }
    }
	}
	else if (ev.type === IO.MOUSEMOVE) {
    PATH_ACTIVE = true;
    MOUSE.x = ev.x;
    MOUSE.y = ev.y;
		if (VIEWPORT.bounds && VIEWPORT.bounds.containsXY(ev.x, ev.y)) {
      let x0 = VIEWPORT.bounds.toInnerX(ev.x);
      let y0 = VIEWPORT.bounds.toInnerY(ev.y);
      // if (CONFIG.followPlayer && DATA.player && (DATA.player.x >= 0)) {
      //   const offsetX = DATA.player.x - VIEWPORT.bounds.centerX();
      //   const offsetY = DATA.player.y - VIEWPORT.bounds.centerY();
      //   x0 += offsetX;
      //   y0 += offsetY;
      // }
      // ev.mapX = x0;
      // ev.mapY = y0;

			ui.setCursor(x0, y0);
      if (SIDEBAR.bounds) {
        SIDEBAR.focus(x0, y0);
      }
			return true;
		}
    else if (SIDEBAR.bounds && SIDEBAR.bounds.containsXY(ev.x, ev.y)) {
      SIDEBAR.highlightRow(ev.y);
    }
		else {
      ui.clearCursor();
      SIDEBAR.focus(-1, -1);
		}
		if (FLAVOR.bounds && FLAVOR.bounds.containsXY(ev.x, ev.y)) {
			return true;
		}
	}
  else if (ev.type === IO.KEYPRESS) {
    if (ev.key === 'Enter' && CLICK_MOVE) {
      if (PATH_ACTIVE) {
        ev.mapX = CURSOR.x;
        ev.mapY = CURSOR.y;
        return await COMMANDS.travel(ev);
      }
    }

    PATH_ACTIVE = false;
    DATA.player.travelDest = null;  // stop traveling

    if (SIDEBAR.bounds) {
      if (ev.key === 'Tab') {
        PATH_ACTIVE = true;
        const loc = SIDEBAR.nextTarget();
        ui.setCursor(loc[0], loc[1]);
        return true;
      }
      else if (ev.key === 'TAB') {
        PATH_ACTIVE = true;
        const loc = SIDEBAR.prevTarget();
        ui.setCursor(loc[0], loc[1]);
        return true;
      }
      else if (ev.key === 'Escape') {
        if (VIEWPORT.bounds.containsXY(MOUSE.x, MOUSE.y)) {
          const x = VIEWPORT.bounds.toInnerX(MOUSE.x);
          const y = VIEWPORT.bounds.toInnerY(MOUSE.y);
          SIDEBAR.focus(x, y);
          DATA.player.travelDest = null;  // stop traveling
          ui.setCursor(x, y, true);
        }
        else {
          SIDEBAR.focus(-1, -1);
          ui.clearCursor();
        }
      }
    }

  }

	return false;
}

ui.dispatchEvent = dispatchEvent;


let UPDATE_REQUESTED = 0;
export function requestUpdate(t=1) {
	UPDATE_REQUESTED = Math.max(UPDATE_REQUESTED, t, 1);
  ui.debug('update requested - %d', UPDATE_REQUESTED);
}

ui.requestUpdate = requestUpdate;

export async function updateNow(t=1) {
	t = Math.max(t, UPDATE_REQUESTED, 0);
	UPDATE_REQUESTED = 0;
  ui.debug('update now - %d', t);
	ui.draw();
	if (t) {
		const r = await IO.tickMs(t);
	}
}

ui.updateNow = updateNow;

export async function updateIfRequested() {
	if (UPDATE_REQUESTED) {
		await ui.updateNow(UPDATE_REQUESTED);
	}
}

ui.updateIfRequested = updateIfRequested;

// EVENTS

export function onkeydown(e) {
	if (IO.ignoreKeyEvent(e)) return;

	if (e.code === 'Escape') {
		IO.clearEvents();	// clear all current events, then push on the escape
  }

	const ev = IO.makeKeyEvent(e);
	IO.pushEvent(ev);

	e.preventDefault();
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

export function onmouseup(e) {
	const x = ui.canvas.toX(e.clientX);
	const y = ui.canvas.toY(e.clientY);
	const ev = IO.makeMouseEvent(e, x, y);
	IO.pushEvent(ev);
}

ui.onmouseup = onmouseup;


//////////////////
// CURSOR

var MOUSE = ui.mouse = {
  x: -1,
  y: -1,
};

var CURSOR = ui.cursor = {
	x: -1,
	y: -1,
}

function setCursor(x, y, force) {
  const map = DATA.map;
  if (!map) return false;

  if (!force) {
    if (CURSOR.x == x && CURSOR.y == y) return false;
  }

  // ui.debug('set cursor', x, y);

  if (map.hasXY(CURSOR.x, CURSOR.y)) {
    map.clearCellFlags(CURSOR.x, CURSOR.y, Flags.Cell.IS_CURSOR);
    map.setCellFlags(CURSOR.x, CURSOR.y, Flags.Cell.NEEDS_REDRAW);
  }
  CURSOR.x = x;
  CURSOR.y = y;

  if (map.hasXY(x, y)) {
    if (SHOW_CURSOR) {
      map.setCellFlags(CURSOR.x, CURSOR.y, Flags.Cell.IS_CURSOR | Flags.Cell.NEEDS_REDRAW);
    }
    if (SHOW_PATH) {
      ui.updatePathToCursor();
    }

    // if (!GW.player.isMoving()) {
    //   showPathFromPlayerTo(x, y);
    // }
    FLAVOR.showFor(x, y);
  }
  else {
    // GW.map.clearPath();
    FLAVOR.setText('');
  }

  ui.requestUpdate();
  return true;
}

ui.setCursor = setCursor;

// function moveCursor(dx, dy) {
//   GW.map.setCursor(CURSOR.x + dx, CURSOR.y + dy);
// }
//
// GW.map.moveCursor = moveCursor;

// GW.map.cursor = CURSOR;

function clearCursor() {
  return ui.setCursor(-1,-1);
  // ui.flavorMessage(GW.map.cellFlavor(GW.PLAYER.x, GW.PLAYER.y));
}

ui.clearCursor = clearCursor;


function updatePathToCursor() {
  const player = DATA.player;
  const map = DATA.map;

  if (!SHOW_PATH) return;
  if (player.travelDest) return;  // do not update path if we are traveling...

  map.clearFlags(0, Flags.Cell.IS_IN_PATH);

  if (!PATH_ACTIVE) return;

  if (CURSOR.x == player.x && CURSOR.y == player.y) return;
  if (CURSOR.x < 0 || CURSOR.y < 0) return ui.updatePath();

  const path = player.getPath(CURSOR.x, CURSOR.y, map);

  ui.updatePath(path);
}

ui.updatePathToCursor = updatePathToCursor;


function updatePath(path) {
  const player = DATA.player;
  const map = DATA.map;

  if (!SHOW_PATH) return;
  map.clearFlags(0, Flags.Cell.IS_IN_PATH);

  if (path) {
    for(let pos of path) {
      if (pos[0] != player.x || pos[1] != player.y) {
        map.setCellFlag(pos[0], pos[1], Flags.Cell.IS_IN_PATH);
      }
    }
  }

}

ui.updatePath = updatePath;

// FUNCS

export async function prompt(text, args) {
  if (args) {
    text = Text.apply(text, args);
  }

	if (SHOW_FLAVOR) {
		FLAVOR.showPrompt(text);
	}
	else {
		console.log(text);
	}
}

ui.prompt = prompt;


export async function fadeTo(color, duration=1000) {

  color = GW.color.from(color);
  const buffer = startDialog();

  let pct = 0;
  let elapsed = 0;

  while(elapsed < duration) {
    elapsed += 32;
    if (await IO.pause(32)) {
      elapsed = duration;
    }

    pct = Math.floor(100*elapsed/duration);

    resetDialog();
    buffer.mix(color, pct);
    buffer.render();
  }

  finishDialog(buffer);

}

ui.fadeTo = fadeTo;


export async function alert(duration, text, args) {

  const buffer = ui.startDialog();

	if (args) {
		text = Text.apply(text, args);
	}

  const len = text.length;
  const x = Math.floor((ui.canvas.width - len - 4) / 2) - 2;
  const y = Math.floor(ui.canvas.height / 2) - 1;
  buffer.fillRect(x, y, len + 4, 3, ' ', 'black', 'black');
	buffer.drawText(x + 2, y + 1, text);
	buffer.render();

	await IO.pause(duration || 30 * 1000);

	ui.finishDialog();
}

ui.alert = alert;


export async function confirm(opts, prompt, args) {

  let text;
  if (typeof opts === 'string') {
    args = prompt;
    prompt = opts;
    opts = {};
  }
  if (prompt) {
    prompt = GW.messages[prompt] || prompt;
    text = Text.apply(prompt, args);
  }

  Utils.setDefaults(opts, {
    allowCancel: true,
    bg: 'black',
  });

  const buffer = ui.startDialog();
  buffer.mix('black', 50);

	const btnOK = 'OK=Enter';
	const btnCancel = 'Cancel=Escape';
  const len = Math.max(text.length, btnOK.length + 4 + btnCancel.length);
  const x = Math.floor((ui.canvas.width - len - 4) / 2) - 2;
  const y = Math.floor(ui.canvas.height / 2) - 1;
  buffer.fillRect(x, y, len + 4, 5, ' ', 'black', opts.bg);
	buffer.drawText(x + 2, y + 1, text);
	buffer.drawText(x + 2, y + 3, btnOK);
  if (opts.allowCancel) {
    buffer.drawText(x + len + 4 - btnCancel.length - 2, y + 3, btnCancel, 'white');
  }
	buffer.render();

	let result;
	while(result === undefined) {
		const ev = await IO.nextEvent(1000);
		await IO.dispatchEvent(ev, {
			enter() {
				result = true;
			},
			escape() {
        if (opts.allowCancel) {
          result = false;
        }
			},
			mousemove() {
				let isOK = ev.x < x + btnOK.length + 2;
				let isCancel = ev.x > x + len + 4 - btnCancel.length - 4;
				if (ev.x < x || ev.x > x + len + 4) { isOK = false; isCancel = false; }
				if (ev.y != y + 3 ) { isOK = false; isCancel = false; }
				buffer.drawText(x + 2, y + 3, btnOK, isOK ? GW.colors.teal : GW.colors.white);
        if (opts.allowCancel) {
          buffer.drawText(x + len + 4 - btnCancel.length - 2, y + 3, btnCancel, isCancel ? GW.colors.teal : GW.colors.white);
        }
				buffer.render();
			},
			click() {
				if (ev.x < x || ev.x > x + len + 4) return;
				if (ev.y < y || ev.y > y + 5) return;
				result = ev.x < x + Math.floor(len/2) + 2;
			}
		});
	}

	ui.finishDialog();
	return result;
}

ui.confirm = confirm;


function blackOutDisplay() {
	UI_BUFFER.blackOut();
	REDRAW_UI = true;
}

ui.blackOutDisplay = blackOutDisplay;


const TARGET_SPRITE = SPRITE.install('target', 'green', 50);

async function chooseTarget(choices, prompt, opts={}) {
	console.log('choose Target');

	if (!choices || choices.length == 0) return null;
	if (choices.length == 1) return choices[0];

	const buf = ui.startDialog();
	let waiting = true;
	let selected = 0;

	function draw() {
		ui.resetDialog();
		buf.wrapText(GW.flavor.bounds.x, GW.flavor.bounds.y, GW.flavor.bounds.width, prompt, GW.colors.orange);
		if (selected >= 0) {
			const choice = choices[selected];

      let offsetX = 0;
      let offsetY = 0;
      if (CONFIG.followPlayer && DATA.player && DATA.player.x >= 0) {
        offsetX = DATA.player.x - VIEWPORT.bounds.centerX();
        offsetY = DATA.player.y - VIEWPORT.bounds.centerY();
      }

      const x = choice.x + VIEWPORT.bounds.x - offsetX;
      const y = choice.y + VIEWPORT.bounds.y - offsetY;

			buf.drawSprite(x, y, TARGET_SPRITE);
		}
		buf.render();
	}

	draw();

	while(waiting) {
		const ev = await IO.nextEvent(100);
		await IO.dispatchEvent(ev, {
			escape() { waiting = false; selected = -1; },
			enter() { waiting = false; },
			tab() {
				selected = (selected + 1) % choices.length;
				draw();
			},
			dir(e) {
				if (e.dir[0] > 0 || e.dir[1] > 0) {
					selected = (selected + 1) % choices.length;
				}
				else if (e.dir[0] < 0 || e.dir[1] < 0) {
					selected = (selected + choices.length - 1) % choices.length;
				}
				draw();
			}
		});
	}

	ui.finishDialog();
	return choices[selected] || null;
}

ui.chooseTarget = chooseTarget;


export async function inputNumberBox(opts, prompt, args) {

  let text;
  if (typeof opts === 'number') {
    opts = { max: opts };
  }
  else if (typeof opts === 'string') {
    args = prompt;
    prompt = opts;
    opts = {};
  }
  if (prompt) {
    prompt = GW.messages[prompt] || prompt;
    text = Text.apply(prompt, args);
  }

  Utils.setDefaults(opts, {
    allowCancel: true,
    min: 1,
    max: 99,
    number: true,
    bg: 'black',
  });

  const buffer = ui.startDialog();
  buffer.mix('black', 50);

	const btnOK = 'OK=Enter';
	const btnCancel = 'Cancel=Escape';
  const len = Math.max(text.length, btnOK.length + 4 + btnCancel.length);
  const x = Math.floor((ui.canvas.width - len - 4) / 2) - 2;
  const y = Math.floor(ui.canvas.height / 2) - 1;
  buffer.fillRect(x, y, len + 4, 6, ' ', 'black', opts.bg);
	buffer.drawText(x + 2, y + 1, text);
  buffer.fillRect(x + 2, y + 2, len - 4, 1, ' ', 'gray', 'gray');
	buffer.drawText(x + 2, y + 4, btnOK);
  if (opts.allowCancel) {
    buffer.drawText(x + len + 4 - btnCancel.length - 2, y + 4, btnCancel);
  }
	buffer.render();

  const value = await ui.getInputAt(x + 2, y + 2, len - 4, opts);

	ui.finishDialog();
	return Number.parseInt(value);
}

ui.inputNumberBox = inputNumberBox;


// assumes you are in a dialog and give the buffer for that dialog
async function getInputAt(x, y, maxLength, opts={})
{
  let defaultEntry = opts.default || '';
  let numbersOnly = opts.number || opts.numbers || opts.numbersOnly || false;

	const textEntryBounds = (numbersOnly ? ['0', '9'] : [' ', '~']);

  const buffer = GW.ui.startDialog();
	maxLength = Math.min(maxLength, buffer.width - x);

	let inputText = defaultEntry;
	let charNum = GW.text.length(inputText);

  let ev;
	do {
    buffer.render();

		ev = await IO.nextKeyPress(-1);
		if ( (ev.key == 'Delete' || ev.key == 'Backspace') && charNum > 0) {
			buffer.draw(x + charNum - 1, y, ' ', 'white');
			charNum--;
			inputText = Text.spliceRaw(inputText, charNum, 1);
		} else if (ev.key.length > 1) {
			// ignore other special keys...
		} else if (ev.key >= textEntryBounds[0]
				   && ev.key <= textEntryBounds[1]) // allow only permitted input
		{
			if (charNum < maxLength) {
        if (numbersOnly) {
          const value = Number.parseInt(inputText + ev.key);
          if (opts.min !== undefined && value < opts.min) {
            continue;
          }
          if (opts.max !== undefined && value > opts.max) {
            continue;
          }
        }
        inputText += ev.key;
  			buffer.draw(x + charNum, y, ev.key, 'white');
				charNum++;
			}
		}

		if (ev.key == 'Escape') {
      GW.ui.finishDialog();
			return '';
		}

	} while ((!inputText.length) || ev.key != 'Enter');

  GW.ui.finishDialog();
  // GW.ui.draw(); // reverts to old display
	return inputText;
}

ui.getInputAt = getInputAt;


// DIALOG

const UI_LAYERS = [];
const BUFFERS = [];

function startDialog() {
  IN_DIALOG = true;
  const base = UI_OVERLAY || UI_BUFFER;
  UI_LAYERS.push(base);
  UI_OVERLAY = BUFFERS.pop() || new Buffer(ui.canvas);
  // UI_OVERLAY._data.forEach( (c) => c.opacity = 0 );
  UI_OVERLAY.copy(base);
  return UI_OVERLAY;
}

ui.startDialog = startDialog;

function resetDialog() {
	if (IN_DIALOG) {
    const base = UI_LAYERS[UI_LAYERS.length - 1] || UI_BUFFER;
		UI_OVERLAY.copy(base);
	}
}

ui.resetDialog = resetDialog;

function finishDialog() {
  if (!IN_DIALOG) return;

  BUFFERS.push(UI_OVERLAY);
  UI_OVERLAY = UI_LAYERS.pop() || UI_BUFFER;
  UI_OVERLAY.render();

  IN_DIALOG = (UI_LAYERS.length > 0);
}

ui.finishDialog = finishDialog;

// DRAW

function draw() {
  if (IN_DIALOG) {
    // ui.canvas.overlay(UI_BASE);
    UI_OVERLAY.render();
  }
  else if (ui.canvas && DATA.map) {
    // const side = GW.sidebar.draw(UI_BUFFER);
    if (VIEWPORT.bounds) VIEWPORT.draw(UI_BUFFER);
		if (MSG.bounds) MSG.draw(UI_BUFFER);
		if (FLAVOR.bounds) FLAVOR.draw(UI_BUFFER);
    if (SIDEBAR.bounds) SIDEBAR.draw(UI_BUFFER);

    // if (commitCombatMessage() || REDRAW_UI || side || map) {
    UI_BUFFER.render();
    // ui.canvas.overlay(UI_OVERLAY);
      REDRAW_UI = false;
			UPDATE_REQUESTED = 0;
    // }
  }
}

ui.draw = draw;

// Helpers

// UI

export function plotProgressBar(buf, x, y, width, barText, textColor, pct, barColor) {
  if (pct > 1) pct /= 100;
  pct = Utils.clamp(pct, 0, 1);

	barColor = Color.make(barColor);
  textColor = Color.make(textColor);
  const darkenedBarColor = barColor.clone().mix(COLORS.black, 75);

  barText = Text.center(barText, width);

  const currentFillColor = GW.make.color();
  const currentTextColor = GW.make.color();
	for (let i=0; i < width; i++) {
		currentFillColor.copy(i <= (width * pct) ? barColor : darkenedBarColor);
		if (i == Math.floor(width * pct)) {
      const perCell = Math.floor(1000 / width);
      const rem = (1000 * pct) % perCell;
			currentFillColor.mix(COLORS.black, 75 - Math.floor(75 * rem / perCell));
		}
		currentTextColor.copy(textColor);
		currentTextColor.mix(currentFillColor, 25);
		buf.draw(x + i, y, barText[i], currentTextColor, currentFillColor);
	}
}

ui.plotProgressBar = plotProgressBar;
