
import * as Flags from '../flags.js';
import { utils as Utils } from 'gw-core';
import { actions as Actions } from './index.js';
import * as GW from '../gw.js';


export async function push(actor, item, ctx={}) {
  if (!item) return false;

  const map = ctx.map || GW.data.map;
  const cell = ctx.cell || map.cell(ctx.x, ctx.y);
  const dir = ctx.dir || Utils.dirFromTo(actor, item);

  if (!item.hasActionFlag(Flags.Action.A_PUSH)) {
    ctx.item = item;
    if (!ctx.quiet) {
      GW.message.forPlayer(actor, 'Blocked!');
    }
    return false;
  }
  const pushX = item.x + dir[0];
  const pushY = item.y + dir[1];
  const pushCell = map.cell(pushX, pushY);
  if (!pushCell.isEmpty() || pushCell.hasTileFlag(Flags.Tile.T_OBSTRUCTS_ITEMS | Flags.Tile.T_OBSTRUCTS_PASSABILITY)) {
    if (!ctx.quiet) GW.message.forPlayer(actor, 'Blocked!');
    return false;
  }

  ctx.item = item;
  map.removeItem(item);
  map.addItem(pushX, pushY, item);
  // Do we need to activate stuff - key enter, key leave?
  return true;
}

Actions.push = push;
