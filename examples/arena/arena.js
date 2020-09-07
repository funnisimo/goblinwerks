
let canvas;
const MAP = GW.make.map(80, 30);
const CellFlags = GW.flags.cell;

GW.random.seed(12345);
GW.digger.install('HUGE_ROOM',     GW.digger.rectangularRoom,  { width: [50,76], height: [15,28] });

const PLAYER = {
	x: 40,
	y: 27,
	kind: {
		sprite: GW.make.sprite('@', 'white'),
		name: 'you'
	}
}

function showHit(e) {
	console.log('click', e.x, e.y);
	GW.fx.flashSprite(MAP, e.x, e.y, 'hit', 200);
}

GW.commands.showHit = showHit;


function moveDir(e) {
	const dir = e.dir || [0,0];
	MAP.clearCellFlags(PLAYER.x, PLAYER.y, CellFlags.HAS_PLAYER);
	PLAYER.x += dir[0];
	PLAYER.y += dir[1];
	MAP.setCellFlags(PLAYER.x, PLAYER.y, CellFlags.HAS_PLAYER);
	drawMap();
}

GW.commands.moveDir = moveDir;


function makeMap() {
	// dig a map
	MAP.clear();
	GW.dungeon.start(MAP);

	let doors = [ [PLAYER.x, PLAYER.y] ];
	let roomCount = 0;

	MAP.cells.forRect(2, 2, 76, 26, (c) => c.setTile(1));
	// TODO - GW.dungeon.digRoom({ digger: 'HUGE_ROOM', xy: [2,2], placeDoor: false });
	// dig should slide the room around until any door site (not just random ones) fits at given xy

	let lakeCount = GW.random.number(5);
	for(let i = 0; i < lakeCount; ++i) {
		GW.dungeon.digLake();
	}

	GW.dungeon.addBridges(40, 8);
	GW.dungeon.finish();

	drawMap();
}

GW.commands.makeMap = makeMap;


function drawMap() {
	MAP.cells.forEach( (c, i, j) => {
		if (c.flags & CellFlags.NEEDS_REDRAW) {
			GW.map.getCellAppearance(MAP, i, j, canvas.buffer[i][j]);
			c.clearFlags(CellFlags.NEEDS_REDRAW);
		}
		if (i == PLAYER.x && j == PLAYER.y) {
			const sprite = PLAYER.kind.sprite;
			canvas.plotChar(i, j, sprite.ch, sprite.fg);
		}
	});

}

function startLoop(t) {
	t = t || performance.now();

	requestAnimationFrame(startLoop);

	gameLoop(t);

	canvas.draw();
}


async function gameLoop(t) {
	const dt = GW.game.setTime(t);
	GW.fx.tick(dt)
	if (GW.fx.busy()) {
		drawMap();
		return;
	}

	let ev;
	while (ev = GW.io.nextEvent()) {
		await GW.io.dispatchEvent(ev);
		GW.io.recycleEvent(ev);
	}

	ev = GW.io.makeTickEvent(dt);
	GW.io.dispatchEvent(ev);
	GW.io.recycleEvent(ev);

	drawMap();

}

// start the environment
function start() {
	canvas = new GW.types.Canvas(80, 30, 'game');

	makeMap();
	game.onmousedown = GW.io.onmousedown;
	document.onkeydown = GW.io.onkeydown;
	GW.io.addKeymap({ dir: 'moveDir', space: 'makeMap', click: 'showHit' });

	startLoop();
}

window.onload = start;
