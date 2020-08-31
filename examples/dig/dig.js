
let canvas = null;

const TILES = [
	GW.make.sprite('#', [50,50,50], [20,20,20]),
	GW.make.sprite('.', [30,30,30], [90,90,90]),
	GW.make.sprite('+', [100,40,40], [30,60,60]),
];

GW.dig.installDigger('ROOM',     GW.dig.rectangularRoom,  { width: [10,20], height: [5,10] });


function drawMap() {
	// dig a map
	const SITE = GW.dig.startDig(100, 34);

	let doors = [ [50, 32] ];
	let roomCount = 10;

	for(let i = 0; i < roomCount; ++i) {
		doors = GW.dig.digRoom({ digger: 'ROOM', doors, tries: 20, tile: 1 });
		if (!doors) {
			console.warn('Failed to dig map on room #' + (i + 1));
			break;
		}
	}

	SITE.grid.forEach( (v, i, j) => {
		canvas.plot(i, j, TILES[v]);
	});

	canvas.draw();
}


// start the environment
function start() {
	canvas = new GW.types.Canvas(100, 34, 'game', { tileSize: 11 });
	game.onmousedown = drawMap;
	document.onkeydown = drawMap;

	drawMap();
}

window.onload = start;
