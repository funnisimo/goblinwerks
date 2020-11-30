
import * as Utils from './utils.js';
import * as Text from './text.js';
import * as Color from './color.js';
import * as IO from './io.js';
import * as GW from './gw.js';


export class Column {
  constructor(name, field, empty) {
    this.name = name || null;
    this.template = null;
    this.custom = null;
    if (typeof field === 'function') {
      this.custom = field;
    }
    else if (field) {
      this.template = Text.compile(field);
    }
    this.empty = empty || '-';
  }

  plotData(buffer, x, y, data, index, color) {
    if (!data) {
      buffer.plotText(x, y, this.empty, color);
      return Text.length(this.empty);
    }

    let text;
    if (this.custom) {
      text = this.custom(data, index, color, this);
    }
    else {
      text = this.template(data);
    }
    buffer.plotText(x, y, text, color);
    return Text.length(text);
  }

  plotHeader(buffer, x, y) {
    if (!this.name) return 0;

    buffer.plotText(x, y, this.name);
    return Text.length(this.name);
  }
}

GW.types.Column = Column;


export class Table {
  constructor(opts={}) {
    if (Array.isArray(opts)) {
      opts = { columns: opts };
    }

    this.columns = opts.columns || [];
    this.letters = opts.letters || false;
    this.headers = opts.headers || false;
    if (opts.letters) {
      this.columns.unshift(new Column(null, (data, index) => {
        const letter = String.fromCharCode(97 + index);
        return letter + ')';
      }));
    }
    this.color = Color.from(opts.color || GW.colors.white);
    this.activeColor = Color.from(opts.selectedColor || GW.colors.teal);
    this.disabledColor = Color.from(opts.disabledColor || GW.colors.black);
    this.active = opts.active || 0;
    this.bounds = GW.make.bounds();
    this.selected = -1;
    this.cancelled = false;
    this.count = 0;
    this.bg = opts.bg;
  }

  get width() { return this.bounds.width; }
  get height() { return this.bounds.height; }

  column(...args) {
    const col = new GW.types.Column(...args);
    this.columns.push(col);
    return this;
  }

  plot(buffer, x0, y0, data) {
    if (Array.isArray(data)) {
      return this._plotArray(buffer, x0, y0, data);
    }
    return this._plotChain(buffer, x0, y0, data);
  }

  _plotChain(buffer, x0, y0, data) {
    return this._plot(buffer, x0, y0, (current) => {
      return current ? current.next : data;
    });
  }

  _plotArray(buffer, x0, y0, data) {
    let index = -1;
    return this._plot(buffer, x0, y0, () => {
      ++index;
      if (index < data.length) {
        return data[index];
      }
      index = -1;
      return null;
    });
  }

  _plot(buffer, x0, y0, nextFn) {
    if (this.bounds.width) {
      buffer.blackOutRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, this.bg);
    }
    this.bounds.x = x0;
    this.bounds.y = y0;
    const hasHeaders = this.columns.some( (c) => c.name );

    let x = x0;
    let y = y0;
    for(let column of this.columns) {
      let maxWidth = 0;
      y = y0;
      if (this.headers && hasHeaders) {
        maxWidth = Math.max(maxWidth, column.plotHeader(buffer, x, y++));
      }

      this.count = 0;
      let current = nextFn();
      do {
        let color = (this.count == this.active) ? this.activeColor : this.color;
        if (current.disabled) {
          color = color.clone().mix(this.disabledColor, 50);
        }
        maxWidth = Math.max(maxWidth, column.plotData(buffer, x, y, current, this.count, color));
        ++y;
        current = nextFn(current);
        ++this.count;
      }
      while(current);

      x += (maxWidth + 1);
    }

    this.bounds.width = x - x0;
    this.bounds.height = y - y0;
    return y;
  }

  async loop(handler) {
    while(true) {
      const ev = await IO.nextEvent();
      if (await this.dispatchEvent(ev, handler)) {
        return true;
      }
    }
  }

  async dispatchEvent(ev, handler={}) {
    this.cancelled = false;
    this.selected = -1;

    if (await IO.dispatchEvent(ev, handler)) return true;

    return await IO.dispatchEvent(ev, {
      Escape: () => {
        this.cancelled = true;
        return true;
      },
      Enter: () => {
        this.selected = this.active;
        return true;
      },
      mousemove: (ev) => {
        if (this.bounds.containsXY(ev.x, ev.y)) {
          const index = ev.y - this.bounds.y - (this.headers ? 1 : 0);
          if (index >= 0) {
            this.active = index;
            return true;
          }
        }
      },
      click: (ev) => {
        if (this.bounds.containsXY(ev.x, ev.y)) {
          const index = ev.y - this.bounds.y - (this.headers ? 1 : 0);
          if (index >= 0) {
            this.selected = index;
            return true;
          }
        }
      },
      dir: (ev) => {
        if(ev.dir[1] < 0) {
          this.active = (this.count + this.active - 1) % this.count;
        }
        else if (ev.dir[1] > 0) {
          this.active = (this.active + 1) % this.count;
        }
        return true;
      },
      keypress: (ev) => {
        if (!this.letters) return false;
        const index = ev.key.charCodeAt(0) - 97;
        if (index >= 0 && index < this.count) {
          this.active = index;
          return true;
        }
        return false;
      }
    });
  }

}

GW.types.Table = Table;


export function make(...args) {
  return new GW.types.Table(...args);
}

GW.make.table = make;
