
import * as Utils from './utils.js';

// This is based on EventEmitter3, but converted to classes and with a minor change to do an await...


var EVENTS = {};

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
class Listener {
  constructor(fn, context, once) {
    this.fn = fn;
    this.context = context;
    this.once = once || false;
    this.next = null;
  }

  matches(fn, context, once) {
    return ((this.fn === fn) &&
        ((once === undefined) || (once == this.once)) &&
        (!context || this.context === context));
  }
}


/**
 * Add a listener for a given event.
 *
 * @param {String} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {Listener}
 */
export function addListener(event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  const listener = new Listener(fn, context || null, once);
  Utils.addToChain(EVENTS, event, listener);
  return listener;
}

export function on(event, fn, context, once) {
  return addListener(event, fn, context, once);
}

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
export function once(event, fn, context) {
  return addListener(event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
export function removeListener(event, fn, context, once) {
  if (!EVENTS[event]) return;
  if (!fn) {
    clearEvent(event);
    return;
  }

  Utils.eachChain(EVENTS[event], (l) => {
    if (l.matches(fn, context, once)) {
      Utils.removeFromChain(EVENTS, event, l);
    }
  });
};

export function off(event, fn, context, once) {
  removeListener(event, fn, context, once);
}

/**
 * Clear event by name.
 *
 * @param {String} evt The Event name.
 */
export function clearEvent(event) {
  EVENTS[event] = null;
}


/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
export function removeAllListeners(event) {
  if (event) {
    if (EVENTS[event]) clearEvent(event);
  } else {
    EVENTS = {};
  }
};


/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
export async function emit(event, ...args) {
  if (!EVENTS[event]) return true;  // no events to send
  let listener = EVENTS[event];

  while(listener) {
    let next = listener.next;
    if (listener.once) removeListener(event, listener.fn, listener.context, true);
    await listener.fn.apply(listener.context, args);
    listener = next;
  }
};
