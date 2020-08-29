
GW.install.tile('INERT_PORTAL', GW.const.GROUND, GW.tiles.DUNGEON_PORTAL.ch,	'wallCrystalColor', 'exitBackColor',	30,	0,	'DF_PLAIN_FIRE',	0,	null, 0, null,
	(T_OBSTRUCTS_ITEMS | T_OBSTRUCTS_SURFACE_EFFECTS | T_SACRED), (TM_STAND_IN_TILE | TM_VISUALLY_DISTINCT | TM_INTERRUPT_EXPLORATION_WHEN_SEEN | TM_INVERT_WHEN_HIGHLIGHTED),
	"an inert portal",		"this crystal portal sits quiet.");



// GW.CONFIG.MAX_FOV_RADIUS = 10;
GW.CONFIG.PERMANENT_CELL_FLAGS = GW.const.VISIBLE;

GW.install.tiles({
	SIGN: {
		N: 'a sign',
		S: '!,green',
		M: 'A sign reads: "Seek glory now for time grows short."',
		F: 'TM_LIST_IN_SIDEBAR',
		I: 'SURFACE,10',
		// L: 'TORCH_LIGHT',
	}
});

const WEAPON_CHAR = '\u2191';
const itemColor = 	GW.install.color('itemColor', 						100,	95,		-30,	0,		0,			0,			0,		false);

GW.install.items({
	FOOD: { name: 'food', ch: ';', fg: itemColor, description: "A package of some dried meats and fruits.  It will hit the spot when your hunger calls." },
	KNIFE: { name: 'knife', ch: WEAPON_CHAR, fg: itemColor, description: "A long sharp knife.  It will be useful for cutting ropes and tarps.", damage: '1d2', slot: 'weapon' },
});


var DUDE = GW.make.player({
	ch: '@',
	fg: [100,100,100],
	moveSpeed: 50,
	equip: ['KNIFE'],
	pack: [],
});

DUDE.x = 38;
DUDE.y = 28;

GW.install.actors({
	SMALL_GOBLIN: {
    N: 'small goblin',          // Name: name
    S: 'g,green',     	 				// Sprite: char,fg[,bloodColor]
    I: '5, 60, 0, 125, 20',     // Info: hp, att, def, move speed, regen turns (100 = NORMAL, >100 = SLOW, <100 = FAST)
    A: 'BASH,1d3,125,clubs|bashes',   // Attacks: 'damageType,damageAmount,speed,words,...' or ['t,a,s,w', ...]
    // G: 'humanoid, goblin',      // Groups: 'group,...'
    D: 'A small green humanoid, wielding a club and looking quite angry.',  // Description
  },
});



GW.install.digger('CROSS',          GW.dig.crossRoom,        { width: [3,12], height: [3,7], width2: [4,20], height2: [2,5] });
GW.install.digger('SYMMETRICAL_CROSS', GW.dig.symmetricalCrossRoom, { width: [4,8], height: [4,5], width2: [3,4], height2: [3,3] });
GW.install.digger('SMALL_ROOM',     GW.dig.rectangularRoom,  { width: [3,6], height: [2,4] });
GW.install.digger('LARGE_ROOM',     GW.dig.rectangularRoom,  { width: [25,40], height: [10,20] });
GW.install.digger('HUGE_ROOM',      GW.dig.rectangularRoom,  { width: [50,76], height: [15,28] });
GW.install.digger('SMALL_CIRCLE',   GW.dig.circularRoom,     { radius: [2,4] });
GW.install.digger('LARGE_CIRCLE',   GW.dig.circularRoom,     { radius: [4,10] });
GW.install.digger('BROGUE_CIRCLE',  GW.dig.brogueCircularRoom, { radius: [2,4], radius2: [4,10], altChance: 5, ringMinWidth: 3, holeMinSize: 3, holeChance: 50 });
GW.install.digger('COMPACT_CAVE', 	GW.dig.cavern,           { width: [ 3,12], height: [ 4, 8] });
GW.install.digger('LARGE_NS_CAVE', 	GW.dig.cavern,           { width: [ 3,12], height: [15,27] });
GW.install.digger('LARGE_EW_CAVE', 	GW.dig.cavern,           { width: [20,27], height: [ 4, 8] });
GW.install.digger('BROGUE_CAVE',    GW.dig.choiceRoom,       { choices: ['COMPACT_CAVE', 'LARGE_NS_CAVE', 'LARGE_EW_CAVE'] });
GW.install.digger('HUGE_CAVE', 			GW.dig.cavern,           { width: [50,77], height: [20,27] });
GW.install.digger('ENTRANCE',       GW.dig.entranceRoom,     { width: [8,20], height: [10, 5] });
GW.install.digger('CHUNKY', 				GW.dig.chunkyRoom, 			 { count: [2,8] })



const levels = [
	{
		name: 'Test',
		message: 'Welcome to the arena, scumbag!  You must survive as long as you can for our enjoyment.  Many who have started where you are have gone on to become rich, famous, and free!',
		build: [
			{ dig: 'LARGE_ROOM' },
			{ tile: 'INERT_PORTAL', flags: 'ORIGIN, BUILD_IN_WALL' },
			{ monster: 'SMALL_GOBLIN', flags: 'FAR_FROM_ORIGIN', trigger: { dead: 'DONE' } },
			{ id: 'DONE', tile: 'DOWN_STAIRS', flags: 'TRIGGERED', flash: true, delay: 1000, message: 'Well done!  Many do not survive even this simple test.  More awaits beyond this portal.' }
		],
	},
];



const MAPS = [];

function digMap(id, x, y, roomCount) {
	x = x || 38;
	y = y || 28;
	roomCount = roomCount || 5;

	let doors = [ [x, y] ];

	const SITE = GW.dig.startDig();

	GW.dig.rectangularRoom({ width: [SITE.width - 4, SITE.width - 4], height: [SITE.height - 4, SITE.height - 4] }, SITE.grid);

	// for(let i = 0; i < roomCount; ++i) {
	// 	doors = GW.dig.digRoom({ digger: 'LARGE', doors, tries: 20, tile: 1 });
	// 	if (!doors) {
	// 		console.log('Failed to dig map on room #' + (i + 1));
	// 		return null;
	// 	}
	// }
	//
	// const exitDoor = GW.dig.randomDoor(doors, GW.dig.validStairLoc);
	// if (!exitDoor) return null;
	// SITE.grid[exitDoor[0]][exitDoor[1]] = 2;

	const map = GW.dig.finishDig();
	// const start = map.locations.start = map.locations.upStairs = [x,y];
	map.locations.start = [x, y];
	// const exit = map.locations.finish = map.locations.downStairs = exitDoor;

	// map.setTile(exit[0], exit[1], 'DOWN_STAIRS');
	// if (id > 1) {
	// 	map.setTile(start[0], start[1], 'UP_STAIRS');
	// }

	const lakeMap = GW.grid.alloc(map.width, map.height);
	const count = GW.build.designLakes(map, lakeMap);
	if (count) {
		GW.build.fillLakes(map, lakeMap, { deep: 'DEEP_WATER', shallow: 'SHALLOW_WATER', shallowWidth: 1 });
	}

	GW.build.cleanUpLakeBoundaries(map);
	GW.build.cleanupStairs(map);

	return map;
}

// GW.extend(GW.actions, 'changeMap', changeMap);


function generateMap(next, id) {

	let map;

	console.log('generateMap', id);

	let roomCount = 5;
	while (!map && roomCount--) {
		let tries = 10;
		while (!map && tries--) {
			console.log('generate map', roomCount, tries);
			map = digMap(id, DUDE.x, DUDE.y, roomCount);
		}
	}

	if (!map.cells) {
		console.log('ERROR!');
	}

	for(let i = 0; i < 25; ++i) {
		const x = GW.random.number(map.width) - 1;
		const y = GW.random.number(map.height) - 1;
		if (map.hasTileFlag(x, y, T_PATHING_BLOCKER | T_HAS_STAIRS)) continue;
		if (map.cell(x, y).layers[GW.const.LIQUID]) continue;

		if (GW.random.percent(50)) {
			const item = GW.make.item('FOOD');
			map.addItemNear(x, y, item);
		}
		else {
			map.setTile(x, y, 'SIGN');
		}
	}

	for(let i = 0; i < 20; ++i) {
		const x = GW.random.number(map.width) - 1;
		const y = GW.random.number(map.height) - 1;
		if (map.hasTileFlag(x, y, T_PATHING_BLOCKER | T_HAS_STAIRS)) continue;
		if (map.cell(x, y).layers[GW.const.LIQUID]) continue;

		const g = GW.make.actor('SMALL_GOBLIN');
		map.addActorNear(x, y, g);
	}

	map.id = id;
	return map;
}

GW.extend(GW.actions, 'generateMap', generateMap);


async function showMessage() {
	await GW.ui.showDialog({
		x: GW.io.mouse.x,
		y: GW.io.mouse.y,
		mousemove(e) {
			this.x = e.x;
			this.y = e.y;
			GW.ui.drawDialog(this);
		},
		keypress(e) {
			if (e.key === 'Enter' || e.key === 'Escape') {
				GW.ui.finishDialog();
			}
		},
		draw(buf) {
			GW.canvas.clear(buf);
			GW.canvas.plotString(this.x, this.y, 'Testing', GW.colors.yellow, null, buf);
		}
	});
}

GW.actions.showMessage = showMessage;





var PATH;

function showPathFromPlayerTo(x, y) {
	GW.map.clearPath(PATH);
	PATH = GW.actor.pathTo(GW.PLAYER, x, y);
	GW.map.showPath(PATH);
	return PATH;
}



function start() {

	GW.setup();
	const map = GW.actions.generateMap(1);
	GW.map.activate(map);
	GW.player.activate(DUDE);
	GW.player.enterLevel();

	// const rbuf = GW.canvas.allocBuffer();
	// const dbuf = GW.canvas.allocBuffer();
	//
	// GW.io.pushHandler({
	// 	id: 'MAIN',
	// 	mousemove(e) {
	// 		if (GW.ui.display.hasCanvasLoc(e.x, e.y)) {
	// 			const x = GW.ui.display.toLocalX(e.x);
	// 			const y = GW.ui.display.toLocalY(e.y);
	// 			GW.map.setCursor(x, y);
	// 		}
	// 		else if (GW.ui.sidebar.hasCanvasLoc(e.x, e.y)) {
	// 			GW.ui.highlightSidebarRow(e.y);
	// 		}
	// 		else {
	// 			if (!GW.player.isMoving()) {
	// 				GW.map.setCursor(-1, -1);
	// 			}
	// 			GW.ui.flavorMessage('');
	// 		}
	//
	// 	},
	// 	click(e) {
	// 		if (GW.ui.display.hasCanvasLoc(e.x, e.y)) {
	// 			if (GW.player.isMoving()) {
	// 				GW.player.stopMoving();
	// 				showPathFromPlayerTo(GW.map.cursor.x, GW.map.cursor.y);
	// 			}
	// 			else {
	// 				GW.PLAYER.path = PATH;
	// 			}
	// 		}
	// 		else if (GW.ui.messages.hasCanvasLoc(e.x, e.y)) {
	// 			GW.ui.showMessageArchive();
	// 		}
	// 		else if (GW.ui.sidebar.hasCanvasLoc(e.x, e.y)) {
	// 			if (GW.player.isMoving()) {
	// 				GW.player.stopMoving();
	// 			}
	// 			else {
	// 				GW.PLAYER.path = PATH;
	// 			}
	// 		}
	// 	},
	// 	keypress(e) {
	// 		const dir = GW.io.keyDirection(e.key);
	// 		if (dir) {
	// 			GW.PLAYER.path = null;
	//
	// 			if (!e.shiftKey) {
	// 				GW.map.clearCursor();
	// 				GW.PLAYER.path = [ [GW.PLAYER.x + dir[0],GW.PLAYER.y + dir[1]] ];
	// 			}
	// 			else {
	// 				if (GW.map.cursor.x < 0) {
	// 					GW.map.setCursor(GW.PLAYER.x + dir[0], GW.PLAYER.y + dir[1]);
	// 				}
	// 				else {
	// 					GW.map.moveCursor(dir[0], dir[1]);
	// 				}
	// 				showPathFromPlayerTo(GW.map.cursor.x, GW.map.cursor.y);
	// 			}
	// 		}
	// 		else if (e.key === 'Enter') {
	// 			GW.PLAYER.path = PATH;
	// 		}
	// 		else if (e.key === 'Escape') {
	// 			GW.player.stopMoving();
	// 			GW.map.setCursor(-1, -1);
	// 		}
	// 		else if (e.key === '[') {
	// 			GW.sidebar.prevTarget();
	// 		}
	// 		else if (e.key === ']') {
	// 			GW.sidebar.nextTarget();
	// 		}
	// 		else if (e.key === ' ') {
	// 			if (GW.player.isMoving()) {
	// 				GW.player.stopMoving();
	// 				showPathFromPlayerTo(GW.map.cursor.x, GW.map.cursor.y);
	// 			}
	// 			else {
	// 				GW.PLAYER.path = PATH;
	// 				GW.ui.confirmMessages();
	// 			}
	// 		}
	// 		else if (e.key === 'd') {
	// 			return GW.player.drop();
	// 		}
	// 		else if (e.key === 'g') {
	// 			return GW.player.pickup();
	// 		}
	// 		else if (e.key === '^g') {
	// 			GW.player.toggleAutoPickup();
	// 		}
	// 		else if (e.key === 'i') {
	// 			return GW.ui.showInventory().then( (r) => {
	// 				if (r) GW.ui.message('You chose: %s (%s)', GW.item.name(r), r.inventoryLetter);
	// 			});
	// 		}
	// 		else if (e.key === 'm') {
	// 			return showMessage();
	// 		}
	// 		else if (e.key === '^m') {
	// 			return GW.ui.showMessageArchive();
	// 		}
	// 	},
	// 	update(dt) {
	// 		GW.io.processAllEvents();
	// 		GW.gameTurn(dt);
	// 	},
	// 	// draw() {}
	// });

	GW.start();

}



//
// async function actorUpdate(actor, dt) {
// 	if (!actor) return true;
// 	const action = actor.action || GW.CONFIG.DEFAULT_ACTOR_ACTION || 'idle';
// 	return await GW.actions[action](actor, dt);
// }
//
// async function playerUpdate(dt) {
// 	if (!GW.PLAYER) return true;	// no player
// 	const action = GW.PLAYER.action || GW.CONFIG.DEFAULT_PLAYER_ACTION || 'idle';
// 	return await GW.actions[action](GW.PLAYER, dt);
// }
//
// let inGameTurn = false;
// async function gameTurn(dt) {
// 	if (inGameTurn) return;
// 	inGameTurn = true;
// 	if (await GW.player.update(dt)) {	// true means acted
// 		for(let actor of GW.ACTORS) {
// 			await GW.actor.update(actor, dt);
// 		}
// 		await GW.map.update(dt);
// 	}
// 	inGameTurn = false;
// }
//
// GW.gameTurn = gameTurn;


window.onload = start;
