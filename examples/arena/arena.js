
let canvas = null;
let SITE = null;
const TILES = GW.tiles;
const startingXY = [40, 28];

GW.random.seed(12345);

GW.dungeon.installDigger('HUGE_ROOM',     GW.dungeon.rectangularRoom,  { width: [50,76], height: [15,28] });

function handleClick(e) {
	const x = canvas.toX(e.clientX);
	const y = canvas.toY(e.clientY);
	console.log('click', x, y);
	drawMap();
}

function handleKey(e) {
	if (e.key == 'Shift') return;
	console.log('key', e.key, e.code);
	drawMap();
}


function drawMap() {
	// dig a map
	SITE = GW.dungeon.startDig(80, 30);

	let doors = [ startingXY ];
	let roomCount = 0;

	SITE.grid.fillRect(2, 2, 76, 26, 1);
	// TODO - GW.dungeon.digRoom({ digger: 'HUGE_ROOM', xy: [2,2], placeDoor: false });
	// dig should slide the room around until any door site (not just random ones) fits at given xy

	let lakeCount = GW.random.number(5);
	for(let i = 0; i < lakeCount; ++i) {
		GW.dungeon.digLake();
	}

	GW.dungeon.addBridges(40, 8);
	GW.dungeon.finishDig();

	SITE.grid.forEach( (v, i, j) => {
		const tile = TILES[v];
		if (tile) {
			canvas.plot(i, j, tile.sprite);
		}
		else {
			console.warn('missing tile ', v, i, j);
		}
	});

	canvas.draw();
}


// start the environment
function start() {
	canvas = new GW.types.Canvas(80, 30, 'game');
	game.onmousedown = handleClick;
	document.onkeydown = handleKey;
	drawMap();
}

window.onload = start;
