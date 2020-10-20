
import { io as IO } from './io.js';
import * as Flags from './flags.js';
import { sprite as SPRITE } from './sprite.js';
import { data as DATA, types, fx as FX, ui, message as MSG, def, viewport as VIEWPORT, flavor as FLAVOR, utils as UTILS, make, sidebar as SIDEBAR, config as CONFIG } from './gw.js';

ui.debug = UTILS.NOOP;

let SHOW_FLAVOR = false;
let SHOW_SIDEBAR = false;
let SHOW_CURSOR = false;

let UI_BUFFER = null;
let UI_BASE = null;
let UI_OVERLAY = null;
let IN_DIALOG = false;
let REDRAW_UI = false;

let time = performance.now();

let RUNNING = false;

function uiLoop(t) {
	t = t || performance.now();

  if (RUNNING) {
    requestAnimationFrame(uiLoop);
  }

	const dt = Math.floor(t - time);
	time = t;

	if ((!IN_DIALOG) && FX.tick(dt)) {
		ui.draw();
	}
	else {
		const ev = IO.makeTickEvent(dt);
		IO.pushEvent(ev);
	}

	ui.canvas.draw();
}


export function start(opts={}) {

  UTILS.setDefaults(opts, {
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
  UI_BUFFER = UI_BUFFER || ui.canvas.allocBuffer();
  UI_BASE = UI_BASE || ui.canvas.allocBuffer();
  UI_OVERLAY = UI_OVERLAY || ui.canvas.allocBuffer();
  UI_BASE.nullify();
  UI_OVERLAY.nullify();

  IN_DIALOG = false;
  REDRAW_UI = false;

	let viewX = 0;
	let viewY = 0;
	let viewW = opts.width;
	let viewH = opts.height;

	let flavorLine = -1;

  if (opts.wideMessages) {
    if (opts.messages) {
      viewH -= Math.abs(opts.messages);
    }
    if (opts.flavor) {
      viewH -= 1;
    }
  }

  if (opts.sidebar) {
    if (opts.sidebar === true) {
      opts.sidebar = 20;
    }
    if (opts.sidebar < 0) { // right side
      viewW += opts.sidebar;  // subtract
      SIDEBAR.setup({ x: viewW, y: 0, width: -opts.sidebar, height: viewH });
    }
    else {  // left side
      viewW -= opts.sidebar;
      viewX = opts.sidebar;
      SIDEBAR.setup({ x: 0, y: 0, width: opts.sidebar, height: viewH });
    }
  }

  const msgW = (opts.wideMessages ? opts.width : viewW);

	if (opts.messages) {
		if (opts.messages < 0) {	// on bottom of screen
			MSG.setup({x: 0, y: ui.canvas.height + opts.messages, width: msgW, height: -opts.messages, archive: ui.canvas.height });
      if (!opts.wideMessages) {
        viewH += opts.messages;	// subtract off message height
      }
			if (opts.flavor) {
				viewH -= 1;
				flavorLine = ui.canvas.height + opts.messages - 1;
			}
		}
		else {	// on top of screen
			MSG.setup({x: 0, y: 0, width: msgW, height: opts.messages, archive: ui.canvas.height });
			viewY = opts.messages;
      if (! opts.wideMessages) {
        viewH -= opts.messages;
      }
			if (opts.flavor) {
				viewY += 1;
				viewH -= 1;
				flavorLine = opts.messages;
			}
		}
	}

	if (opts.flavor) {
		FLAVOR.setup({ x: viewX, y: flavorLine, w: msgW, h: 1 });
	}

	VIEWPORT.setup({ x: viewX, y: viewY, w: viewW, h: viewH, followPlayer: opts.followPlayer });
	SHOW_CURSOR = opts.cursor;

  ui.blackOutDisplay();
	RUNNING = true;
	uiLoop();

  return ui.canvas;
}

ui.start = start;


export function stop() {
	RUNNING = false;
}

ui.stop = stop;



export async function dispatchEvent(ev) {

	if (ev.type === def.CLICK) {
		if (MSG.bounds && MSG.bounds.containsXY(ev.x, ev.y)) {
			await MSG.showArchive();
			return true;
		}
		else if (FLAVOR.bounds && FLAVOR.bounds.containsXY(ev.x, ev.y)) {
			return true;
		}
    if (VIEWPORT.bounds && VIEWPORT.bounds.containsXY(ev.x, ev.y)) {
      let x0 = VIEWPORT.bounds.toInnerX(ev.x);
      let y0 = VIEWPORT.bounds.toInnerY(ev.y);
      if (CONFIG.followPlayer && DATA.player && (DATA.player.x >= 0)) {
        const offsetX = DATA.player.x - VIEWPORT.bounds.centerX();
        const offsetY = DATA.player.y - VIEWPORT.bounds.centerY();
        x0 += offsetX;
        y0 += offsetY;
      }
      ev.mapX = x0;
      ev.mapY = y0;
    }
	}
	else if (ev.type === def.MOUSEMOVE) {
		if (VIEWPORT.bounds && VIEWPORT.bounds.containsXY(ev.x, ev.y)) {
      let x0 = VIEWPORT.bounds.toInnerX(ev.x);
      let y0 = VIEWPORT.bounds.toInnerY(ev.y);
      if (CONFIG.followPlayer && DATA.player && (DATA.player.x >= 0)) {
        const offsetX = DATA.player.x - VIEWPORT.bounds.centerX();
        const offsetY = DATA.player.y - VIEWPORT.bounds.centerY();
        x0 += offsetX;
        y0 += offsetY;
      }
      ev.mapX = x0;
      ev.mapY = y0;
			if (SHOW_CURSOR) {
				ui.setCursor(x0, y0);
			}
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
  else if (ev.type === def.KEYPRESS) {
    if (SIDEBAR.bounds) {
      if (ev.key === 'Tab') {
        const loc = SIDEBAR.nextTarget();
        ui.setCursor(loc[0], loc[1]);
        return true;
      }
      else if (ev.key === 'TAB') {
        const loc = SIDEBAR.prevTarget();
        ui.setCursor(loc[0], loc[1]);
        return true;
      }
      else if (ev.key === 'Escape') {
        SIDEBAR.focus(-1, -1);
        ui.clearCursor();
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
	ui.canvas.draw();
	if (t) {
		// const now = performance.now();
		// ui.debug('UI update - with timeout:', t);
		const r = await IO.tickMs(t);
		// ui.debug('- done', r, Math.floor(performance.now() - now));
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

function setCursor(x, y) {
  const map = DATA.map;
  if (!map) return false;

  if (CURSOR.x == x && CURSOR.y == y) return false;

  // ui.debug('set cursor', x, y);

  if (map.hasXY(CURSOR.x, CURSOR.y)) {
    map.clearCellFlags(CURSOR.x, CURSOR.y, Flags.Cell.IS_CURSOR);
    map.setCellFlags(CURSOR.x, CURSOR.y, Flags.Cell.NEEDS_REDRAW);
  }
  CURSOR.x = x;
  CURSOR.y = y;

  if (map.hasXY(x, y)) {
    // if (!DATA.player || DATA.player.x !== x || DATA.player.y !== y ) {
      map.setCellFlags(CURSOR.x, CURSOR.y, Flags.Cell.IS_CURSOR | Flags.Cell.NEEDS_REDRAW);
    // }

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



// FUNCS

export async function prompt(...args) {
	const msg = TEXT.format(...args);

	if (SHOW_FLAVOR) {
		FLAVOR.showPrompt(msg);
	}
	else {
		console.log(msg);
	}
}


export async function messageBox(text, fg, duration) {

  const buffer = ui.startDialog();

  const len = text.length;
  const x = Math.floor((ui.canvas.width - len - 4) / 2) - 2;
  const y = Math.floor(ui.canvas.height / 2) - 1;
  buffer.fillRect(x, y, len + 4, 3, ' ', 'black', 'black');
	buffer.plotText(x + 2, y + 1, text, fg || 'white');
	ui.draw();

	await IO.pause(duration || 30 * 1000);

	ui.finishDialog();
}

ui.messageBox = messageBox;


export async function confirm(text, fg) {

  const buffer = ui.startDialog();

	const btnOK = 'OK=Enter';
	const btnCancel = 'Cancel=Escape';
  const len = Math.max(text.length, btnOK.length + 4 + btnCancel.length);
  const x = Math.floor((ui.canvas.width - len - 4) / 2) - 2;
  const y = Math.floor(ui.canvas.height / 2) - 1;
  buffer.fillRect(x, y, len + 4, 5, ' ', 'black', 'black');
	buffer.plotText(x + 2, y + 1, text, fg || 'white');
	buffer.plotText(x + 2, y + 3, btnOK, 'white');
	buffer.plotText(x + len + 4 - btnCancel.length - 2, y + 3, btnCancel, 'white');
	ui.draw();

	let result;
	while(result === undefined) {
		const ev = await IO.nextEvent(1000);
		await IO.dispatchEvent(ev, {
			enter() {
				result = true;
			},
			escape() {
				result = false;
			},
			mousemove() {
				let isOK = ev.x < x + btnOK.length + 2;
				let isCancel = ev.x > x + len + 4 - btnCancel.length - 4;
				if (ev.x < x || ev.x > x + len + 4) { isOK = false; isCancel = false; }
				if (ev.y != y + 3 ) { isOK = false; isCancel = false; }
				buffer.plotText(x + 2, y + 3, btnOK, isOK ? 'blue' : 'white');
				buffer.plotText(x + len + 4 - btnCancel.length - 2, y + 3, btnCancel, isCancel ? 'blue' : 'white');
				ui.draw();
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
		ui.clearDialog();
		buf.plotLine(GW.flavor.bounds.x, GW.flavor.bounds.y, GW.flavor.bounds.width, prompt, GW.colors.orange);
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

			buf.plot(x, y, TARGET_SPRITE);
		}
		ui.draw();
	}

	draw();

	while(waiting) {
		const ev = await GW.io.nextEvent(100);
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

// DIALOG

function startDialog() {
  IN_DIALOG = true;
  ui.canvas.copyBuffer(UI_BASE);
	ui.canvas.copyBuffer(UI_OVERLAY);
	UI_OVERLAY.forEach( (c) => c.opacity = 0 );
  // UI_OVERLAY.nullify();
  return UI_OVERLAY;
}

ui.startDialog = startDialog;

function clearDialog() {
	if (IN_DIALOG) {
		UI_OVERLAY.copy(UI_BASE);
	}
}

ui.clearDialog = clearDialog;

function finishDialog() {
  IN_DIALOG = false;
  ui.canvas.overlay(UI_BASE);
  UI_OVERLAY.nullify();
}

ui.finishDialog = finishDialog;

// DRAW

function draw() {
  if (IN_DIALOG) {
    // ui.canvas.overlay(UI_BASE);
    ui.canvas.overlay(UI_OVERLAY);
  }
  else if (ui.canvas) {
    // const side = GW.sidebar.draw(UI_BUFFER);
    if (VIEWPORT.bounds) VIEWPORT.draw(UI_BUFFER);
		if (MSG.bounds) MSG.draw(UI_BUFFER);
		if (FLAVOR.bounds) FLAVOR.draw(UI_BUFFER);
    if (SIDEBAR.bounds) SIDEBAR.draw(UI_BUFFER);

    // if (commitCombatMessage() || REDRAW_UI || side || map) {
    ui.canvas.overlay(UI_BUFFER);
    // ui.canvas.overlay(UI_OVERLAY);
      REDRAW_UI = false;
			UPDATE_REQUESTED = 0;
    // }
  }
}

ui.draw = draw;
