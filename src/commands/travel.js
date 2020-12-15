

import { actions as Actions } from '../actions/index.js';
import { data as DATA, def, commands, ui as UI, message as MSG, config as CONFIG } from '../gw.js';


async function travel(e) {
  const actor = e.actor || DATA.player;
  const newX = e.mapX;
  const newY = e.mapY;
  const map = DATA.map;

  const ctx = { actor, map, x: newX, y: newY };
  const isPlayer = actor.isPlayer();

  if (!map.hasXY(newX, newY)) return false;

  actor.updateMapToMe();
  actor.travelDest = [newX,newY];

  let r = await Actions.travel(actor, ctx);
  return r;
}

commands.travel = travel;
