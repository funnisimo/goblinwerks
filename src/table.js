
import * as Utils from './utils.js';
import * as Text from './text.js';
import * as Color from './color.js';
import * as GW from './gw.js';


export class Column {
  constructor(name, field, format, empty) {
    this.name = name || null;
    this.field = field || null;
    this.format = format || '%s';
    this.empty = empty || '-';
  }

  plotData(buffer, x, y, data, index, color) {
    if (!data) {
      buffer.plotText(x, y, color, this.empty);
      return Text.length(this.empty);
    }

    let text;
    if (typeof this.field === 'function') {
      text = this.field(data, index, color, this);
    }
    else {
      const field = data[this.field];
      text = Text.format(this.format, field);
    }
    buffer.plotText(x, y, color, text);
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
    if (opts.letters) {
      this.columns.unshift(new Column(null, (data, index) => {
        const letter = String.fromCharCode(97 + index);
        return letter + ')';
      }));
    }
    this.color = Color.from(opts.color || GW.colors.white);
    this.selectedColor = Color.from(opts.selectedColor || GW.colors.teal);
    this.disabledColor = Color.from(opts.disabledColor || GW.colors.black);
    this.selected = (opts.selected >= 0) ? opts.selected : -1;
    this.maxWidth = 0;
  }

  column(...args) {
    this.columns.push(new GW.types.Column(...args));
    return this;
  }

  plot(buffer, x0, y0, data) {
    if (Array.isArray(data)) {
      return this.plotArray(buffer, x0, y0, data);
    }
    return this.plotChain(buffer, x0, y0, data);
  }

  plotChain(buffer, x0, y0, data) {
    return this._plot(buffer, x0, y0, (current) => {
      return current ? current.next : data;
    });
  }

  plotArray(buffer, x0, y0, data) {
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
    this.maxWidth = 0;
    const headers = this.columns.some( (c) => c.name );

    let x = x0;
    let y = y0;
    for(let column of this.columns) {
      let maxWidth = 0;
      y = y0;
      if (headers) {
        maxWidth = Math.max(maxWidth, column.plotHeader(buffer, x, y++));
      }

      let count = 0;
      let current = nextFn();
      do {
        let color = (count == this.selected) ? this.selectedColor : this.color;
        if (current.disabled) {
          color = color.clone().mix(this.disabledColor, 50);
        }
        maxWidth = Math.max(maxWidth, column.plotData(buffer, x, y, current, count, color));
        ++y;
        current = nextFn(current);
        ++count;
      }
      while(current);

      x += (maxWidth + 1);
    }

    this.maxWidth = x - x0;
    return y;
  }

}

GW.types.Table = Table;


function make(...args) {
  return new GW.types.Table(...args);
}

GW.make.table = make;
