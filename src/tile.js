
import * as Game from './game.js';
import * as Flags from './flags.js';
import { utils as Utils } from 'gw-utils';

import { types, def, make, data as DATA, flag as FLAG, tiles, colors as COLORS } from './gw.js';

export var tile = {};

const TileLayer = def.layer;

/** Tile Class */
export class Tile {
  /**
    * Creates a new Tile object.
    * @param {Object} [config={}] - The configuration of the Tile
    * @param {String|Number|String[]} [config.flags=0] - Flags and MechFlags for the tile
    * @param {String} [config.layer=GROUND] - Name of the layer for this tile
    * @param {String} [config.ch] - The sprite character
    * @param {String} [config.fg] - The sprite foreground color
    * @param {String} [config.bg] - The sprite background color
    */
  constructor(config={}, base={}) {
    Object.assign(this, {
      flags: 0,
      mechFlags: 0,
      layer: 0,
      priority: -1,
      sprite: {},
      events: {},
      light: null,  // id of light for this tile
      flavor: null,
      name: '',
      article: 'a',
      id: null,
      dissipate: 2000, // 20% of 10000
    });
    Utils.assignOmitting(['events'], this, base);
    Utils.assignOmitting(['Extends', 'extends', 'flags', 'mechFlags', 'sprite', 'events', 'ch', 'fg', 'bg'], this, config);
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

  /**
   * Returns the flags for the tile after the given event is fired.
   * @param {String} event - Name of the event to fire.
   * @returns {Number} The flags from the Tile after the event.
   */
  successorFlags(event) {
    const e = this.events[event];
    if (!e) return 0;
    const feature = e.feature;
    if (!feature) return 0;
    // const tile = FEATURES[feature].tile;
    // if (!tile) return 0;
    // return tiles[tile].flags;
  }

  /**
   * Returns whether or not this tile as the given flag.
   * Will return true if any bit in the flag is true, so testing with
   * multiple flags will return true if any of them is set.
   * @param {Number} flag - The flag to check
   * @returns {Boolean} Whether or not the flag is set
   */
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
      result = `Ω${color}Ω${this.name}∆`;
    }

    if (opts.article && this.article) {
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
        actor.kill();
        await Game.gameOver(false, 'ΩredΩyou fall into lava and perish.');
        return true;
      }
    }

    return false;
  }

}

types.Tile = Tile;

/**
 * GW.tile
 * @module tile
 */


/**
 * Adds a new Tile into the GW.tiles collection.
 * @param {String} id - The identifier for this Tile
 * @param {Object} [base] - The base tile from which to extend
 * @param {Object} config - The tile parameters
 * @returns {Tile} The newly created tile
 */
export function addTileKind(id, base, config) {
  if (arguments.length == 1) {
    config = args[0];
    base = config.Extends || config.extends || {};
    id = config.id || config.name;
  }
  else if (arguments.length == 2) {
    config = base;
    base = config.Extends || config.extends || {};
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

/**
 * Adds multiple tiles to the GW.tiles collection.
 * It extracts all the id:opts pairs from the config object and uses
 * them to call addTileKind.
 * @param {Object} config - The tiles to add in [id, opts] pairs
 * @returns {void} Nothing
 * @see addTileKind
 */
export function addTileKinds(config={}) {
  Object.entries(config).forEach( ([name, opts]) => {
    tile.addKind(name, opts);
  });
}

tile.addKinds = addTileKinds;
