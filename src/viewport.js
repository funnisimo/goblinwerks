

import * as Utils from './utils.js';
import * as Flags from './flags.js';
import { map as MAP } from './map.js';
import { viewport, types, data as DATA, ui as UI, config as CONFIG } from './gw.js';


let VIEWPORT = null;

function setup(opts={}) {
  VIEWPORT = viewport.bounds = new types.Bounds(opts.x, opts.y, opts.w, opts.h);
  CONFIG.followPlayer = opts.followPlayer || false;
  CONFIG.autoCenter = opts.autoCenter || false;
}

viewport.setup = setup;

let VIEW_FILTER = null;

function setFilter(fn) {
  VIEW_FILTER = fn || null;
}

viewport.setFilter = setFilter;

// DRAW

function drawViewport(buffer, map) {
  map = map || DATA.map;
  if (!map) return;
  if (!map.flags & Flags.Map.MAP_CHANGED) return;

  let offsetX = 0;
  let offsetY = 0;
  if (CONFIG.followPlayer && DATA.player && DATA.player.x >= 0) {
    VIEWPORT.offsetX = DATA.player.x - VIEWPORT.centerX();
    VIEWPORT.offsetY = DATA.player.y - VIEWPORT.centerY();
  }
  else if (CONFIG.autoCenter && DATA.player && DATA.player.x >= 0) {
    const left = VIEWPORT.offsetX;
    const right = VIEWPORT.offsetX + VIEWPORT.width;
    const top = VIEWPORT.offsetY;
    const bottom = VIEWPORT.offsetY + VIEWPORT.height;

    const edgeX = Math.floor(VIEWPORT.width/5);
    const edgeY = Math.floor(VIEWPORT.height/5);

    const minX = 0;
    const maxX = map.width - VIEWPORT.width;
    if (left + edgeX > DATA.player.x) {
      VIEWPORT.offsetX = Utils.clamp(DATA.player.x - VIEWPORT.centerX(), minX, maxX);
    }
    else if (right - edgeX < DATA.player.x) {
      VIEWPORT.offsetX = Utils.clamp(DATA.player.x - VIEWPORT.centerX(), minX, maxX);
    }

    const minY = 0;
    const maxY = map.height - VIEWPORT.height;
    if (top + edgeY > DATA.player.y) {
      VIEWPORT.offsetY = Utils.clamp(DATA.player.y - VIEWPORT.centerY(), minY, maxY);
    }
    else if (bottom - edgeY < DATA.player.y) {
      VIEWPORT.offsetY = Utils.clamp(DATA.player.y - VIEWPORT.centerY(), minY, maxY);
    }
  }

  for(let x = 0; x < VIEWPORT.width; ++x) {
    for(let y = 0; y < VIEWPORT.height; ++y) {

      const buf = buffer[x + VIEWPORT.x][y + VIEWPORT.y];
      const mapX = x + VIEWPORT.offsetX;
      const mapY = y + VIEWPORT.offsetY;
      if (map.hasXY(mapX, mapY)) {
        MAP.getCellAppearance(map, mapX, mapY, buf);
        map.clearCellFlags(mapX, mapY, Flags.Cell.NEEDS_REDRAW | Flags.Cell.CELL_CHANGED);
      }
      else {
        buf.blackOut();
      }

      if (VIEW_FILTER) {
        VIEW_FILTER(buf, mapX, mapY, map);
      }
    }
  }
  buffer.needsUpdate = true;
  map.flags &= ~Flags.Map.MAP_CHANGED;
}

viewport.draw = drawViewport;

function hasXY(x, y) {
  let offsetX = 0;
  let offsetY = 0;
  if (CONFIG.followPlayer && DATA.player && DATA.player.x >= 0) {
    offsetX = DATA.player.x - VIEWPORT.centerX();
    offsetY = DATA.player.y - VIEWPORT.centerY();
  }
  return VIEWPORT.containsXY(x - offsetX + VIEWPORT.x, y - offsetY + VIEWPORT.y);
}

viewport.hasXY = hasXY;
