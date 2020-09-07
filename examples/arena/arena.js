
let MAP;
const CellFlags = GW.flags.cell;

GW.random.seed(12345);
GW.digger.install('HUGE_ROOM',     GW.digger.rectangularRoom,  { width: [50,76], height: [15,28] });

const PLAYER = GW.make.player({
		sprite: GW.make.sprite('@', 'white'),
		name: 'you'
});

let command = 'showHit';

async function selectBeam() {
	await GW.ui.messageBox('Selected BEAM.', 'red', 5000);
}

GW.commands.selectBeam = selectBeam;

function showHit(e) {
	console.log('click', e.x, e.y);
	return GW.fx.flashSprite(MAP, e.x, e.y, 'hit', 2000, 3);
}

GW.commands.showHit = showHit;


function moveDir(e) {
	const dir = e.dir || [0,0];
	GW.player.moveDir(dir);
}

GW.commands.moveDir = moveDir;

let mapCount = 0;

function makeMap() {
	// dig a map
	MAP = GW.make.map(80, 30);
	MAP.clear();
	GW.dungeon.start(MAP);

	MAP.cells.forRect(2, 2, 76, 26, (c) => c.setTile(1));
	// TODO - GW.dungeon.digRoom({ digger: 'HUGE_ROOM', xy: [2,2], placeDoor: false });
	// dig should slide the room around until any door site (not just random ones) fits at given xy

	let lakeCount = GW.random.number(5);
	for(let i = 0; i < lakeCount; ++i) {
		GW.dungeon.digLake();
	}

	GW.dungeon.addBridges(40, 8);
	GW.dungeon.finish();

	MAP.id = mapCount++;
	MAP.locations.start = [PLAYER.x, PLAYER.y];
	return MAP;
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
	GW.io.addKeymap({ dir: 'moveDir', space: 'newMap', click: 'showHit', m: 'selectBeam' });

	PLAYER.x = 40;
	PLAYER.y = 27;

	makeMap();
	GW.game.start({ player: PLAYER, map: MAP, width: 80, height: 30 });
}

window.onload = start;
