

import { io as IO } from './io.js';
import { ui as UI } from './ui.js';
import { make, data as DATA, types } from './gw.js';

export var player = {};


export class Player extends types.Actor {
  constructor(kind) {
    super(kind);
  }

  startTurn() {
    player.startTurn(this);
  }

  visionRadius() {
  	return CONFIG.MAX_FOV_RADIUS || (DATA.map.width + DATA.map.height);
  }

  endTurn(turnTime) {
    player.endTurn(this, turnTime);
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
  await PLAYER.startTurn();

  while(!PLAYER.turnTime) {
    const ev = await IO.nextEvent(1000);
    await IO.dispatchEvent(ev);
  }

  console.log('...end turn', PLAYER.turnTime);
  return PLAYER.turnTime;
}

player.takeTurn = takeTurn;


function startTurn(PLAYER) {
	PLAYER.turnTime = 0;
}

player.startTurn = startTurn;


function act() {
	return true;
}

player.act = act;

function endTurn(PLAYER, turnTime) {
  PLAYER.turnTime = turnTime || Math.floor(PLAYER.kind.speed/2);  // doing nothing takes time
  UI.requestUpdate();
}

player.endTurn = endTurn;
