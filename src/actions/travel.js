
import { utils as Utils } from 'gw-utils';
import * as GW from '../gw.js';
import { actions as Actions } from './index.js';


export async function travel(actor, ctx={}) {

  const map = ctx.map || GW.data.map;

  if (!actor.travelDest) {
    return false;
  }
  if (actor.travelDest[0] == actor.x && actor.travelDest[1] == actor.y) {
    actor.travelDest = null;
    GW.ui.updatePathToCursor();
    return false;
  }

  const path = actor.getPath(actor.travelDest[0], actor.travelDest[1], map);

  GW.ui.updatePath(path);
  if (!path || path.length <= 1) {  // 1 step is just the destination
    actor.travelDest = null;
    return false;
  }

  const dir = Utils.dirFromTo(actor, path[path.length - 2]);
  return await Actions.moveDir(actor, dir, ctx);
}



Actions.travel = travel;
