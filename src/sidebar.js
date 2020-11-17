
import * as Color from './color.js';
import * as Flags from './flags.js';
import * as Utils from './utils.js';
import { grid as GRID } from './grid.js';
import * as Text from './text.js';
import { cell as CELL } from './cell.js';
import { map as MAP } from './map.js';
import * as GW from './gw.js';

// Sidebar

let SIDE_BOUNDS = null;
let SIDEBAR_CHANGED = true;
let SIDEBAR_ENTRIES = [];
const SIDEBAR_FOCUS = [-1,-1];

const sidebar = GW.sidebar;
const DATA = GW.data;

sidebar.debug = Utils.NOOP;

const blueBar = Color.addKind('blueBar', 	15,		10,		50);
const redBar = 	Color.addKind('redBar', 	45,		10,		15);
const purpleBar = Color.addKind('purpleBar', 	50,		0,		50);
const greenBar = Color.addKind('greenBar', 	10,		50,		10);


export function setup(opts={}) {
  SIDE_BOUNDS = sidebar.bounds = new GW.types.Bounds(opts.x, opts.y, opts.width, opts.height);
}

sidebar.setup = setup;

export function needsRedraw() {
  SIDEBAR_CHANGED = true;
}

sidebar.needsRedraw = needsRedraw;


function sortSidebarItems(items) {
	let distFn;
	if (DATA.player && DATA.player.distanceMap) {
		distFn = ((item) => DATA.player.distanceMap[item.x][item.y]);
	}
	else {
		const x = DATA.player ? DATA.player.x : 0;
		const y = DATA.player ? DATA.player.y : 0;
		distFn = ((item) => Utils.distanceBetween(item.x, item.y, x, y));
	}
	items.forEach( (item) => {
		item.dist = distFn(item);
	});
	items.sort( (a, b) => {
		if (a.priority != b.priority) {
			return a.priority - b.priority;
		}
		return a.dist - b.dist;
	});
}


function refreshSidebar(map) {

	// Gather sidebar entries
	const entries = [];
	const doneCells = GRID.alloc();
  let same = true;

	if (DATA.player) {
		doneCells[DATA.player.x][DATA.player.y] = 1;
    if (DATA.player.changed()) {
      same = false;
    }
	}

	// Get actors
  let actor = map.actors;
	while (actor) {
		const x = actor.x;
		const y = actor.y;
		if (doneCells[x][y]) {
      actor = actor.next;
      continue;
    }
		doneCells[x][y] = 1;

		const cell = map.cell(x, y);
		const changed = actor.changed();

		if (cell.isVisible()) {
			entries.push({ map, x, y, dist: 0, priority: 1, draw: sidebar.addActor, entity: actor, changed });
		}
		else if (cell.isAnyKindOfVisible()) {
			entries.push({ map, x, y, dist: 0, priority: 2, draw: sidebar.addActor, entity: actor, changed });
		}
		else if (cell.isRevealed(true) && actor.kind.alwaysVisible(actor) && GW.viewport.hasXY(x, y))
		{
			entries.push({ map, x, y, dist: 0, priority: 3, draw: sidebar.addActor, entity: actor, changed, dim: true });
		}
    actor = actor.next;
	}

	// Get entries
  let item = map.items;
	while (item) {
		const x = item.x;
		const y = item.y;
		if (doneCells[x][y]) {
      item = item.next;
      continue;
    }

    if (item.hasKindFlag(Flags.ItemKind.IK_NO_SIDEBAR)) {
      item = item.next;
      continue;
    }

		doneCells[x][y] = 1;

		const cell = map.cell(x, y);
		const changed = item.changed();

		if (cell.isVisible()) {
			entries.push({ map, x: x, y: y, dist: 0, priority: 1, draw: sidebar.addItem, entity: item, changed });
		}
		else if (cell.isAnyKindOfVisible()) {
			entries.push({ map, x: x, y: y, dist: 0, priority: 2, draw: sidebar.addItem, entity: item, changed });
		}
		else if (cell.isRevealed() && GW.viewport.hasXY(x, y))
		{
			entries.push({ map, x: x, y: y, dist: 0, priority: 3, draw: sidebar.addItem, entity: item, changed, dim: true });
		}
    item = item.next;
	}

	// Get tiles
	map.forEach( (cell, i, j) => {
		if (!(cell.isRevealed(true) || cell.isAnyKindOfVisible()) || !GW.viewport.hasXY(i, j)) return;
		// if (cell.flags & (Flags.Cell.HAS_PLAYER | Flags.Cell.HAS_MONSTER | Flags.Cell.HAS_ITEM)) return;
		if (doneCells[i][j]) return;
		doneCells[i][j] = 1;

		const changed = cell.changed();
		if (cell.listInSidebar()) {
			const priority = (cell.isVisible() ? 1 : (cell.isAnyKindOfVisible() ? 2 : 3));
      const dim = !cell.isAnyKindOfVisible();
			entries.push({ map, x: i, y: j, dist: 0, priority, draw: sidebar.addMapCell, entity: cell, changed, dim });
		}
	});

	GRID.free(doneCells);

	// sort entries
	sortSidebarItems(entries);

	// compare to current list
	const max = Math.floor(SIDE_BOUNDS.height / 2);
	same = same && entries.every( (a, i) => {
		if (i > max) return true;
		const b = SIDEBAR_ENTRIES[i];
		if (!b) return false;
		if (a.x !== b.x || a.y !== b.y || a.priority !== b.priority) return false;
		if (a.entity !== b.entity || a.changed) return false;
		return true;
	});
	if (same && entries.length && (SIDEBAR_ENTRIES.length >= entries.length)) return;

	SIDEBAR_CHANGED = true;
	SIDEBAR_ENTRIES = entries;
}

sidebar.refresh = refreshSidebar;


// returns whether or not the cursor changed to a new entity (incl. none)
function focusSidebar(x, y) {
	if (!DATA.player || DATA.player.x !== x || DATA.player.y !== y) {
		if (! SIDEBAR_ENTRIES.find( (entry) => (entry.x == x && entry.y == y) ) ) {
			x = -1;
			y = -1;
		}
	}
	if (x !== SIDEBAR_FOCUS[0] || y !== SIDEBAR_FOCUS[1]) {
		SIDEBAR_FOCUS[0] = x;
		SIDEBAR_FOCUS[1] = y;
		SIDEBAR_CHANGED = true;
		// GW.ui.showLocDetails(x, y);
    return true;
	}
  return false;
}

sidebar.focus = focusSidebar;


function highlightSidebarRow(sy) {

  let x = -1;
  let y = -1;

	if (!SIDEBAR_ENTRIES || SIDEBAR_ENTRIES.length == 0) {
    x = DATA.player.x;
    y = DATA.player.y;
	}
	else {
		let best = { row: -1 };
		SIDEBAR_ENTRIES.forEach( (item, i) => {
			if (item.row > best.row && item.row <= sy) {
				best = item;
			}
		});
		if (best.row > 0) {
			x = best.x;
      y = best.y;
		}
		else if (best.row < 0) {
      x = DATA.player.x;
      y = DATA.player.y;
		}
	}

  if (x !== SIDEBAR_FOCUS[0] || y !== SIDEBAR_FOCUS[1]) {
		SIDEBAR_FOCUS[0] = x;
		SIDEBAR_FOCUS[1] = y;
		SIDEBAR_CHANGED = true;
    GW.ui.setCursor(x, y);
		// GW.ui.showLocDetails(x, y);
    return true;
	}

}

sidebar.highlightRow = highlightSidebarRow;


function sidebarNextTarget() {
	let index = 0;
	if (SIDEBAR_ENTRIES.length == 0) {
		sidebar.focus(DATA.player.x, DATA.player.y);
		return SIDEBAR_FOCUS;
	}
	if (SIDEBAR_FOCUS[0] < 0) {
		sidebar.focus(SIDEBAR_ENTRIES[0].x, SIDEBAR_ENTRIES[0].y);
    return SIDEBAR_FOCUS;
	}

	index = SIDEBAR_ENTRIES.findIndex( (i) => i.x == SIDEBAR_FOCUS[0] && i.y == SIDEBAR_FOCUS[1] ) + 1;
	if (index >= SIDEBAR_ENTRIES.length) {
		sidebar.focus(DATA.player.x, DATA.player.y);
	}
	else {
		sidebar.focus(SIDEBAR_ENTRIES[index].x, SIDEBAR_ENTRIES[index].y);
	}
  return SIDEBAR_FOCUS;
}

sidebar.nextTarget = sidebarNextTarget;


function sidebarPrevTarget() {
	let index = 0;
	if (SIDEBAR_ENTRIES.length == 0) {
		sidebar.focus(DATA.player.x, DATA.player.y);
    return SIDEBAR_FOCUS;
	}
	if (SIDEBAR_FOCUS[0] < 0 || Utils.equalsXY(DATA.player, SIDEBAR_FOCUS)) {
		sidebar.focus(SIDEBAR_ENTRIES[SIDEBAR_ENTRIES.length - 1].x, SIDEBAR_ENTRIES[SIDEBAR_ENTRIES.length - 1].y);
    return SIDEBAR_FOCUS;
	}

	index = SIDEBAR_ENTRIES.findIndex( (i) => i.x == SIDEBAR_FOCUS[0] && i.y == SIDEBAR_FOCUS[1] ) - 1;
	if (index < 0) {
		sidebar.focus(DATA.player.x, DATA.player.y);
	}
	else {
		sidebar.focus(SIDEBAR_ENTRIES[index].x, SIDEBAR_ENTRIES[index].y);
	}
  return SIDEBAR_FOCUS;
}

sidebar.prevTarget = sidebarPrevTarget;


function drawSidebar(buf, forceFocused) {
	if (!SIDEBAR_CHANGED) return false;

	const dim = (SIDEBAR_FOCUS[0] >= 0);

	let y = 0;
	let focusShown = !dim;
	let highlight = false;

  buf.fillRect(SIDE_BOUNDS.x, SIDE_BOUNDS.y, SIDE_BOUNDS.width, SIDE_BOUNDS.height, ' ', GW.colors.black, GW.colors.black);

	if (DATA.player) {
		highlight = (SIDEBAR_FOCUS[0] === DATA.player.x && SIDEBAR_FOCUS[1] === DATA.player.y );
		y = sidebar.addActor({ entity: DATA.player, map: DATA.map, x: DATA.player.x, y: DATA.player.y }, y, dim && !highlight, highlight, buf);
		focusShown = focusShown || highlight;
	}

	if (forceFocused) {
		const info = SIDEBAR_ENTRIES.find( (i) => (i.x == SIDEBAR_FOCUS[0] && i.y == SIDEBAR_FOCUS[1]));
		if (info) {
			info.row = y;
			y = info.draw(info, y, false, true, buf);
			focusShown = true;
		}
	}

	let i = 0;
	while( y < SIDE_BOUNDS.height && i < SIDEBAR_ENTRIES.length ) {
		const entry = SIDEBAR_ENTRIES[i];
		highlight = false;
    let dimEntry = entry.dim || dim;
		if ((SIDEBAR_FOCUS[0] === entry.x && SIDEBAR_FOCUS[1] === entry.y))
		{
			if (focusShown) {
				++i;
				continue;
			}
			highlight = true;
      dimEntry = false;
		}
		entry.row = y;
		y = entry.draw(entry, y, dimEntry, highlight, buf);
		if (highlight && y <= SIDE_BOUNDS.height) {
			focusShown = true;
		}
		++i;
	}

	if (!focusShown && !forceFocused) {
		sidebar.debug('Sidebar focus NOT shown: ', SIDEBAR_FOCUS);
		drawSidebar(buf, true);
	}

	// buf.blackOutRect(SIDE_BOUNDS.x, SIDE_BOUNDS.toOuterY(y), SIDE_BOUNDS.width, SIDE_BOUNDS.height - y);

	SIDEBAR_CHANGED = false;
	return true;
}


function UiDrawSidebar(buf) {

	sidebar.refresh(DATA.map);
	// if (GW.ui.display.hasCanvasLoc(GW.io.mouse.x, GW.io.mouse.y)) {
	// 	const x = GW.ui.display.toLocalX(GW.io.mouse.x);
	// 	const y = GW.ui.display.toLocalY(GW.io.mouse.y);
	// 	GW.ui.focusSidebar(x, y);
	// }
	// else if (SIDE_BOUNDS.hasCanvasLoc(GW.io.mouse.x, GW.io.mouse.y)) {
	// 	GW.ui.highlightSidebarRow(GW.io.mouse.y);
	// }
	return drawSidebar(buf);
}

sidebar.draw = UiDrawSidebar;


function sidebarAddText(buf, y, text, fg, bg, opts={}) {

  if (y >= SIDE_BOUNDS.height - 1) {
		return SIDE_BOUNDS.height - 1;
	}

  fg = fg ? Color.from(fg) : GW.colors.white;
  bg = bg ? Color.from(bg) : GW.colors.black;

  if (opts.dim) {
    fg = fg.clone();
    bg = bg.clone();
    fg.mix(GW.colors.black, 50);
    bg.mix(GW.colors.black, 50);
  }
  else if (opts.highlight) {
    /// ???
  }

  y = buf.wrapText(SIDE_BOUNDS.x, y, SIDE_BOUNDS.width, text, fg, bg, opts);

  return y;
}

sidebar.addText = sidebarAddText;

// Sidebar Actor

// Draws the smooth gradient that appears on a button when you hover over or depress it.
// Returns the percentage by which the current tile should be averaged toward a hilite color.
function smoothHiliteGradient(currentXValue, maxXValue) {
    return Math.floor(100 * Math.sin(Math.PI * currentXValue / (maxXValue)));
}


// returns the y-coordinate after the last line printed
function sidebarAddActor(entry, y, dim, highlight, buf)
{
	if (y >= SIDE_BOUNDS.height - 1) {
		return SIDE_BOUNDS.height - 1;
	}

	const initialY = y;
  const actor = entry.entity;

  if (actor.kind.sidebar) {
    y = actor.kind.sidebar(entry, y, dim, highlight, buf);
  }
  else {
    // name and mutation, if any
  	y = sidebar.addName(entry, y, dim, highlight, buf);
  	y = sidebar.addMutationInfo(entry, y, dim, highlight, buf);

  	// Progress Bars
  	y = sidebar.addHealthBar(entry, y, dim, highlight, buf);
  	y = sidebar.addManaBar(entry, y, dim, highlight, buf);
  	y = sidebar.addFoodBar(entry, y, dim, highlight, buf);
  	y = sidebar.addStatuses(entry, y, dim, highlight, buf);
  	y = sidebar.addStateInfo(entry, y, dim, highlight, buf);
  	y = sidebar.addPlayerInfo(entry, y, dim, highlight, buf);
  }

  const x = SIDE_BOUNDS.x;
	if (y < SIDE_BOUNDS.height - 1) {
		buf.plotText(x, y++, "                    ");
	}

	if (highlight) {
		for (let i=0; i<SIDE_BOUNDS.width; i++) {
			const highlightStrength = smoothHiliteGradient(i, SIDE_BOUNDS.width-1) / 10;
			for (let j=initialY; j < (y == SIDE_BOUNDS.height - 1 ? y : Math.min(y - 1, SIDE_BOUNDS.height - 1)); j++) {
				buf.highlight(x + i, j, GW.colors.white, highlightStrength);
			}
		}
	}

	return y;
}

sidebar.addActor = sidebarAddActor;



function sidebarAddName(entry, y, dim, highlight, buf) {
  const monst = entry.entity;
  const map = entry.map;
  const fg = (dim ? GW.colors.gray : GW.colors.white);
  const bg = GW.colors.black;

	if (y >= SIDE_BOUNDS.height - 1) {
    return SIDE_BOUNDS.height - 1;
  }

  const x = SIDE_BOUNDS.x;
  const monstForeColor = dim ? fg : monst.kind.sprite.fg;

	// buf.plotText(0, y, "                    ", fg, bg); // Start with a blank line

	// Unhighlight if it's highlighted as part of the path.
	const cell = map.cell(monst.x, monst.y);
  const monstApp = buf[x][y];
	CELL.getAppearance(cell, monstApp);

	if (dim) {
		monstApp.fg.mix(bg, 50);
		monstApp.bg.mix(bg, 50);
	} else if (highlight) {
		// Does this do anything?
		monstApp.fg.add(bg, 100);
		monstApp.bg.add(bg, 100);
	}

	//patch to indicate monster is carrying item
	// if(monst.carriedItem) {
	// 	plotCharWithColor(monst.carriedItem.displayChar, 1, y, itemColor, black);
	// }
	//end patch

	const name = monst.getName({ color: monstForeColor, formal: true });
	let monstName = Text.capitalize(name);

  if (monst.isPlayer()) {
      if (monst.status.invisible) {
				monstName += ' (invisible)';
      } else if (cell.isDark()) {
				monstName += ' (dark)';
      } else if (!cell.flags & Flags.Cell.IS_IN_SHADOW) {
				monstName += ' (lit)';
      }
  }

  buf.plotText(x + 1, y, '%F: ', fg);
	y = buf.wrapText(x + 3, y, SIDE_BOUNDS.width - 3, monstName, fg, bg);

	return y;
}

sidebar.addName = sidebarAddName;


function addMutationInfo(entry, y, dim, highlight, buf) {
	return y;
}

sidebar.addMutationInfo = addMutationInfo;



// Progress Bars

function addProgressBar(y, buf, barText, current, max, color, dim) {
	if (y >= SIDE_BOUNDS.height - 1) {
		return SIDE_BOUNDS.height - 1;
	}

	if (current > max) {
		current = max;
	}

	if (max <= 0) {
		max = 1;
	}

	color = color.clone();
	if (!(y % 2)) {
		color.mix(GW.colors.black, 25);
	}

  let textColor = GW.colors.white;
  if (dim) {
		color.mix(GW.colors.black, 50);
    textColor = GW.colors.gray;
	}

  GW.ui.plotProgressBar(buf, SIDE_BOUNDS.x, y, SIDE_BOUNDS.width, barText, textColor, current/max, color);
  return y + 1;
}

sidebar.addProgressBar = addProgressBar;


function addHealthBar(entry, y, dim, highlight, buf) {

  if (y >= SIDE_BOUNDS.height - 1) {
    return SIDE_BOUNDS.height - 1;
  }

  const map = entry.map;
  const actor = entry.entity;

  if (actor.max.health > 0 && (actor.isPlayer() || (actor.current.health != actor.max.health)) && !actor.isInvulnerable())
  {
    let healthBarColor = GW.colors.blueBar;
		if (actor.isPlayer()) {
			healthBarColor = GW.colors.redBar.clone();
			healthBarColor.mix(GW.colors.blueBar, Math.min(100, 100 * actor.current.health / actor.max.health));
		}

    let text = 'Health';
		// const percent = actor.statChangePercent('health');
		if (actor.current.health <= 0) {
				text = "Dead";
		// } else if (percent != 0) {
		// 		text = Text.format("Health (%s%d%%)", percent > 0 ? "+" : "", percent);
		}
		y = sidebar.addProgressBar(y, buf, text, actor.current.health, actor.max.health, healthBarColor, dim);
	}
	return y;
}

sidebar.addHealthBar = addHealthBar;


function addManaBar(entry, y, dim, highlight, buf) {
  if (y >= SIDE_BOUNDS.height - 1) {
    return SIDE_BOUNDS.height - 1;
  }

  const map = entry.map;
  const actor = entry.entity;

  if (actor.max.mana > 0 && (actor.isPlayer() || (actor.current.mana != actor.max.mana)))
  {
    let barColor = GW.colors.purpleBar;
		if (actor.isPlayer()) {
			barColor = GW.colors.redBar.clone();
			barColor.mix(GW.colors.purpleBar, Math.min(100, 100 * actor.current.mana / actor.max.mana));
		}

    let text = 'Mana';
		// const percent = actor.statChangePercent('health');
		if (actor.current.mana <= 0) {
				text = "None";
		// } else if (percent != 0) {
		// 		text = Text.format("Health (%s%d%%)", percent > 0 ? "+" : "", percent);
		}
		y = sidebar.addProgressBar(y, buf, text, actor.current.mana, actor.max.mana, barColor, dim);
	}
	return y;
}

sidebar.addManaBar = addManaBar;


function addFoodBar(entry, y, dim, highlight, buf) {
  if (y >= SIDE_BOUNDS.height - 1) {
    return SIDE_BOUNDS.height - 1;
  }

  const map = entry.map;
  const actor = entry.entity;

  if (actor.max.food > 0 && (actor.isPlayer() || (actor.current.food != actor.max.food)))
  {
    let barColor = GW.colors.greenBar;
		if (actor.isPlayer()) {
			barColor = GW.colors.purpleBar.clone();
			barColor.mix(GW.colors.greenBar, Math.min(100, 100 * actor.current.food / actor.max.food));
		}

    let text = 'Food';
		// const percent = actor.statChangePercent('health');
		if (actor.current.food <= 0) {
				text = "None";
		// } else if (percent != 0) {
		// 		text = Text.format("Health (%s%d%%)", percent > 0 ? "+" : "", percent);
		}
		y = sidebar.addProgressBar(y, buf, text, actor.current.food, actor.max.food, barColor, dim);
	}
	return y;
}

sidebar.addFoodBar = addFoodBar;


function addStatuses(entry, y, dim, highlight, buf) {
	return y;
}

sidebar.addStatuses = addStatuses;


function addStateInfo(entry, y, dim, highlight, buf) {
	return y;
}

sidebar.addStateInfo = addStateInfo;


function addPlayerInfo(entry, y, dim, highlight, buf) {
	return y;
}

sidebar.addPlayerInfo = addPlayerInfo;



// Returns the y-coordinate after the last line printed.
function sidebarAddMapCell(entry, y, dim, highlight, buf) {
	let displayChar;
	let foreColor, backColor;    // color
	let i, j, lineCount;
  const fg = (dim ? GW.colors.gray : GW.colors.white);
  const bg = GW.colors.black;

  const cell = entry.entity;
  const textColor = GW.colors.flavorText.clone();
  if (dim) {
      textColor.applyScalar(50);
  }

	if (y >= SIDE_BOUNDS.height - 1) {
		return SIDE_BOUNDS.height - 1;
	}

  const x = SIDE_BOUNDS.x;
	const initialY = y;

  const app = buf[x][y];
	CELL.getAppearance(cell, app);
	if (dim) {
		app.fg.mix(bg, 50);
		app.bg.mix(bg, 50);
	}

	buf.plotChar(x + 1, y, ":", fg, bg);
	let name = cell.getName();
	name = Text.capitalize(name);
  y = buf.wrapText(x + 3, y, SIDE_BOUNDS.width - 3, name, textColor, bg);

	if (highlight) {
		for (i=0; i<SIDE_BOUNDS.width; i++) {
			const highlightStrength = smoothHiliteGradient(i, SIDE_BOUNDS.width-1) / 10;
			for (j=initialY; j < y && j < SIDE_BOUNDS.height - 1; j++) {
				buf.highlight(x + i, j, GW.colors.white, highlightStrength);
			}
		}
	}
	y += 1;

	return y;
}

sidebar.addMapCell = sidebarAddMapCell;



// Returns the y-coordinate after the last line printed.
function sidebarAddItemInfo(entry, y, dim, highlight, buf) {
	let name;
	let itemChar;
	let itemForeColor, itemBackColor;  // color
	let i, j, lineCount;
  const fg = (dim ? GW.colors.gray : GW.colors.white);
  const bg = GW.colors.black;

	if (y >= SIDE_BOUNDS.height - 1) {
		return SIDE_BOUNDS.height - 1;
	}

  const theItem = entry.entity;
  const map = entry.map;
  const cell = map.cell(entry.x, entry.y);
	const initialY = y;
  const x = SIDE_BOUNDS.x;

  const app = buf[x][y];
	CELL.getAppearance(cell, app);
	if (dim) {
		app.fg.mix(GW.colors.black, 50);
		app.bg.mix(GW.colors.black, 50);
	}

	buf.plotChar(x + 1, y, ":", fg, GW.colors.black);
	if (GW.config.playbackOmniscience || !DATA.player.status.hallucinating) {
		name = theItem.getName({ color: !dim, details: true });
	} else {
    name = GW.item.describeHallucinatedItem();
	}
	name = Text.capitalize(name);

  y = buf.wrapText(x + 3, y, SIDE_BOUNDS.width - 3, name, fg, GW.colors.black);

	if (highlight) {
		for (i=0; i<SIDE_BOUNDS.width; i++) {
			const highlightStrength = smoothHiliteGradient(i, SIDE_BOUNDS.width-1) / 10;
			for (j=initialY; j < y && j < SIDE_BOUNDS.height - 1; j++) {
				buf.highlight(x + i, j, GW.colors.white, highlightStrength);
			}
		}
	}
	y += 1;

	return y;
}

sidebar.addItem = sidebarAddItemInfo;
