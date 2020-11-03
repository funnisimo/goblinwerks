// import Board from "./board.js";
// import XY from "util/xy.js";
//
// import * as ui from "ui/combat.js";
// import * as keyboard from "util/keyboard.js";
// import * as map from "ui/map/map.js";
// import * as log from "ui/log.js";
//
// import pc from "being/pc.js";
// import { ATTACK_1, ATTACK_2, MAGIC_1, MAGIC_2 } from "./types.js";
//
// const AMOUNTS = ["slightly", "moderately", "severely", "critically"].reverse();
//
// let tutorial = false;
//
// let board = new Board().randomize();
// let resolve = null;
// let enemy = null;
// let cursor = new XY(0, 0);
//
// function end() {
// 	map.activate();
// 	map.zoomOut();
// 	ui.deactivate();
// 	keyboard.pop();
// 	resolve();
// }
//
// function doDamage(attacker, defender, options = {}) {
// //	console.log("combat", options);
// 	if (options.isMagic) { // check mana
// 		if (attacker.mana < options.power) {
// 			log.add("%The %{verb,do} not have enough mana to attack.", attacker, attacker);
// 			return;
// 		}
// 		attacker.adjustStat("mana", -options.power);
// 	}
//
// 	let attack = attacker.getAttack();
// 	let defense = defender.getDefense();
// 	let damage = attack + options.power - defense;
// //	console.log("attack %s, defense %s, damage %s", attack, defense, damage);
// 	damage = Math.max(1, damage);
//
// 	let verb = (options.isMagic ? "%{verb,cast} a spell at %the" : "%{verb,hit} %the").format(attacker, defender);
// 	let newHP = Math.max(0, defender.hp-damage);
// 	if (newHP > 0) {
// 		let frac = newHP/defender.maxhp; // >0, < maxhp
// 		let amount = AMOUNTS[Math.floor(frac * AMOUNTS.length)];
// 		log.add(`%The ${verb} and ${amount} %{verb,damage} %it.`, attacker, attacker, defender);
// 	} else {
// 		log.add(`%The ${verb} and %{verb,kill} %it!`, attacker, attacker, defender);
// 	}
//
// 	defender.adjustStat("hp", -damage);
// 	if (defender.hp <= 0) { end(); }
// }
//
// function activate(xy) {
// 	let segment = board.findSegment(xy);
// 	if (!segment || segment.length < 2) { return; }
//
// 	let value = board.at(xy).value;
//
// 	segment.forEach(xy => {
// 		board.set(xy, null);
// 	});
//
// 	let animation = board.fall();
// 	animation.start(drawFast).then(() => {
// 		checkSegments();
// 		drawFull();
// 	});
//
// 	let power = segment.length;
// 	let isMagic = (value == MAGIC_1 || value == MAGIC_2);
// 	let attacker = pc;
// 	let defender = enemy;
// 	if (value == ATTACK_2 || value == MAGIC_2) {
// 		attacker = enemy;
// 		defender = pc;
// 	}
//
// 	doDamage(attacker, defender, {power, isMagic});
// }
//
// function checkSegments() {
// 	while (1) {
// 		let segments = board.getAllSegments();
// 		if (segments[0].length >= 2) { return; }
// 		board.randomize();
// 	}
// }
//
// function handleKeyEvent(e) {
// 	if (keyboard.isEnter(e)) { return activate(cursor); }
//
// 	let dir = keyboard.getDirection(e);
// 	if (!dir) { return; }
//
// 	dir = dir.scale(1, -1);
// 	cursor = cursor.plus(dir).mod(board.getSize());
// 	drawFull();
// }
//
// function drawFast() {
// 	ui.draw(board, cursor);
// }
//
// function drawFull() {
// 	let highlight = board.findSegment(cursor);
// 	if (highlight && highlight.length < 2) { highlight = null; }
// 	ui.draw(board, cursor, highlight || []);
// }
//
// export function init(parent) {
// 	ui.init(parent);
// 	checkSegments();
// 	drawFull();
// }
//
// export function start(e) {
// 	map.deactivate();
// 	map.zoomIn();
// 	ui.activate();
//
// 	if (!tutorial) {
// 		tutorial = true;
// 		log.add("Combat in Sleeping Beauty happens by playing the {goldenrod}Game of Thorns{} on a square game board.");
// 		log.add("Match sequences ({#fff}direction keys{} and {#fff}Enter{}) of colored blocks to perform individual actions. This includes both your attacks as well as your enemy's.");
// 		log.add("Note that certain items in your inventory can modify the frequency of colors on the game board.");
// 		log.pause();
// 	}
//
// 	enemy = e;
// 	let promise = new Promise(r => resolve = r);
// 	keyboard.push({handleKeyEvent});
//
// 	return promise;
// }


GW.config.ATTACK_1 = "a1";
GW.config.ATTACK_2 = "a2";
GW.config.MAGIC_1 = "m1";
GW.config.MAGIC_2 = "m2";

GW.config.COMBAT_COLORS = {
	[GW.config.ATTACK_1]: "#0f0",
	[GW.config.ATTACK_2]: "#f00",
	[GW.config.MAGIC_1]: "#00f",
	[GW.config.MAGIC_2]: "#ff3"
};

const COMBAT_BONUS_DISPLAY = {
	[GW.config.ATTACK_1]: GW.text.format('+%F#%F', GW.config.COMBAT_COLORS[GW.config.ATTACK_1], null),
	[GW.config.ATTACK_2]: GW.text.format('+%F#%F', GW.config.COMBAT_COLORS[GW.config.ATTACK_2], null),
	[GW.config.MAGIC_1]: GW.text.format('+%F#%F', GW.config.COMBAT_COLORS[GW.config.MAGIC_1], null),
	[GW.config.MAGIC_2]: GW.text.format('+%F#%F', GW.config.COMBAT_COLORS[GW.config.MAGIC_2], null)
};


function drawBoard(buffer, x, y) {

  for(let i = 0; i < 6; ++i) {
    buffer.plotText(x+5, y + i, '%F# # # # # #', 'blue');
  }

  buffer.plotText(x, y+7,  '%F#%F You - Melee Attack', 'green', null)
  buffer.plotText(x, y+8,  '%F#%F You - Magic Attack', 'blue', null)
  buffer.plotText(x, y+10, '%F#%F Enemy - Melee Attack', 'red', null)
  buffer.plotText(x, y+11, '%F#%F Enemy - Magic Attack', 'yellow', null)

}

function drawPlayer(buffer, x, y, width) {
  const player = GW.data.player;

  buffer.plotText(x, y, GW.text.capitalize(player.getName()));
  GW.ui.plotProgressBar(buffer, x, y + 1, width, 'Health', 'white', player.current.health / player.max.health, 'redBar');
  GW.ui.plotProgressBar(buffer, x, y + 2, width, 'Mana', 'white', player.current.mana / player.max.mana, 'blueBar');
  buffer.plotText(x, y + 4, 'Damage : 0');
  buffer.plotText(x, y + 5, 'Defense: 0');
  buffer.plotText(x, y + 6, 'Bonus  : ');

}


function drawOpponent(buffer, x, y, width, opponent) {

  buffer.plotText(x, y, GW.text.capitalize(opponent.getName()));
  GW.ui.plotProgressBar(buffer, x, y + 1, width, 'Health', 'white', opponent.current.health / opponent.max.health, 'redBar');
  GW.ui.plotProgressBar(buffer, x, y + 2, width, 'Mana', 'white', opponent.current.mana / opponent.max.mana, 'blueBar');
  buffer.plotText(x, y + 4, 'Damage : 0');
  buffer.plotText(x, y + 5, 'Defense: 0');
  buffer.plotText(x, y + 6, 'Danger : ' + opponent.current.danger);

}

async function combat(actor, target, ctx) {
  const map = ctx.map || GW.data.map;
  console.log('CUSTOM ATTACK!', actor.getName({ color: false }), target.getName({ color: false }));

  GW.message.add('%s %s %s', actor.getName(), actor.getVerb('attack'), target.getName('a'));

  const buffer = GW.ui.startDialog();

  const width = buffer.width;
  const height = GW.viewport.bounds.height;
  const x = 0;
  const y = GW.viewport.bounds.y;

  buffer.blackOutRect(x, y, width, height, 'darkest_gray');
  buffer.plotText(x + 36, y + 1, '%FBATTLE OF THORNS', 'yellow');
  // buffer.plotText(x + 2, y + 3, 'Press <Enter> to exit');

  drawBoard(buffer, x + 34, y + 4);
  drawPlayer(buffer, x + 4, y + 4, 20);
  drawOpponent(buffer, x + 66, y + 4, 20, actor.isPlayer() ? opponent : actor);

  const help = GW.text.format("Combat in Sleeping Beauty happens by fighting the %FBatte of Thorns%F on a square game board.\n\nMatch sequences of 3 or more colored blocks to perform individual actions.\n\nThis includes both your attacks as well as your enemy's.\n\nUse the %Farrow keys%F and %FEnter%F to select.\n\nNote: Certain items in your inventory can modify the frequency of colors on the game board.", 'gold', null, 'yellow', null, 'yellow', null);

  let nextY = buffer.wrapText(x + 4, y + 21, width - 8, help);

  GW.flavor.clear();
  GW.message.draw(buffer);
  GW.flavor.draw(buffer);
  GW.ui.draw();

  let running = true;
  while(running) {

    const ev = await GW.io.nextEvent(1000);
    await GW.io.dispatchEvent(ev, {
      enter() {
        running = false;
      }
    });
  }

  GW.ui.finishDialog();

  actor.endTurn();
  return true;
}


//
// export async function confirm(text, fg, opts={}) {
//
//
// 	const btnOK = '%FOK=Enter';
// 	const btnCancel = '%FCancel=Escape';
//   const len = Math.max(text.length, btnOK.length + 4 + btnCancel.length);
//   const x = Math.floor((ui.canvas.width - len - 4) / 2) - 2;
//   const y = Math.floor(ui.canvas.height / 2) - 1;
//   buffer.fillRect(x, y, len + 4, 5, ' ', 'black', 'black');
// 	buffer.plotText(x + 2, y + 1, text);
// 	buffer.plotText(x + 2, y + 3, btnOK, 'white');
// 	buffer.plotText(x + len + 4 - btnCancel.length - 2, y + 3, btnCancel, 'white');
// 	ui.draw();
//
// 	let result;
// 	while(result === undefined) {
// 		const ev = await IO.nextEvent(1000);
// 		await IO.dispatchEvent(ev, {
// 			enter() {
// 				result = true;
// 			},
// 			escape() {
// 				result = false;
// 			},
// 			mousemove() {
// 				let isOK = ev.x < x + btnOK.length + 2;
// 				let isCancel = ev.x > x + len + 4 - btnCancel.length - 4;
// 				if (ev.x < x || ev.x > x + len + 4) { isOK = false; isCancel = false; }
// 				if (ev.y != y + 3 ) { isOK = false; isCancel = false; }
// 				buffer.plotText(x + 2, y + 3, btnOK, isOK ? 'blue' : 'white');
// 				buffer.plotText(x + len + 4 - btnCancel.length - 2, y + 3, btnCancel, isCancel ? 'blue' : 'white');
// 				ui.draw();
// 			},
// 			click() {
// 				if (ev.x < x || ev.x > x + len + 4) return;
// 				if (ev.y < y || ev.y > y + 5) return;
// 				result = ev.x < x + Math.floor(len/2) + 2;
// 			}
// 		});
// 	}
//
// 	return result;
// }
