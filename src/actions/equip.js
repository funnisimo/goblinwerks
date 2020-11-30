
import { actions as Actions } from './index.js';
import * as Utils from '../utils.js';
import * as GW from '../gw.js';


GW.message.addKind('EQUIP_NO', '§the item§ §do§ not seem to be equippable.');
GW.message.addKind('EQUIP_FAILED', '§you§ failed to equip §the item§.');
GW.message.addKind('EQUIP_SWAP', '§you§ §swap§ your §other§ for §your actor§ §item§.');
GW.message.addKind('EQUIP_SWAP_FLOOR', '§you§ §swap§ your §other§ for §a item§.');
GW.message.addKind('EQUIP_ITEM', '§you§ §equip§ §your §item§.');
GW.message.addKind('EQUIP_ITEM_FLOOR', '§you§ §equip§ §a item§.');
GW.message.addKind('EQUIP_ALREADY', 'already equipped.');


export async function equip(actor, item, ctx={}) {
  if (!item) return false;

  const slot = item.kind.slot;
  if (!slot) {
    GW.message.add('EQUIP_NO', { actor, item });
    return false;
  }

  let success;

  const other = actor.slots[slot];
  if (other) {
    if (other === item) {
      GW.message.add('EQUIP_ALREADY', { actor, item });
      return false;
    }

    const quietCtx = Object.assign({ quiet: true }, ctx);
    success = await Actions.unequip(actor, slot, quietCtx);
    if (!success) {
      return false;
    }
  }

  success = actor.equip(item);
  if (!success) {
    const article = Utils.chainIncludes(actor.pack, item) ? 'your' : true;
    GW.message.add('EQUIP_FAILED', { actor, item });
    // TODO - Re-equip other?
    return false;
  }

  if (!ctx.quiet) {
    let id = (other) ? 'EQUIP_SWAP' : 'EQUIP_ITEM';
    if (!GW.config.inventory) {
      id += '_FLOOR';
    }
    GW.message.add(id, { actor, other, item });
  }

  if (actor.kind.calcEquipmentBonuses) {
    actor.kind.calcEquipmentBonuses(actor);
  }

  return true;
}

Actions.equip = equip;


GW.message.addKind('UNEQUIP_NO', '$the item$ does not seem to be equippable.');
GW.message.addKind('UNEQUIP_NOT_EQUIPPED', '$the item$ does not seem to be equipped.');
GW.message.addKind('UNEQUIP_FAIL', '$you$ cannot remove $your$ $item$.');
GW.message.addKind('UNEQUIP_ITEM', '$you$ $remove$ $your$ $item$.');

export async function unequip(actor, item, ctx={}) {
  if (!item) return false;

  let slot;
  let other;

  if (typeof item === 'string') {
    slot = item;
  }
  else {
    slot = item.kind.slot;
    if (!slot) {
      GW.message.add('UNEQUIP_NO', { item });
      return false;
    }
    if (actor.slots[slot] !== item) {
      GW.message.add('UNEQUIP_NOT_EQUIPPED', { item });
      return false;
    }
  }

  item = actor.unequipSlot(slot); // will not change item unless it was a slot name

  // TODO - test for curse, etc...

  if (actor.slots[slot]) {
    // failed to unequip
    GW.message.add('UNEQUIP_FAIL', { actor, item: actor.slots[slot] });
    return false;
  }

  if (!GW.config.inventory) {
    const map = ctx.map || GW.data.map;
    map.addItemNear(actor.x, actor.y, item);
  }

  if (item && !ctx.quiet) {
    // TODO - Custom verb? item.kind.equipVerb -or- Custom message? item.kind.equipMessage
    GW.message.add('UNEQUIP_ITEM', { actor, item });
  }

  if (actor.kind.calcEquipmentBonuses) {
    actor.kind.calcEquipmentBonuses(actor);
  }

  return true;
}

Actions.unequip = unequip;
