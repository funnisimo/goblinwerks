
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
	return GW.fx.flashSprite(MAP, e.x, e.y, 'hit', 2000, 3);
}

GW.commands.showHit = showHit;


function moveDir(e) {
	const dir = e.dir || [0,0];
	MAP.clearCellFlags(PLAYER.x, PLAYER.y, CellFlags.HAS_PLAYER);
	PLAYER.x += dir[0];
	PLAYER.y += dir[1];
	MAP.setCellFlags(PLAYER.x, PLAYER.y, CellFlags.HAS_PLAYER);
	// drawMap();
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

	return MAP;
	// drawMap();
}


function newMap() {
	const map = makeMap();
	GW.game.startMap(map);
}

GW.commands.newMap = newMap;



// start the environment
function start() {

	game.onmousedown = GW.io.onmousedown;
	document.onkeydown = GW.io.onkeydown;
	GW.io.addKeymap({ dir: 'moveDir', space: 'newMap', click: 'showHit' });

	makeMap();
	GW.game.start({ player: PLAYER, map: MAP, width: 80, height: 30 });
}

window.onload = start;
