

import { io as IO } from './io.js';
import { ui as UI } from './ui.js';
import { make, data as DATA, types } from './gw.js';

export var player = {};


export class Player extends types.Actor {
  constructor(kind) {
    super(kind);
  }

  visionRadius() {
  	return CONFIG.MAX_FOV_RADIUS || (DATA.map.width + DATA.map.height);
  }

}

types.Player = Player;


export function makePlayer(kind) {
  return new types.Player(kind);
}

make.player = makePlayer;



export async function takeTurn() {
  const PLAYER = DATA.player;
  console.log('player turn...', DATA.time);
  await player.startTurn();

  while(!PLAYER.turnTime) {
    const ev = await IO.nextEvent(1000);
    await IO.dispatchEvent(ev);
  }

  await player.endTurn();
  console.log('...end turn', PLAYER.turnTime);
  return PLAYER.turnTime;
}

player.takeTurn = takeTurn;


function startTurn() {
  const PLAYER = DATA.player;
	PLAYER.turnTime = 0;
}

player.startTurn = startTurn;


function act() {
	return true;
}

player.act = act;

function endTurn() {
  const PLAYER = DATA.player;
	if (PLAYER.isOrWasVisible() && PLAYER.turnTime) {
		UI.requestUpdate();
	}
}

player.endTurn = endTurn;
