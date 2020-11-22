
import * as Table from './table.js';
import * as Text from './text.js';
import * as GW from './gw.js';


export class List extends GW.types.Table {
  constructor(opts={}) {
    super(opts);
    opts.format = opts.format || '%s';
    this.column(opts.header,
      ((data) => Text.format(opts.format, data.text || data)),
      opts.format, '-'
    );
  }
}

GW.types.List = List;

export function make(...args) {
  return new GW.types.List(...args);
}

GW.make.list = make;
