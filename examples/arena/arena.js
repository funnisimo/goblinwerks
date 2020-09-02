
let canvas = null;
let SITE = null;
const startingXY = [40, 28];

GW.random.seed(12345);

const TILES = [
	GW.make.sprite('#', [50,50,50], [20,20,20]),	// WALL
	GW.make.sprite('\u00b7', [30,30,30], [90,90,90]),	// FLOOR
	GW.make.sprite('+', [100,40,40], [30,60,60]),	// DOOR
	GW.make.sprite('=', [100,40,40], [60,40,0]),	// BRIDGE
	GW.make.sprite('<', [100,40,40], [100,60,20]),	// UP
	GW.make.sprite('>', [100,40,40], [100,60,20]),	// DOWN
	GW.make.sprite('~', [0,80,100], [0,30,100]),	// LAKE
	GW.make.sprite('\u00b7', [0,80,100], [30,50,100]),	// LAKE_FLOOR
	GW.make.sprite('+', [0,80,100], [30,50,100]),	// LAKE_DOOR
];

GW.dig.installDigger('HUGE_ROOM',     GW.dig.rectangularRoom,  { width: [50,76], height: [15,28] });

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
	SITE = GW.dig.startDig(80, 30);

	let doors = [ startingXY ];
	let roomCount = 0;

	SITE.grid.fillRect(2, 2, 76, 26, 1);
	// GW.dig.digRoom({ digger: 'HUGE_ROOM', doors, tries: 5, tile: 1, placeDoor: false });

	let lakeCount = GW.random.number(5);
	for(let i = 0; i < lakeCount; ++i) {
		GW.dig.digLake();
	}

	GW.dig.addBridges(40, 8);

	SITE.grid.forEach( (v, i, j) => {
		const tile = TILES[v];
		if (tile) {
			canvas.plot(i, j, tile);
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
