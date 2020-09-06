
import { NOOP, TRUE, FALSE } from './utils.js';
import { io, def, commands as COMMANDS } from './gw.js';


const KEYMAPS = [];
const EVENTS = [];
const DEAD_EVENTS = [];
const TIMERS = [];

export const KEYPRESS  = def.KEYPRESS  = 'keypress';
export const MOUSEMOVE = def.MOUSEMOVE = 'mousemove';
export const CLICK 		 = def.CLICK 		 = 'click';
export const TICK 		 = def.TICK 		 = 'tick';

const CONTROL_CODES = [
	'ShiftLeft', 		'ShiftRight',
	'ControlLeft',  'ControlRight',
	'AltLeft',   		'AltRight',
	'MetaLeft',  		'MetaRight',
];

var CURRENT_HANDLER = null;


export function addKeymap(keymap) {
	KEYMAPS.push(keymap);
}

io.addKeymap = addKeymap;

export function busy() {
	return EVENTS.length > 0;
}

io.busy = busy;

export function clearEvents() {
	while (EVENTS.length) {
		const ev = EVENTS.shift();
		DEAD_EVENTS.push(ev);
	}
}

io.clearEvents = clearEvents;


export function pushEvent(ev) {
  if (EVENTS.length && ev.type === MOUSEMOVE) {
  	last = EVENTS[EVENTS.length - 1];
    if (last.type === MOUSEMOVE) {
			last.x = ev.x;
		  last.y = ev.y;
      return;
    }
  }

	if (CURRENT_HANDLER) {
  	CURRENT_HANDLER(ev);
  }
  else {
  	EVENTS.push(ev);
  }
}

io.pushEvent = pushEvent;


export function dispatchEvent(ev) {
	for(let i = KEYMAPS.length - 1; i >= 0; --i) {
		const km = KEYMAPS[i];
		let command;
		if (ev.dir) {
			command = km.dir;
		}
		else if (ev.type === KEYPRESS) {
			command = km[ev.key] || km[ev.code];
		}
		else if (km[ev.type]) {
			command = km[ev.type];
		}

		if (command) {
			if (typeof command === 'function') {
				return command(ev);
			}
			else if (COMMANDS[command]) {
				return COMMANDS[command](ev);
			}
		}

		if (km.next === false) return false;
	}
	return false;
}

io.dispatchEvent = dispatchEvent;

function recycleEvent(ev) {
	DEAD_EVENTS.push(ev);
}

io.recycleEvent = recycleEvent;


// TIMERS

export function setTimeout(delay, fn) {
	fn = fn || NOOP;
	const h = { delay, fn, resolve: null, promise: null };

	const p = new Promise( (resolve) => {
		h.resolve = resolve;
	});

	h.promise = p;

	for(let i = 0; i < TIMERS.length; ++i) {
		if (!TIMERS[i]) {
			TIMERS[i] = h;
			return p;
		}
	}

	TIMERS.push(h);
	return p;
}

io.setTimeout = setTimeout;

export function clearTimeout(promise) {
	for(let i = 0; i < TIMERS.length; ++i) {
		const timer = TIMERS[i];
		if (timer && timer.promise === promise) {
			TIMERS[i] = null;
			timer.resolve(false);
			return true;
		}
	}
	return false;
}

io.clearTimeout = clearTimeout;

// TICK

export function makeTickEvent(dt) {

	const ev = DEAD_EVENTS.pop() || {};

	ev.shiftKey = false;
	ev.ctrlKey = false;
	ev.altKey = false;
	ev.metaKey = false;

  ev.type = TICK;
  ev.key = null;
  ev.code = null;
  ev.x = -1;
  ev.y = -1;
	ev.dir = null;
	ev.dt = dt;

  return ev;
}

io.makeTickEvent = makeTickEvent;

// KEYBOARD

export function makeKeyEvent(e) {
  let key = e.key;
	let code = e.code.toLowerCase();

  if (e.shiftKey) {
    key = key.toUpperCase();
		code = code.toUpperCase();
  }
  if (e.ctrlKey) 	{
    key = '^' + key;
		code = '^' + code;
  }
  if (e.metaKey) 	{
    key = '#' + key;
		code = '#' + code;
  }
	if (e.altKey) {
		code = '/' + code;
	}

	const ev = DEAD_EVENTS.pop() || {};

	ev.shiftKey = e.shiftKey;
	ev.ctrlKey = e.ctrlKey;
	ev.altKey = e.altKey;
	ev.metaKey = e.metaKey;

  ev.type = KEYPRESS;
  ev.key = key;
  ev.code = code;
  ev.x = -1;
  ev.y = -1;
	ev.dir = io.keyCodeDirection(e.code);
	ev.dt = 0;

  return ev;
}

io.makeKeyEvent = makeKeyEvent;

export function onkeydown(e) {
	if (CONTROL_CODES.includes(e.code)) return;

	if (e.code === 'Escape') {
		io.clearEvents();	// clear all current events, then push on the escape
  }

	const ev = makeKeyEvent(e);
	io.pushEvent(ev);
}

io.onkeydown = onkeydown;


export function keyCodeDirection(key) {
	const lowerKey = key.toLowerCase();

	if (lowerKey === 'arrowup') {
		return [0,-1];
	}
	else if (lowerKey === 'arrowdown') {
		return [0,1];
	}
	else if (lowerKey === 'arrowleft') {
		return [-1, 0];
	}
	else if (lowerKey === 'arrowright') {
		return [1,0];
	}
	return null;
}

io.keyCodeDirection = keyCodeDirection;

// MOUSE

export var mouse = {x: -1, y: -1};
io.mouse = mouse;

export function makeMouseEvent(e, x, y) {

	const ev = DEAD_EVENTS.pop() || {};

	ev.shiftKey = e.shiftKey;
	ev.ctrlKey = e.ctrlKey;
	ev.altKey = e.altKey;
	ev.metaKey = e.metaKey;

  ev.type = e.buttons ? CLICK : MOUSEMOVE;
  ev.key = null;
  ev.code = null;
  ev.x = x;
  ev.y = y;
	ev.dir = null;
	ev.dt = 0;

  return ev;
}

io.makeMouseEvent = makeMouseEvent;

export function onmousemove(e) {
	const x = canvas.toX(e.clientX);
	const y = canvas.toY(e.clientY);
	const ev = makeMouseEvent(e, x, y);
	io.pushEvent(ev);
}

io.onmousemove = onmousemove;

export function onmousedown(e) {
	const x = canvas.toX(e.clientX);
	const y = canvas.toY(e.clientY);
	const ev = makeMouseEvent(e, x, y);
	io.pushEvent(ev);
}

io.onmousedown = onmousedown;

// IO


export function nextEvent(ms, match) {
	match = match || TRUE;
	let elapsed = 0;

	if (EVENTS.length) {
  	const e = EVENTS.shift();
    e.dt = 0;
		if (e.type === MOUSEMOVE) {
			io.mouse.x = e.x;
			io.mouse.y = e.y;
		}

    return e;
  }

  let done;

	if (!ms) return null;

  CURRENT_HANDLER = ((e) => {
		if (e.type === MOUSEMOVE) {
			io.mouse.x = e.x;
			io.mouse.y = e.y;
		}

  	if (e.type === TICK) {
    	elapsed += e.dt;
    	if (elapsed < ms) {
        return;
      }
    }
    else if (!match(e)) return;

    CURRENT_HANDLER = null;
    e.dt = elapsed;
  	done(e);
  });

  return new Promise( (resolve) => done = resolve );
}

io.nextEvent = nextEvent;

export async function nextKeypress(ms, match) {
	match = match || TRUE;
	function matchingKey(e) {
  	if (e.type !== KEYPRESS) return false;
    return match(e);
  }
  return nextEvent(ms, matchingKey);
}

io.nextKeypress = nextKeypress;

export async function nextKeyOrClick(ms) {
	function match(e) {
  	if (e.type !== KEYPRESS && e.type !== CLICK) return false;
    return true;
  }
  return nextEvent(ms, match);
}

io.nextKeyOrClick = nextKeyOrClick;

export async function pause(ms) {
	const e = await nextKeyOrClick(ms);
  return (e.type !== TICK);
}

io.pause = pause;

export function waitForAck() {
	return io.pause(5 * 60 * 1000);	// 5 min
}

io.waitForAck = waitForAck;
