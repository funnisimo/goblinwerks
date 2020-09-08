

import { make, data as DATA } from './gw.js';

export var player = {};


export function makePlayer(kind) {

  return {
    x: -1,
    y: -1,
    flags: 0,
    kind
  };

}

make.player = makePlayer;


export function moveDir(dir) {
  const map = DATA.map;
  const player = DATA.player;
  return map.moveActor(player.x + dir[0], player.y + dir[1], player);
}

player.moveDir = moveDir;


export function visionRadius() {
	return CONFIG.MAX_FOV_RADIUS || (DATA.map.width + DATA.map.height);
}

player.visionRadius = visionRadius;
