
import { types } from './gw.js';


export class Scheduler {
	constructor() {
  	this.next = null;
    this.time = 0;
    this.cache = null;
  }

	clear() {
		while(this.next) {
			const current = this.next;
			this.next = current.next;
			current.next = this.cache;
			this.cache = current;
		}
	}

  push(fn, delay=1) {
    let item;
    if (this.cache) {
    	item = this.cache;
      this.cache = this.cache.next;
    }
    else {
    	item = { fn: null, time: 0, next: null };
    }
		item.fn = fn;
    item.time = this.time + delay;
    if (!this.next) {
	    this.next = item;
    }
    else {
    	let current = this;
      let next = current.next;
    	while(next && next.time <= item.time) {
      	current = next;
        next = current.next;
      }
      item.next = current.next;
      current.next = item;
    }
		return item;
  }

  pop() {
  	const n = this.next;
		if (!n) return n;

    this.next = n.next;
    this.time = Math.max(n.time, this.time);	// so you can schedule -1 as a time uint
    const fn = n.fn;
    n.next = this.cache;
    this.cache = n;
    return fn;
  }

	remove(item) {
		if (this.next === item) {
			this.next = item.next;
			return;
		}
		prev = this.next;
		current = prev.next;
		while( current && current !== item ) {
			prev = current;
			current = current.next;
		}

		if (current === item) {
			prev.next = current.next;
		}
	}
}

types.Scheduler = Scheduler;
