

import * as Flags from '../flags.js';
import * as Utils from '../utils.js';
import { actions as Actions } from '../actions/index.js';
import * as Actor from '../actor.js';
import * as FX from '../fx.js';
import { data as DATA, def, commands, ui as UI, message as MSG, config as CONFIG } from '../gw.js';

CONFIG.autoPickup = true;


async function movePlayer(e) {
  const actor = e.actor || DATA.player;
  const dir = e.dir;
  const newX = dir[0] + actor.x;
  const newY = dir[1] + actor.y;
  const map = DATA.map;
  const cell = map.cell(newX, newY);

  const ctx = { actor, map, x: newX, y: newY, cell };
  const isPlayer = actor.isPlayer();

  commands.debug('movePlayer');

  const r = await Actions.moveDir(actor, dir, ctx);
  return r;
}

commands.movePlayer = movePlayer;
