
import { colors as COLORS, color as COLOR } from './color.js';
import { text as TEXT } from './text.js';
import { Flags as TileFlags, MechFlags as TileMechFlags } from './tile.js';
import { Flags as CellFlags, MechFlags as CellMechFlags } from './cell.js';
import { tiles as TILES } from './tile.js';
import { types, flavor, data as DATA, def, ui as UI } from './gw.js';


const flavorTextColor = COLOR.install('flavorText', 50, 40, 90);

let FLAVOR_TEXT = '';
let NEED_FLAVOR_UPDATE = false;
let SETUP = null;

function setupFlavor(opts={}) {
  SETUP = flavor.bounds = new types.Bounds(opts.x, opts.y, opts.w, 1);
}

flavor.setup = setupFlavor;

function setFlavorText(text) {
  FLAVOR_TEXT = TEXT.capitalize(text);
  NEED_FLAVOR_UPDATE = true;
  UI.requestUpdate();
}

flavor.setText = setFlavorText;


function drawFlavor(buffer) {
  if (!NEED_FLAVOR_UPDATE || !SETUP) return;
  buffer.plotLine(SETUP.x, SETUP.y, SETUP.width, FLAVOR_TEXT, flavorTextColor, COLORS.black);
}

flavor.draw = drawFlavor;



function showFlavorFor(x, y) {
  if (!DATA.map) return;
  const map = DATA.map;
	const cell = map.cell(x, y);
	let buf;

	let monst;
	let theItem, magicItem;
	let standsInTerrain;
	let subjectMoving;
	let prepositionLocked = false;
	let monsterDormant;

	let subject;
	let verb;
	let preposition;
	let object;
	let adjective;

  const player = DATA.player || null;

	monst = null;
	standsInTerrain = ((cell.highestPriorityTile().mechFlags & TileMechFlags.TM_STAND_IN_TILE) ? true : false);
	theItem = map.itemAt(x, y);
	monsterDormant = false;
	if (cell.flags & CellFlags.HAS_MONSTER) {
		monst = map.actorAt(x, y);
	} else if (cell.flags & CellFlags.HAS_DORMANT_MONSTER) {
		monst = map.dormantAt(x, y);
		monsterDormant = true;
	}

	if (player && x == player.x && y == player.y) {
		if (player.status[def.STATUS_LEVITATING]) {
			buf = TEXT.format("you are hovering above %s.", cell.tileText());
		}
    else {
			// if (theItem) {
			// 	buf = ITEM.flavorText(theItem);
			// }
      // else {
        buf = 'you see yourself.';
      // }
		}
    flavor.setText(buf);
		return true;
	}
  //
	// // detecting magical items
	// magicItem = null;
	// if (theItem && !playerCanSeeOrSense(x, y)
	// 	&& GW.item.isDetected(theItem))
	// {
	// 	magicItem = theItem;
	// } else if (monst && !playerCanSeeOrSense(x, y)
	// 		   && monst.carriedItem
	// 		   && GW.item.isDetected(monst.carriedItem))
  // {
	// 	magicItem = monst.carriedItem;
	// }
	// if (magicItem) {
	// 	return GW.item.detectedText(magicItem);
	// }
  //
	// // telepathy
	// if (monst
  //       && !(cell.flags & VISIBLE) 					 // && !GW.player.canSeeMonster(monst)
	// 			&& (cell.flags & TELEPATHIC_VISIBLE)) // GW.actor.telepathicallyRevealed(monst))
	// {
	// 	return GW.actor.telepathyText(monst);
	// }
  //
	// if (monst && !playerCanSeeOrSense(x, y)) {
  //       // Monster is not visible.
	// 	monst = null;
	// }

	if (!map.isAnyKindOfVisible(x, y)) {
    buf = '';
		if (cell.flags & CellFlags.REVEALED) { // memory
			// if (cell.rememberedItemCategory) {
      //   if (player.status[GW.const.STATUS_HALLUCINATING] && !GW.GAME.playbackOmniscience) {
      //       object = GW.item.describeHallucinatedItem();
      //   } else {
      //       object = GW.item.describeItemBasedOnParameters(cell.rememberedItemCategory, cell.rememberedItemKind, cell.rememberedItemQuantity);
      //   }
			// } else {
				object = TILES[cell.memory.tile].description;
			// }
			buf = TEXT.format("you remember seeing %s here.", object);
		} else if (cell.flags & CellFlags.MAGIC_MAPPED) { // magic mapped
			buf = TEXT.format("you expect %s to be here.", TILES[cell.memory.tile].description);
		}
		flavor.setText(buf);
    return true;
	}

	// if (monst) {
	// 	return GW.actor.flavorText(monst);
	// } else if (theItem) {
	// 	return GW.item.flavorText(theItem);
	// }

	buf = TEXT.format("you %s %s.", (map.isVisible(x, y) ? "see" : "sense"), cell.tileText());
  flavor.setText(buf);
	return true;
}

flavor.showFor = showFlavorFor;
