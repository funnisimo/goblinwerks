
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
	return GW.ui.alert(500, text);
}

GW.io.addCommand('toggleGameTime', toggleGameTime);

function selectWall() {
	command = 'toggleWall';
	return GW.ui.alert(500, 'Selected WALL.');
}

GW.io.addCommand('selectWall', selectWall);

function selectBeam() {
	command = 'showBeam';
	return GW.ui.alert(500, 'Selected BEAM.');
}

GW.io.addCommand('selectBeam', selectBeam);

function selectFlash() {
	command = 'showFlash';
	return GW.ui.alert(500, 'Selected FLASH.');
}

GW.io.addCommand('selectFlash', selectFlash);

function selectBolt() {
	command = 'showBolt';
	return GW.ui.alert(500, 'Selected BOLT.');
}

GW.io.addCommand('selectBolt', selectBolt);

async function selectHit() {
	command = 'showHit';
	await GW.ui.alert(500, 'Selected HIT.');
}

GW.io.addCommand('selectHit', selectHit);

async function selectAura() {
	command = 'showAura';
	await GW.ui.alert(500, 'Selected AURA.');
}

GW.io.addCommand('selectAura', selectAura);

async function selectExplosion() {
	command = 'showExplosion';
	await GW.ui.alert(500, 'Selected EXPLOSION.');
}

GW.io.addCommand('selectExplosion', selectExplosion);

async function selectExplosionStar() {
	command = 'showExplosionStar';
	await GW.ui.alert(500, 'Selected STAR.');
}

GW.io.addCommand('selectExplosionStar', selectExplosionStar);

async function selectExplosionPlus() {
	command = 'showExplosionPlus';
	await GW.ui.alert(500, 'Selected PLUS.');
}

GW.io.addCommand('selectExplosionPlus', selectExplosionPlus);

async function selectExplosionX() {
	command = 'showExplosionX';
	await GW.ui.alert(500, 'Selected X.');
}

GW.io.addCommand('selectExplosionX', selectExplosionX);

async function selectProjectile() {
	command = 'showProjectile';
	await GW.ui.alert(500, 'Selected PROJECTILE.');
}

GW.io.addCommand('selectProjectile', selectProjectile);


function showFX(e) {
	console.log('click', e.x, e.y, command);
	if (e.x != PLAYER.x || e.y != PLAYER.y) {
		const r = GW.io.commands[command](e);
		if (isGameTime) PLAYER.endTurn();
		return r;
	}
}

GW.io.addCommand('showFX', showFX);

function showFlash(e) {
	return GW.fx.flashSprite(MAP, e.x, e.y, 'bump', 500, 3);
}

GW.io.addCommand('showFlash', showFlash);

async function showHit(e) {
	await GW.fx.hit(MAP, e);
}

GW.io.addCommand('showHit', showHit);

async function showBeam(e) {
	GW.fx.beam(MAP, PLAYER, { x: e.x, y: e.y }, 'lightning', { gameTime: isGameTime }).then( async (anim) => {
		console.log('beam end: ', anim.x, anim.y);
		await GW.fx.hit(MAP, anim);
		console.log('- beam hit done');
	});
}

GW.sprite.install('lightning', '\u16f6', [200,200,200]);

GW.io.addCommand('showBeam', showBeam);

function showBolt(e) {
	GW.fx.bolt(MAP, PLAYER, { x: e.x, y: e.y }, 'magic', { gameTime: isGameTime }).then( async (result) => {
		console.log('bolt hit:', result.x, result.y);
		await GW.fx.flashSprite(MAP, result.x, result.y, 'hit', 500, 3);
		console.log('- hit done.');
	});
}

GW.sprite.install('magic', '*', 'purple');

GW.io.addCommand('showBolt', showBolt);

const PROJECTILE = GW.make.sprite('|-\\/', 'orange', null); // null makes sprite with ch.length > 1 possible

async function showProjectile(e) {

	GW.fx.projectile(MAP, PLAYER, { x: e.x, y: e.y }, PROJECTILE, { gameTime: isGameTime }).then( (anim) => {
		console.log('projectile hit:', anim.x, anim.y);
		GW.fx.flashSprite(MAP, anim.x, anim.y, 'hit', 500, 1);
	});
}

GW.io.addCommand('showProjectile', showProjectile);

async function showAura(e) {

	GW.fx.explosion(MAP, e.x, e.y, 3, 'magic', { shape: 'o', center: false, gameTime: isGameTime });
}

GW.io.addCommand('showAura', showAura);


async function showExplosion(e) {
	GW.fx.explosion(MAP, e.x, e.y, 7, 'fireball', { gameTime: isGameTime });
}

GW.sprite.install('fireball', '&', 'dark_red', 50);

GW.io.addCommand('showExplosion', showExplosion);


async function showExplosionPlus(e) {
	GW.fx.explosion(MAP, e.x, e.y, 7, 'fireball', { gameTime: isGameTime, shape: '+' });
}

GW.io.addCommand('showExplosionPlus', showExplosionPlus);

async function showExplosionX(e) {
	GW.fx.explosion(MAP, e.x, e.y, 7, 'fireball', { gameTime: isGameTime, shape: 'x' });
}

GW.io.addCommand('showExplosionX', showExplosionX);

async function showExplosionStar(e) {
	GW.fx.explosion(MAP, e.x, e.y, 7, 'fireball', { gameTime: isGameTime, shape: '*' });
}

GW.io.addCommand('showExplosionStar', showExplosionStar);

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

GW.io.addCommand('toggleWall', toggleWall);

async function rest(e) {
	PLAYER.endTurn();
}

GW.io.addCommand('rest', rest);




let mapCount = 0;

function makeMap() {
	// dig a map
	MAP = GW.make.map(80, 30);
	MAP.nullify();
	GW.dungeon.start(MAP);

	MAP.cells.forRect(2, 2, 76, 26, (c,x,y) => MAP.setTile(x, y, 'FLOOR'));
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

GW.io.addCommand('newMap', newMap);


async function showHelp() {
	const buf = GW.ui.startDialog();

	let y = 2;
	buf.drawText(20, y++, 'GoblinWerks FX Example', 'green');
	y++;
	y = buf.wrapText(10, y, 60, 'This example allows you to try out some of the special FX in GoblinWerks.', 'white');
	y++;
	buf.drawText(10, y++, 'CLICK : When you click on a tile, the current FX is played.');
	buf.drawText(10, y++, 'DIR   : Pressing a direction key moves the player.');
	y = buf.wrapText(10, y, 60, 'SPACE : Rest player - lets game time animations continue. (you could also move the player)', 'white', null, { indent: 8 });
	buf.drawText(10, y++, 'g     : Toggle between game time and real time FX.');
	buf.drawText(10, y++, '>     : Change to a new map.');
	buf.drawText(10, y++, '?     : Show this screen.');
	y++;
	buf.drawText(10, y++, 'FX available');
	buf.drawText(10, y++, '======================');
	buf.drawText(10, y++, 'w     : Enter WALL mode - clicks place/remove walls.');
	buf.drawText(10, y++, 'h     : Show a HIT on the clicked tile.');
	buf.drawText(10, y++, 'f     : Blink a sprite on the clicked tile.');
	buf.drawText(10, y++, 'b     : Fire a BOLT to the clicked tile.');
	buf.drawText(10, y++, 'p     : Fire a PROJECTILE to the clicked tile.');
	buf.drawText(10, y++, 'm     : Fire a BEAM to the clicked tile.');
	buf.drawText(10, y++, 'o     : Cause an explosion at the clicked tile.');
	buf.drawText(10, y++, '+     : Fire a + shaped explosion.');
	buf.drawText(10, y++, 'x     : Fire an X shaped explosion.');
	buf.drawText(10, y++, '*     : Fire a * shaped explosion.');
	buf.drawText(10, y++, 'a     : Produce an aura (explosion w/o center).');

	buf.fillRect(8, 1, 64, y, null, null, 'black' );

	// GW.ui.draw();
  buf.render();
	await GW.io.nextKeyPress(-1);
	GW.ui.finishDialog();
}

GW.io.addCommand('showHelp', showHelp);


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
