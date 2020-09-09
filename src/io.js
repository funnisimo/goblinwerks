
import { utils as UTILS } from './utils.js';
import { def, commands as COMMANDS, data as DATA } from './gw.js';


export var io = {};

const KEYMAPS = [];
const EVENTS = [];
const DEAD_EVENTS = [];

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
	return KEYMAPS.length && KEYMAPS[KEYMAPS.length - 1].busy;
}

io.busy = busy;

export function hasEvents() {
	return EVENTS.length;
}

io.hasEvents = hasEvents;


export function clearEvents() {
	while (EVENTS.length) {
		const ev = EVENTS.shift();
		DEAD_EVENTS.push(ev);
	}
}

io.clearEvents = clearEvents;


export function pushEvent(ev) {
  if (EVENTS.length) {
  	const last = EVENTS[EVENTS.length - 1];
    if (last.type === ev.type) {
			if (last.type === MOUSEMOVE) {
				last.x = ev.x;
			  last.y = ev.y;
	      return;
	    }
			else if (last.type === TICK) {
				last.dt += ev.dt;
				return;
			}
		}
  }

	if (CURRENT_HANDLER) {
  	CURRENT_HANDLER(ev);
  }
  else {
  	EVENTS.push(ev);
		while(EVENTS.length > 20) {
			io.recycleEvent(EVENTS.shift());
		}
  }
}

io.pushEvent = pushEvent;


export function dispatchEvent(ev) {
	let result;
	for(let i = KEYMAPS.length - 1 && (result === undefined); i >= 0; --i) {
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
				result = command(ev);
			}
			else if (COMMANDS[command]) {
				result = COMMANDS[command](ev);
			}
		}

		if (km.next === false) {
			result = false;
		}
	}
	io.recycleEvent(ev);
	if (result && result.then) {
		const km = KEYMAPS[KEYMAPS.length - 1];
		km.busy = true;
		result = result.then( () => km.busy = false );
	}
	return result;
}

io.dispatchEvent = dispatchEvent;

function recycleEvent(ev) {
	DEAD_EVENTS.push(ev);
}

io.recycleEvent = recycleEvent;

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

export function ignoreKeyEvent(e) {
	return CONTROL_CODES.includes(e.code);
}

io.ignoreKeyEvent = ignoreKeyEvent;


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


// IO


export function nextEvent(ms, match) {
	match = match || UTILS.TRUE;
	let elapsed = 0;

	while (EVENTS.length) {
  	const e = EVENTS.shift();
		if (e.type === MOUSEMOVE) {
			io.mouse.x = e.x;
			io.mouse.y = e.y;
		}

		if (match(e)) {
			return e;
		}
		io.recycleEvent(e);
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
	match = match || UTILS.TRUE;
	function matchingKey(e) {
  	if (e.type !== KEYPRESS) return false;
    return match(e);
  }
  return io.nextEvent(ms, matchingKey);
}

io.nextKeypress = nextKeypress;

export async function nextKeyOrClick(ms) {
	function match(e) {
  	if (e.type !== KEYPRESS && e.type !== CLICK) return false;
    return true;
  }
  return io.nextEvent(ms, match);
}

io.nextKeyOrClick = nextKeyOrClick;

export async function pause(ms) {
	const e = await io.nextKeyOrClick(ms);
  return (e.type !== TICK);
}

io.pause = pause;

export async function nextTick() {
	const e = await io.nextEvent(1);
  return (e.type === TICK) ? e.dt : -1;
}

io.nextTick = nextTick;

export function waitForAck() {
	return io.pause(5 * 60 * 1000);	// 5 min
}

io.waitForAck = waitForAck;
