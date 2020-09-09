
let MAP;
const CellFlags = GW.flags.cell;

GW.random.seed(12345);
GW.digger.install('HUGE_ROOM',     GW.digger.rectangularRoom,  { width: [50,76], height: [15,28] });

const PLAYER = GW.make.player({
		sprite: GW.make.sprite('@', 'white'),
		name: 'you'
});

let command = 'showHit';

function selectWall() {
	command = 'toggleWall';
	return GW.ui.messageBox('Selected WALL.', 'red', 500);
}

GW.commands.selectWall = selectWall;

function selectBeam() {
	command = 'showBeam';
	return GW.ui.messageBox('Selected BEAM.', 'red', 500);
}

GW.commands.selectBeam = selectBeam;

function selectFlash() {
	command = 'showFlash';
	return GW.ui.messageBox('Selected FLASH.', 'red', 500);
}

GW.commands.selectFlash = selectFlash;

function selectBolt() {
	command = 'showBolt';
	return GW.ui.messageBox('Selected BOLT.', 'red', 500);
}

GW.commands.selectBolt = selectBolt;

async function selectHit() {
	command = 'showHit';
	await GW.ui.messageBox('Selected HIT.', 'red', 500);
}

GW.commands.selectHit = selectHit;

async function selectExplosion() {
	command = 'showExplosion';
	await GW.ui.messageBox('Selected EXPLOSION.', 'red', 500);
}

GW.commands.selectExplosion = selectExplosion;

async function selectExplosionStar() {
	command = 'showExplosionStar';
	await GW.ui.messageBox('Selected STAR.', 'red', 500);
}

GW.commands.selectExplosionStar = selectExplosionStar;

async function selectExplosionPlus() {
	command = 'showExplosionPlus';
	await GW.ui.messageBox('Selected PLUS.', 'red', 500);
}

GW.commands.selectExplosionPlus = selectExplosionPlus;

async function selectExplosionX() {
	command = 'showExplosionX';
	await GW.ui.messageBox('Selected X.', 'red', 500);
}

GW.commands.selectExplosionX = selectExplosionX;

async function selectProjectile() {
	command = 'showProjectile';
	await GW.ui.messageBox('Selected PROJECTILE.', 'red', 500);
}

GW.commands.selectProjectile = selectProjectile;


function showFX(e) {
	console.log('click', e.x, e.y, command);
	return GW.commands[command](e);
}

GW.commands.showFX = showFX;

function showFlash(e) {
	return GW.fx.flashSprite(MAP, e.x, e.y, 'bump', 500, 3);
}

GW.commands.showFlash = showFlash;

function showHit(e) {
	return GW.fx.hit(MAP, e);
}

GW.commands.showHit = showHit;

async function showBeam(e) {
	await GW.fx.beam(MAP, GW.data.player, { x: e.x, y: e.y }, 'lightning', 5, 100);
}

GW.sprite.install('lightning', '\u16f6', [200,200,200]);

GW.commands.showBeam = showBeam;

async function showBolt(e) {
	await GW.fx.bolt(MAP, GW.data.player, { x: e.x, y: e.y }, 'magic', 10);
}

GW.sprite.install('magic', '*', 'purple');

GW.commands.showBolt = showBolt;

async function showProjectile(e) {
	await GW.fx.projectile(MAP, GW.data.player, { x: e.x, y: e.y }, '|-\\/', 'orange', 20);
}

GW.commands.showProjectile = showProjectile;

async function showExplosion(e) {
	await GW.fx.explosion(MAP, e.x, e.y, 7, 'fireball', 50, 200);
}

GW.sprite.install('fireball', '&', 'dark_red', 50);

GW.commands.showExplosion = showExplosion;


async function showExplosionPlus(e) {
	await GW.fx.explosion(MAP, e.x, e.y, 7, 'fireball', 50, 200, '+');
}

GW.commands.showExplosionPlus = showExplosionPlus;

async function showExplosionX(e) {
	await GW.fx.explosion(MAP, e.x, e.y, 7, 'fireball', 50, 200, 'x');
}

GW.commands.showExplosionX = showExplosionX;

async function showExplosionStar(e) {
	await GW.fx.explosion(MAP, e.x, e.y, 7, 'fireball', 50, 200, '*');
}

GW.commands.showExplosionStar = showExplosionStar;

async function toggleWall(e) {
	const cell = MAP.cell(e.x, e.y);
	if (cell.base === 6) {
		MAP.setTile(e.x, e.y, 1, true);
	}
	else {
		MAP.setTile(e.x, e.y, 6, true);
	}
}

GW.commands.toggleWall = toggleWall;


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
	// TODO - GW.dungeon.digRoom({ digger: 'HUGE_ROOM', center: true, placeDoor: false });

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

	const canvas = GW.ui.init({ width: 80, height: 30, div: 'game' });
	GW.io.addKeymap({ dir: 'moveDir', space: 'newMap', click: 'showFX',
			b: 'selectBolt', h: 'selectHit', f: 'selectFlash', p: 'selectProjectile',
		 	m: 'selectBeam', w: 'selectWall',
			o: 'selectExplosion', '+': 'selectExplosionPlus', '=': 'selectExplosionPlus',
		 	x: 'selectExplosionX', '8': 'selectExplosionStar', '*': 'selectExplosionStar',
			'?': 'showHelp'
	});

	PLAYER.x = 40;
	PLAYER.y = 27;

	makeMap();
	GW.game.start({ player: PLAYER, map: MAP });
}

window.onload = start;
