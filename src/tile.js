
import { colors as COLORS } from './color.js';
import * as Game from './game.js';
import { text as TEXT } from './text.js';
import * as Flags from './flags.js';
import * as Utils from './utils.js';
import { types, def, make, data as DATA, flag as FLAG, tiles } from './gw.js';

export var tile = {};

const TileLayer = def.layer;


export class Tile {
  constructor(config={}, base={}) {
    Object.assign(this, {
      flags: 0,
      mechFlags: 0,
      layer: 0,
      priority: -1,
      sprite: make.sprite(),
      events: {},
      light: null,  // id of light for this tile
      flavor: null,
      name: '',
      article: 'a',
      id: null,
      dissipate: 2000, // 20% of 10000
    });
    Utils.assignOmitting(['events'], this, base);
    Utils.assignOmitting(['Extends', 'flags', 'mechFlags', 'sprite', 'events'], this, config);
    if (this.priority < 0) {
      this.priority = 50;
    }
    this.layer = TileLayer[this.layer] || this.layer;
    this.flags = Flags.Tile.toFlag(this.flags, config.flags);
    this.mechFlags = Flags.TileMech.toFlag(this.mechFlags, config.mechFlags || config.flags);

    if (config.sprite || (config.ch || config.fg || config.bg)) {
      this.sprite = make.sprite(config.sprite || config);
    }
    if (base.events) {
      Object.assign(this.events, base.events);
    }
    if (config.events) {
      Object.entries(config.events).forEach( ([key,info]) => {
        if (info) {
          this.events[key] = make.tileEvent(info);
        }
        else {
          delete this.events[key];
        }
      });
    }
  }

  successorFlags(event) {
    const e = this.events[event];
    if (!e) return 0;
    const feature = e.feature;
    if (!feature) return 0;
    // const tile = FEATURES[feature].tile;
    // if (!tile) return 0;
    // return tiles[tile].flags;
  }

  hasFlag(flag) {
    return (this.flags & flag) > 0;
  }

  hasFlags(flags, mechFlags) {
    return (!flags || (this.flags & flags)) && (!mechFlags || (this.mechFlags & mechFlags));
  }

  hasMechFlag(flag) {
    return (this.mechFlags & flag) > 0;
  }

  hasEvent(name) {
    return !!this.events[name];
  }

  getName(opts={}) {
    if (opts === true) { opts = { article: true }; }
    if (opts === false) { opts = {}; }
    if (typeof opts === 'string') { opts = { article: opts }; }

    if (!opts.article && !opts.color) return this.name;

    let result = this.name;
    if (opts.color) {
      let color = this.sprite.fg;
      if (opts.color instanceof types.Color) {
        color = opts.color;
      }
      result = TEXT.format('%R%s%R', color, this.name, null);
    }

    if (opts.article) {
      let article = (opts.article === true) ? this.article : opts.article;
      result = article + ' ' + result;
    }
    return result;
  }
  getDescription(opts={}) { return this.getName(opts); }

  getFlavor() { return this.flavor || this.getName(true); }


  async applyInstantEffects(map, x, y, cell) {

    const actor = cell.actor;
    const isPlayer = actor ? actor.isPlayer() : false;

    if (this.flags & Flags.Tile.T_LAVA && actor) {
      if (!cell.hasTileFlag(Flags.Tile.T_BRIDGE) && !actor.status.levitating) {
        actor.kind.kill(actor);
        await Game.gameOver(false, COLORS.red, 'you fall into lava and perish.');
        return true;
      }
    }

    return false;
  }

}

types.Tile = Tile;


export function addTileKind(id, base, config) {
  if (arguments.length == 1) {
    config = args[0];
    base = config.Extends || {};
    id = config.id || config.name;
  }
  else if (arguments.length == 2) {
    config = base;
    base = config.Extends || {};
  }

  if (typeof base === 'string') {
    base = tiles[base] || Utils.ERROR('Unknown base tile: ' + base);
  }

  config.name = config.name || id.toLowerCase();
  config.id = id;
  const tile = new types.Tile(config, base);
  tiles[id] = tile;
  return tile;
}

tile.addKind = addTileKind;

export function addTileKinds(config={}) {
  Object.entries(config).forEach( ([name, opts]) => {
    tile.addKind(name, opts);
  });
}

tile.addKinds = addTileKinds;
