
import { NOOP, TRUE, FALSE } from './utils.js';
import { io, def } from './gw.js';


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


// KEYBOARD

export function makeKeyEvent(e) {
	let ev;

	let flags = 0;
  let key = e.key;

  if (e.shiftKey) {
    key = key.toUpperCase();
  }
  if (e.ctrlKey) 	{
    key = '^' + key;
  }
  if (e.metaKey) 	{
    key = '#' + key;
  }

	if (DEAD_EVENTS.length) {
  	ev = DEAD_EVENTS.pop();

		ev.shiftKey = e.shiftKey;
		ev.ctrlKey = e.ctrlKey;
		ev.altKey = e.altKey;
		ev.metaKey = e.metaKey;

    ev.type = KEYPRESS;
    ev.key = key;
    ev.code = e.code;
    ev.x = -1;
    ev.y = -1;

    return ev;
  }
  return { type: KEYPRESS, key: key, code: e.code, x: -1, y: -1, shiftKey: e.shiftKey, altKey: e.altKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey };
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


export function keyDirection(key) {
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

io.keyDirection = keyDirection;

// MOUSE

export var mouse = {x: -1, y: -1};
io.mouse = mouse;

export function makeMouseEvent(e, x, y) {

  let event = e.buttons ? CLICK : MOUSEMOVE;

	if (DEAD_EVENTS.length) {
  	ev = DEAD_EVENTS.pop();

		ev.shiftKey = e.shiftKey;
		ev.ctrlKey = e.ctrlKey;
		ev.altKey = e.altKey;
		ev.metaKey = e.metaKey;

    ev.type = event;
    ev.key = null;
    ev.code = null;
    ev.x = x;
    ev.y = y;

    return ev;
  }
  return { type: event, key: null, code: null, x: x, y: y, shiftKey: e.shiftKey, altKey: e.altKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey };
}

io.makeMouseEvent = makeMouseEvent;

// export function onmousemove(e) {
// 	const x = canvas.toX(e.clientX);
// 	const y = canvas.toy(e.clientY);
// 	const ev = makeMouseEvent(e, x, y);
// 	io.pushEvent(ev);
// }
//
// io.onmousemove = onmousemove;
//
// export function onmousedown(e) {
// 	const x = canvas.toX(e.clientX);
// 	const y = canvas.toy(e.clientY);
// 	const ev = makeMouseEvent(e, x, y);
// 	io.pushEvent(ev);
// }
//
// io.onmousedown = onmousedown;

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

export async function dispatchEvent(h, e) {
	if (!e || !h) return;
  const fn = h[e.type] || FALSE;
  return await fn.call(h, e);
}

io.dispatchEvent = dispatchEvent;
