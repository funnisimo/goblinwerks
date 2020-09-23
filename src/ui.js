
import { utils as UTILS } from './utils.js';
import { io as IO } from './io.js';
import { data as DATA, types, fx as FX, ui, message as MSG } from './gw.js';


let SHOW_FLAVOR = false;
let SHOW_SIDEBAR = false;

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
  UI_BUFFER = UI_BUFFER || ui.canvas.allocBuffer();
  UI_BASE = UI_BASE || ui.canvas.allocBuffer();
  UI_OVERLAY = UI_OVERLAY || ui.canvas.allocBuffer();
  UI_BASE.clear();
  UI_OVERLAY.clear();

  IN_DIALOG = false;
  REDRAW_UI = false;

	if (opts.messages) {
		if (opts.messages < 0) {	// on bottom of screen
			MSG.setup({x: 0, y: ui.canvas.height + opts.messages, width: ui.canvas.width, height: -opts.messages, archive: ui.canvas.height });
		}
		else {	// on top of screen
			MSG.setup({x: 0, y: 0, width: ui.canvas.width, height: opts.messages, archive: ui.canvas.height });
		}
	}

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


let UPDATE_REQUESTED = 0;
export function requestUpdate(t=1) {
	UPDATE_REQUESTED = Math.max(UPDATE_REQUESTED, t, 1);
}

ui.requestUpdate = requestUpdate;

export async function updateNow(t=1) {
	t = Math.max(t, UPDATE_REQUESTED, 0);
	UPDATE_REQUESTED = 0;

	ui.draw();
	ui.canvas.draw();
	if (t) {
		// const now = performance.now();
		// console.log('UI update - with timeout:', t);
		const r = await IO.tickMs(t);
		// console.log('- done', r, Math.floor(performance.now() - now));
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

// FUNCS

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
	UI_BUFFER.erase();
	REDRAW_UI = true;
}

ui.blackOutDisplay = blackOutDisplay;


// DIALOG

function startDialog() {
  IN_DIALOG = true;
  ui.canvas.copyBuffer(UI_BASE);
  UI_OVERLAY.clear();
  return UI_OVERLAY;
}

ui.startDialog = startDialog;


function finishDialog() {
  IN_DIALOG = false;
  ui.canvas.overlay(UI_BASE);
  UI_OVERLAY.clear();
}

ui.finishDialog = finishDialog;

// DRAW

function draw() {
  if (IN_DIALOG) {
    ui.canvas.overlay(UI_BASE);
    ui.canvas.overlay(UI_OVERLAY);
  }
  else if (ui.canvas) {
    // const side = GW.sidebar.draw(UI_BUFFER);
    if (DATA.map) DATA.map.draw(ui.canvas.buffer);
		if (MSG.bounds) MSG.draw(ui.canvas.buffer);
    // if (commitCombatMessage() || REDRAW_UI || side || map) {
    // ui.canvas.overlay(UI_BUFFER);
    // ui.canvas.overlay(UI_OVERLAY);
      REDRAW_UI = false;
			UPDATE_REQUESTED = 0;
    // }
  }
}

ui.draw = draw;
