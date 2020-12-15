
import * as Color from './color.js';
import * as Text from './text.js';
import * as Flags from './flags.js';
import { types, flavor, data as DATA, def, ui as UI, tiles as TILES, itemKinds as ITEM_KINDS, message as MSG, colors as COLORS } from './gw.js';


const flavorTextColor = Color.addKind('flavorText', 50, 40, 90);
const flavorPromptColor = Color.addKind('flavorPrompt', 100, 90, 20);

let FLAVOR_TEXT = '';
let NEED_FLAVOR_UPDATE = false;
let FLAVOR_BOUNDS = null;
let IS_PROMPT = false;

function setupFlavor(opts={}) {
  FLAVOR_BOUNDS = flavor.bounds = new types.Bounds(opts.x, opts.y, opts.w, 1);
}

flavor.setup = setupFlavor;

function setFlavorText(text) {
  FLAVOR_TEXT = Text.capitalize(text);
  NEED_FLAVOR_UPDATE = true;
  IS_PROMPT = false;
  UI.requestUpdate();
}

flavor.setText = setFlavorText;


function showPrompt(text) {
  FLAVOR_TEXT = Text.capitalize(text);
  NEED_FLAVOR_UPDATE = true;
  IS_PROMPT = true;
  UI.requestUpdate();
}

flavor.showPrompt = showPrompt;


function drawFlavor(buffer) {
  if (!NEED_FLAVOR_UPDATE || !FLAVOR_BOUNDS) return;
  const color = IS_PROMPT ? flavorPromptColor : flavorTextColor;
  if (Text.length(FLAVOR_TEXT) > FLAVOR_BOUNDS.width) {
    buffer.wrapText(FLAVOR_BOUNDS.x, FLAVOR_BOUNDS.y, FLAVOR_BOUNDS.width, FLAVOR_TEXT, color, COLORS.black);
    MSG.needsRedraw();
  }
  else {
    buffer.wrapText(FLAVOR_BOUNDS.x, FLAVOR_BOUNDS.y, FLAVOR_BOUNDS.width, FLAVOR_TEXT, color, COLORS.black);
  }
}

flavor.draw = drawFlavor;

function clearFlavor() {
  flavor.setText('');
}

flavor.clear = clearFlavor;


function showFlavorFor(x, y) {
  if (!DATA.map) return;
  const buf = flavor.getFlavorText(DATA.map, x, y);
  flavor.setText(buf);
	return true;
}

flavor.showFor = showFlavorFor;

function getFlavorText(map, x, y) {

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
	let object = '';
	let adjective;

  const player = DATA.player || null;
  const actor = player;

	monst = null;
	standsInTerrain = ((cell.highestPriorityTile().mechFlags & Flags.TileMech.TM_STAND_IN_TILE) ? true : false);
	theItem = map.itemAt(x, y);
	monsterDormant = false;
	if (cell.flags & Flags.Cell.HAS_MONSTER) {
		monst = map.actorAt(x, y);
	} else if (cell.flags & Flags.Cell.HAS_DORMANT_MONSTER) {
		monst = map.dormantAt(x, y);
		monsterDormant = true;
	}

	if (player && x == player.x && y == player.y) {
		if (player.status.levitating) {
			buf = Text.apply("you are hovering above §flavor§.", { actor: player, flavor: cell.tileFlavor() });
		}
    else {
			// if (theItem) {
			// 	buf = ITEM.getFlavor(theItem);
			// }
      // else {
        buf = Text.apply('you see yourself.', {actor});
      // }
		}
    return buf;
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
		if (cell.flags & Flags.Cell.REVEALED) { // memory
			if (cell.memory.item) {
        // if (player.status.hallucinating && !GW.GAME.playbackOmniscience) {
        //     object = GW.item.describeHallucinatedItem();
        // } else {
            object = cell.memory.item.getName({ color: false, article: true, quantity: cell.memory.itemQuantity });
            // object = GW.item.describeItemBasedOnParameters(cell.rememberedItemCategory, cell.rememberedItemKind, cell.rememberedItemQuantity);
        // }
      } else if (cell.memory.actor) {
        object = cell.memory.actor.getName({ color: false, article: true });
			} else {
				object = TILES[cell.memory.tile].getFlavor();
			}
			buf = Text.apply("you remember seeing §object§ here.", { actor, object });
		} else if (cell.flags & Flags.Cell.MAGIC_MAPPED) { // magic mapped
			buf = Text.apply("you expect §text§ to be here.", { actor, text: TILES[cell.memory.tile].getFlavor() });
		}
		return buf;
	}

  let needObjectArticle = false;
	if (monst) {
		object = monst.getName({ color: false, article: true }) + ' standing';
    needObjectArticle = true;
	} else if (theItem) {
    object = theItem.getName({ color: false, article: true });
    needObjectArticle = true;
	}

  let article = cell.liquid ? ' in ' : ' on ';

  let surface = '';
  if (cell.surface) {
    const tile = cell.surfaceTile;
    if (needObjectArticle) {
      needObjectArticle = false;
      object += ' on ';
    }
    if (tile.flags & Flags.Tile.T_BRIDGE) {
      article = ' over ';
    }
    surface = cell.surfaceTile.getFlavor() + article;
  }

  let liquid = '';
  if (cell.liquid) {
    liquid = cell.liquidTile.getFlavor() + ' covering ';
    if (needObjectArticle) {
      needObjectArticle = false;
      object += ' in ';
    }
  }

  if (needObjectArticle) {
    needObjectArticle = false;
    object += ' on ';
  }
  let ground = cell.groundTile.getFlavor();

  buf = Text.apply("you §action§ §text§.", { actor, action: (map.isVisible(x, y) ? "see" : "sense"), text: object + surface + liquid + ground });

  return buf;
}

flavor.getFlavorText = getFlavorText;
