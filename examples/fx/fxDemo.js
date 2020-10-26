
let MAP;
const CellFlags = GW.flags.cell;

GW.random.seed(12345);
GW.digger.install('HUGE_ROOM',     GW.digger.rectangularRoom,  { width: [50,76], height: [15,28] });

const PLAYER = GW.make.player({
		sprite: GW.make.sprite('@', 'white'),
		name: 'you',
		speed: 120
});

let command = 'showHit';
let isGameTime = 0;

function toggleGameTime() {
	isGameTime = (isGameTime + 1) % 2;
	let text;
	if (isGameTime) {
		text = 'Selected GAME TIME.';
	}
	else {
		text = 'Selected REAL TIME.';
	}
	return GW.ui.messageBox(text, 'red', 500);
}

GW.commands.toggleGameTime = toggleGameTime;

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

async function selectAura() {
	command = 'showAura';
	await GW.ui.messageBox('Selected AURA.', 'red', 500);
}

GW.commands.selectAura = selectAura;

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
	if (e.x != PLAYER.x || e.y != PLAYER.y) {
		const r = GW.commands[command](e);
		if (isGameTime) PLAYER.endTurn();
		return r;
	}
}

GW.commands.showFX = showFX;

function showFlash(e) {
	return GW.fx.flashSprite(MAP, e.x, e.y, 'bump', 500, 3);
}

GW.commands.showFlash = showFlash;

async function showHit(e) {
	await GW.fx.hit(MAP, e);
}

GW.commands.showHit = showHit;

async function showBeam(e) {
	GW.fx.beam(MAP, PLAYER, { x: e.x, y: e.y }, 'lightning', { gameTime: isGameTime }).then( async (anim) => {
		console.log('beam end: ', anim.x, anim.y);
		await GW.fx.hit(MAP, anim);
		console.log('- beam hit done');
	});
}

GW.sprite.install('lightning', '\u16f6', [200,200,200]);

GW.commands.showBeam = showBeam;

function showBolt(e) {
	GW.fx.bolt(MAP, PLAYER, { x: e.x, y: e.y }, 'magic', { gameTime: isGameTime }).then( async (result) => {
		console.log('bolt hit:', result.x, result.y);
		await GW.fx.flashSprite(MAP, result.x, result.y, 'hit', 500, 3);
		console.log('- hit done.');
	});
}

GW.sprite.install('magic', '*', 'purple');

GW.commands.showBolt = showBolt;

const PROJECTILE = GW.make.sprite('|-\\/', 'orange');

async function showProjectile(e) {

	GW.fx.projectile(MAP, PLAYER, { x: e.x, y: e.y }, PROJECTILE, { gameTime: isGameTime }).then( (anim) => {
		console.log('projectile hit:', anim.x, anim.y);
		GW.fx.flashSprite(MAP, anim.x, anim.y, 'hit', 500, 1);
	});
}

GW.commands.showProjectile = showProjectile;

async function showAura(e) {

	GW.fx.explosion(MAP, e.x, e.y, 3, 'magic', { shape: 'o', center: false, gameTime: isGameTime });
}

GW.commands.showAura = showAura;


async function showExplosion(e) {
	GW.fx.explosion(MAP, e.x, e.y, 7, 'fireball', { gameTime: isGameTime });
}

GW.sprite.install('fireball', '&', 'dark_red', 50);

GW.commands.showExplosion = showExplosion;


async function showExplosionPlus(e) {
	GW.fx.explosion(MAP, e.x, e.y, 7, 'fireball', { gameTime: isGameTime, shape: '+' });
}

GW.commands.showExplosionPlus = showExplosionPlus;

async function showExplosionX(e) {
	GW.fx.explosion(MAP, e.x, e.y, 7, 'fireball', { gameTime: isGameTime, shape: 'x' });
}

GW.commands.showExplosionX = showExplosionX;

async function showExplosionStar(e) {
	GW.fx.explosion(MAP, e.x, e.y, 7, 'fireball', { gameTime: isGameTime, shape: '*' });
}

GW.commands.showExplosionStar = showExplosionStar;

async function toggleWall(e) {
	const cell = MAP.cell(e.x, e.y);
	if (cell.groundTile.name === 'WALL') {
		MAP.setTile(e.x, e.y, 'FLOOR');
	}
	else {
		MAP.setTile(e.x, e.y, 'WALL');
	}
  MAP.redrawCell(cell);
	GW.ui.draw();
}

GW.commands.toggleWall = toggleWall;

async function rest(e) {
	PLAYER.endTurn();
}

GW.commands.rest = rest;




let mapCount = 0;

function makeMap() {
	// dig a map
	MAP = GW.make.map(80, 30);
	MAP.nullify();
	GW.dungeon.start(MAP);

	MAP.cells.forRect(2, 2, 76, 26, (c) => c.setTile('FLOOR'));
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


async function showHelp() {
	const buf = GW.ui.startDialog();

	let y = 2;
	buf.plotText(20, y++, 'GoblinWerks FX Example', 'green');
	y++;
	y = buf.wrapText(10, y, 60, 'This example allows you to try out some of the special FX in GoblinWerks.', 'white');
	y++;
	buf.plotText(10, y++, 'CLICK : When you click on a tile, the current FX is played.', 'white');
	buf.plotText(10, y++, 'DIR   : Pressing a direction key moves the player.', 'white');
	y = buf.wrapText(10, y, 60, 'SPACE : Rest player - lets game time animations continue. (you could also move the player)', 'white', null, { indent: 8 });
	buf.plotText(10, y++, 'g     : Toggle between game time and real time FX.', 'white');
	buf.plotText(10, y++, '>     : Change to a new map.', 'white');
	buf.plotText(10, y++, '?     : Show this screen.', 'white');
	y++;
	buf.plotText(10, y++, 'FX available', 'white');
	buf.plotText(10, y++, '======================', 'white');
	buf.plotText(10, y++, 'w     : Enter WALL mode - clicks place/remove walls.', 'white');
	buf.plotText(10, y++, 'h     : Show a HIT on the clicked tile.', 'white');
	buf.plotText(10, y++, 'f     : Blink a sprite on the clicked tile.', 'white');
	buf.plotText(10, y++, 'b     : Fire a BOLT to the clicked tile.', 'white');
	buf.plotText(10, y++, 'p     : Fire a PROJECTILE to the clicked tile.', 'white');
	buf.plotText(10, y++, 'm     : Fire a BEAM to the clicked tile.', 'white');
	buf.plotText(10, y++, 'o     : Cause an explosion at the clicked tile.', 'white');
	buf.plotText(10, y++, '+     : Fire a + shaped explosion.', 'white');
	buf.plotText(10, y++, 'x     : Fire an X shaped explosion.', 'white');
	buf.plotText(10, y++, '*     : Fire a * shaped explosion.', 'white');
	buf.plotText(10, y++, 'a     : Produce an aura (explosion w/o center).', 'white');

	buf.fillRect(8, 1, 64, y, null, null, 'black' );

	GW.ui.draw();
	await GW.io.nextKeyPress(-1);
	GW.ui.finishDialog();
}

GW.commands.showHelp = showHelp;


// start the environment
function start() {

	const canvas = GW.ui.start({ width: 80, height: 30, div: 'game' });
	GW.io.setKeymap({ dir: 'movePlayer', space: 'rest', click: 'showFX',
			b: 'selectBolt', h: 'selectHit', f: 'selectFlash', p: 'selectProjectile',
		 	m: 'selectBeam', w: 'selectWall',
			o: 'selectExplosion', '+': 'selectExplosionPlus', '=': 'selectExplosionPlus',
		 	x: 'selectExplosionX', '8': 'selectExplosionStar', '*': 'selectExplosionStar',
			a: 'selectAura',
			g: 'toggleGameTime', '>': 'newMap', '<': 'newMap',
			'?': 'showHelp'
	});

	PLAYER.x = 40;
	PLAYER.y = 27;

	makeMap();
	showHelp().then( () => {
		GW.game.start({ player: PLAYER, map: MAP });
	});
}

window.onload = start;
