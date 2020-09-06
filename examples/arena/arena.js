
let canvas;
const MAP = GW.make.map(80, 30);
const CellFlags = GW.flags.cell;

GW.random.seed(12345);
GW.digger.install('HUGE_ROOM',     GW.digger.rectangularRoom,  { width: [50,76], height: [15,28] });

function handleClick(e) {
	const x = canvas.toX(e.clientX);
	const y = canvas.toY(e.clientY);
	console.log('click', x, y);
	makeMap();
}

function handleKey(e) {
	if (e.key == 'Shift') return;
	console.log('key', e.key, e.code);

	if (e.code == 'Space') {
		makeMap();
	}
	const dir = GW.io.keyCodeDirection(e.code);
	if (dir) {
		moveDir(dir);
	}
}


const PLAYER = {
	x: 40,
	y: 27,
	kind: {
		sprite: GW.make.sprite('@', 'white'),
		name: 'you'
	}
}


function moveDir(dir) {
	MAP.clearCellFlags(PLAYER.x, PLAYER.y, CellFlags.HAS_PLAYER);
	PLAYER.x += dir[0];
	PLAYER.y += dir[1];
	MAP.setCellFlags(PLAYER.x, PLAYER.y, CellFlags.HAS_PLAYER);
	drawMap();
}


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


function drawMap() {
	MAP.cells.forEach( (c, i, j) => {
		if (c.flags & CellFlags.NEEDS_REDRAW) {
			const tile = c.highestPriorityTile();
			if (tile) {
				canvas.plot(i, j, tile.sprite);
			}
			else {
				console.warn('missing tile ', v, i, j);
			}
			c.clearFlags(CellFlags.NEEDS_REDRAW);
		}
		if (i == PLAYER.x && j == PLAYER.y) {
			const sprite = PLAYER.kind.sprite;
			canvas.plotChar(i, j, sprite.ch, sprite.fg);
		}
	});

	canvas.draw();
}


// start the environment
function start() {
	canvas = new GW.types.Canvas(80, 30, 'game');
	game.onmousedown = handleClick;
	document.onkeydown = handleKey;
	makeMap();
}

window.onload = start;
