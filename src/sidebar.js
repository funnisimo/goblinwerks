
import { color as COLOR, colors as COLORS } from './color.js';
import { Flags as ActorFlags, KindFlags as ActorKindFlags } from './actor.js';
import { KindFlags as ItemKindFlags } from './item.js';
import { Flags as CellFlags } from './cell.js';
import { Flags as MapFlags } from './map.js';
import { grid as GRID } from './grid.js';
import { text as TEXT } from './text.js';
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

sidebar.debug = GW.utils.NOOP;

const blueBar = COLOR.install('blueBar', 	15,		10,		50);
const redBar = 	COLOR.install('redBar', 	45,		10,		15);


function setup(opts={}) {
  SIDE_BOUNDS = sidebar.bounds = new GW.types.Bounds(opts.x, opts.y, opts.width, opts.height);
}

sidebar.setup = setup;


function sortSidebarItems(items) {
	let distFn;
	if (DATA.player && DATA.player.distanceMap) {
		distFn = ((item) => DATA.player.distanceMap[item.x][item.y]);
	}
	else {
		const x = DATA.player ? DATA.player.x : 0;
		const y = DATA.player ? DATA.player.y : 0;
		distFn = ((item) => GW.utils.distanceBetween(item.x, item.y, x, y));
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

	if (DATA.player) {
		doneCells[DATA.player.x][DATA.player.y] = 1;
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
		else if (cell.isRevealed(true) && actor.alwaysVisible())
		{
			entries.push({ map, x, y, dist: 0, priority: 3, draw: sidebar.addActor, entity: actor, changed });
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

    if (item.hasKindFlag(ItemKindFlags.IK_NO_SIDEBAR)) {
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
		else if (cell.isRevealed())
		{
			entries.push({ map, x: x, y: y, dist: 0, priority: 3, draw: sidebar.addItem, entity: item, changed });
		}
    item = item.next;
	}

	// Get tiles
	map.forEach( (cell, i, j) => {
		if (!(cell.isRevealed(true) || cell.isAnyKindOfVisible())) return;
		// if (cell.flags & (CellFlags.HAS_PLAYER | CellFlags.HAS_MONSTER | CellFlags.HAS_ITEM)) return;
		if (doneCells[i][j]) return;
		doneCells[i][j] = 1;

		const changed = cell.changed();
		if (cell.listInSidebar()) {
			const priority = (cell.isVisible() ? 1 : (cell.isAnyKindOfVisible() ? 2 : 3));
			entries.push({ map, x: i, y: j, dist: 0, priority, draw: sidebar.addMapCell, entity: cell, changed });
		}
	});

	GRID.free(doneCells);

	// sort entries
	sortSidebarItems(entries);

	// compare to current list
	const max = Math.floor(SIDE_BOUNDS.height / 2);
	let same = entries.every( (a, i) => {
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
	if (SIDEBAR_FOCUS[0] < 0 || GW.utils.equalsXY(DATA.player, SIDEBAR_FOCUS)) {
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

  buf.fillRect(SIDE_BOUNDS.x, SIDE_BOUNDS.y, SIDE_BOUNDS.width, SIDE_BOUNDS.height, ' ', COLORS.black, COLORS.black);

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
		if ((SIDEBAR_FOCUS[0] === entry.x && SIDEBAR_FOCUS[1] === entry.y))
		{
			if (focusShown) {
				++i;
				continue;
			}
			highlight = true;
		}
		entry.row = y;
		y = entry.draw(entry, y, dim && !highlight, highlight, buf);
		if (highlight && y <= SIDE_BOUNDS.height) {
			focusShown = true;
		}
		++i;
	}

	if (!focusShown && !forceFocused) {
		sidebar.debug('Sidebar focus NOT shown: ', SIDEBAR_FOCUS);
		drawSidebar(buf, true);
	}

	buf.blackOutRect(SIDE_BOUNDS.toOuterX(0), y, SIDE_BOUNDS.toOuterX(SIDE_BOUNDS.width - 1), SIDE_BOUNDS.height - y);

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


function sidebarAddText(buf, y, text, fg, bg, dim, highlight) {
  fg = fg || COLORS.white;
  bg = bg || COLORS.black;

  if (dim) {
    fg = fg.clone();
    bg = bg.clone();
    COLOR.applyAverage(fg, COLORS.black, 50);
    COLOR.applyAverage(bg, COLORS.black, 50);
  }
  else if (highlight) {
    /// ???
  }

  y = buf.wrapText(SIDE_BOUNDS.x, y, SIDE_BOUNDS.width, text, fg, bg);

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
  	y = sidebar.addNutritionBar(entry, y, dim, highlight, buf);
  	y = sidebar.addStatuses(entry, y, dim, highlight, buf);
  	y = sidebar.addStateInfo(entry, y, dim, highlight, buf);
  	y = sidebar.addPlayerInfo(entry, y, dim, highlight, buf);
  }

  const x = SIDE_BOUNDS.x;
	if (y < SIDE_BOUNDS.height - 1) {
		buf.plotText(x, y++, "                    ", (dim ? COLORS.dark_gray : COLORS.gray), COLORS.black);
	}

	if (highlight) {
		for (let i=0; i<SIDE_BOUNDS.width; i++) {
			const highlightStrength = smoothHiliteGradient(i, SIDE_BOUNDS.width-1) / 10;
			for (let j=initialY; j < (y == SIDE_BOUNDS.height - 1 ? y : Math.min(y - 1, SIDE_BOUNDS.height - 1)); j++) {
				buf.highlight(x + i, j, COLORS.white, highlightStrength);
			}
		}
	}

	return y;
}

sidebar.addActor = sidebarAddActor;



function sidebarAddName(entry, y, dim, highlight, buf) {
  const monst = entry.entity;
  const map = entry.map;
  const fg = (dim ? COLORS.gray : COLORS.white);
  const bg = COLORS.black;

	if (y >= SIDE_BOUNDS.height - 1) {
    return SIDE_BOUNDS.height - 1;
  }

  const x = SIDE_BOUNDS.x;
  const monstForeColor = monst.kind.sprite.fg;

	// buf.plotText(0, y, "                    ", fg, bg); // Start with a blank line

	// Unhighlight if it's highlighted as part of the path.
	const cell = map.cell(monst.x, monst.y);
  const monstApp = buf[x][y];
	CELL.getAppearance(cell, monstApp);

	if (dim) {
		COLOR.applyMix(monstApp.fg, bg, 50);
		COLOR.applyMix(monstApp.bg, bg, 50);
	} else if (highlight) {
		// Does this do anything?
		COLOR.applyAugment(monstApp.fg, bg, 100);
		COLOR.applyAugment(monstApp.bg, bg, 100);
	}

	//patch to indicate monster is carrying item
	// if(monst.carriedItem) {
	// 	plotCharWithColor(monst.carriedItem.displayChar, 1, y, itemColor, black);
	// }
	//end patch

	const name = monst.getName({ color: monstForeColor });
	let monstName = TEXT.capitalize(name);

  if (monst === DATA.player) {
      if (monst.status.invisible) {
				monstName += ' (invisible)';
      } else if (cell.isDark()) {
				monstName += ' (dark)';
      } else if (!cell.flags & CellFlags.IS_IN_SHADOW) {
				monstName += ' (lit)';
      }
  }

  buf.plotText(x + 1, y, ': ', fg, bg);
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
		COLOR.applyAverage(color, COLORS.black, 25);
	}

	if (dim) {
		COLOR.applyAverage(color, COLORS.black, 50);
	}

  const darkenedBarColor = color.clone();
	COLOR.applyAverage(darkenedBarColor, COLORS.black, 75);

  barText = TEXT.center(barText, SIDE_BOUNDS.width);

	current = GW.utils.clamp(current, 0, max);

	if (max < 10000000) {
		current *= 100;
		max *= 100;
	}

  const currentFillColor = GW.make.color();
  const textColor = GW.make.color();
	for (let i=0; i<SIDE_BOUNDS.width; i++) {
		currentFillColor.copy(i <= (SIDE_BOUNDS.width * current / max) ? color : darkenedBarColor);
		if (i == Math.floor(SIDE_BOUNDS.width * current / max)) {
			COLOR.applyAverage(currentFillColor, COLORS.black, 75 - Math.floor(75 * (current % (max / SIDE_BOUNDS.width)) / (max / SIDE_BOUNDS.width)));
		}
		textColor.copy(dim ? COLORS.gray : COLORS.white);
		COLOR.applyAverage(textColor, currentFillColor, (dim ? 50 : 33));
		buf.plotChar(SIDE_BOUNDS.x + i, y, barText[i], textColor, currentFillColor);
	}
  return y + 1;
}

sidebar.addProgressBar = addProgressBar;


function addHealthBar(entry, y, dim, highlight, buf) {

  if (y >= SIDE_BOUNDS.height - 1) {
    return SIDE_BOUNDS.height - 1;
  }

  const map = entry.map;
  const actor = entry.entity;

  if (actor.max.health > 1 && !(actor.kind.flags & ActorKindFlags.AK_INVULNERABLE))
  {
    let healthBarColor = COLORS.blueBar;
		if (actor === DATA.player) {
			healthBarColor = COLORS.redBar.clone();
			COLOR.applyAverage(healthBarColor, COLORS.blueBar, Math.min(100, 100 * actor.current.health / actor.max.health));
		}

    let text = 'Health';
		const percent = actor.statChangePercent('health');
		if (actor.current.health <= 0) {
				text = "Dead";
		} else if (percent != 0) {
				text = TEXT.format("Health (%s%d)", percent > 0 ? "+" : "", percent);
		}
		y = sidebar.addProgressBar(y, buf, text, actor.current.health, actor.max.health, healthBarColor, dim);
	}
	return y;
}

sidebar.addHealthBar = addHealthBar;


function addManaBar(entry, y, dim, highlight, buf) {
	return y;
}

sidebar.addManaBar = addManaBar;


function addNutritionBar(entry, y, dim, highlight, buf) {
	return y;
}

sidebar.addNutritionBar = addNutritionBar;


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
  const fg = (dim ? COLORS.gray : COLORS.white);
  const bg = COLORS.black;

  const cell = entry.entity;
  const textColor = COLORS.flavorText.clone();
  if (dim) {
      COLOR.applyScalar(textColor, 50);
  }

	if (y >= SIDE_BOUNDS.height - 1) {
		return SIDE_BOUNDS.height - 1;
	}

  const x = SIDE_BOUNDS.x;
	const initialY = y;

  const app = buf[x][y];
	CELL.getAppearance(cell, app);
	if (dim) {
		COLOR.applyAverage(app.fg, bg, 50);
		COLOR.applyAverage(app.bg, bg, 50);
	}

	buf.plotChar(x + 1, y, ":", fg, bg);
	let name = cell.getName();
	name = TEXT.capitalize(name);
  y = buf.wrapText(x + 3, y, SIDE_BOUNDS.width - 3, name, textColor, bg);

	if (highlight) {
		for (i=0; i<SIDE_BOUNDS.width; i++) {
			const highlightStrength = smoothHiliteGradient(i, SIDE_BOUNDS.width-1) / 10;
			for (j=initialY; j < y && j < SIDE_BOUNDS.height - 1; j++) {
				buf.highlight(x + i, j, COLORS.white, highlightStrength);
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
  const fg = (dim ? COLORS.gray : COLORS.white);
  const bg = COLORS.black;

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
		COLOR.applyAverage(app.fg, COLORS.black, 50);
		COLOR.applyAverage(app.bg, COLORS.black, 50);
	}

	buf.plotChar(x + 1, y, ":", fg, COLORS.black);
	if (GW.config.playbackOmniscience || !DATA.player.status.hallucinating) {
		name = theItem.getName();
	} else {
    name = GW.item.describeHallucinatedItem();
	}
	name = TEXT.capitalize(name);

  y = buf.wrapText(x + 3, y, SIDE_BOUNDS.width - 3, name, fg, COLORS.black);

	if (highlight) {
		for (i=0; i<SIDE_BOUNDS.width; i++) {
			const highlightStrength = smoothHiliteGradient(i, SIDE_BOUNDS.width-1) / 10;
			for (j=initialY; j < y && j < SIDE_BOUNDS.height - 1; j++) {
				buf.highlight(x + i, j, COLORS.white, highlightStrength);
			}
		}
	}
	y += 1;

	return y;
}

sidebar.addItem = sidebarAddItemInfo;
