
import { actions as Actions } from './index.js';
import * as Utils from '../utils.js';
import * as GW from '../gw.js';

export async function equip(actor, item, ctx={}) {
  if (!item) return false;

  const slot = item.kind.slot;
  if (!slot) {
    GW.message.add('%s does not seem to be equippable.', item.getName({ color: true, article: 'the' }));
    return false;
  }

  let success;

  const other = actor.slots[slot];
  if (other) {
    if (other === item) {
      GW.message.add('already equipped.');
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
    GW.message.add('you failed to equip %s.', item.getName({ article, color: true }));
    // TODO - Re-equip other?
    return false;
  }

  if (!ctx.quiet) {
    const article = GW.config.inventory ? 'your' : 'a';
    if (other) {
      GW.message.add('you swap %s for %s.', other.getName({ article: 'your', color: true }), item.getName({ article: article, color: true }));
    }
    else {
      // TODO - Custom verb? item.kind.equipVerb -or- Custom message? item.kind.equipMessage
      GW.message.add('You equip %s.', item.getName({ article, color: true }));
    }
  }

  return true;
}

Actions.equip = equip;



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
      GW.message.add('%s does not seem to be equippable.', item.getName({ color: true, article: true }));
      return false;
    }
    if (actor.slots[slot] !== item) {
      GW.message.add('%s does not seem to be equipped.', item.getName({ color: true, article: 'the' }));
      return false;
    }
  }

  item = actor.unequipSlot(slot); // will not change item unless it was a slot name

  // TODO - test for curse, etc...

  if (actor.slots[slot]) {
    // failed to unequip
    GW.message.add('You cannot remove your %s.', actor.slots[slot].getName({article: false, color: true }));
    return false;
  }

  if (!GW.config.inventory) {
    const map = ctx.map || GW.data.map;
    map.addItemNear(actor.x, actor.y, item);
  }

  if (item && !ctx.quiet) {
    // TODO - Custom verb? item.kind.equipVerb -or- Custom message? item.kind.equipMessage
    GW.message.add('You remove your %s.', item.getName({ article: false, color: true }));
  }

  return true;
}

Actions.unequip = unequip;
