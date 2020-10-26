

import * as Flags from './flags.js';
import { io as IO } from './io.js';
import * as Light from './light.js';
import * as Utils from './utils.js';
import { startActorTurn } from './actor.js';
import { make, data as DATA, types, ui as UI } from './gw.js';

export var player = {};

player.debug = Utils.NOOP;



export function makePlayer(kind) {
  if (!(kind instanceof types.ActorKind)) {
    Utils.setDefaults(kind, {
      sprite: { ch:'@', fg: 'white' },
      name: 'you', article: false,
    });
    kind = new types.ActorKind(kind);
  }
  return new types.Actor(kind);
}

make.player = makePlayer;



export async function takeTurn() {
  const PLAYER = DATA.player;
  player.debug('player turn...', DATA.time);
  if (PLAYER.isDead() || DATA.gameHasEnded) {
    return 0;
  }
  Light.updateLighting(DATA.map);
  await UI.updateIfRequested();
  await startActorTurn(PLAYER);

  while(!PLAYER.turnTime) {
    const ev = await IO.nextEvent(1000);
    if (!await UI.dispatchEvent(ev)) {
      await IO.dispatchEvent(ev);
    }
    await UI.updateIfRequested();
    if (DATA.gameHasEnded) {
      return 0;
    }
  }

  player.debug('...end turn', PLAYER.turnTime);
  return PLAYER.turnTime;
}

player.takeTurn = takeTurn;



function isValidStartLoc(cell, x, y) {
  if (cell.hasTileFlag(Flags.Tile.T_PATHING_BLOCKER | Flags.Tile.T_HAS_STAIRS)) {
    return false;
  }
  return true;
}

player.isValidStartLoc = isValidStartLoc;


// sets miner's light strength and characteristics based on rings of illumination, scrolls of darkness and water submersion
export function updateMinersLightRadius(PLAYER) {
	let base_fraction, fraction, lightRadius;

	lightRadius = 100 * PLAYER.minersLightRadius;

	if (PLAYER.bonus.lightMultiplier < 0) {
		lightRadius = lightRadius / (-1 * PLAYER.bonus.lightMultiplier + 1);
	} else {
		lightRadius *= (PLAYER.bonus.lightMultiplier);
		lightRadius = Math.max(lightRadius, (PLAYER.bonus.lightMultiplier * 2 + 2) << FP_BASE);
	}

	if (PLAYER.status.darkness) {
    base_fraction = FP_FACTOR - (PLAYER.status[STATUS_DARKNESS] << FP_BASE) / PLAYER.maxStatus[STATUS_DARKNESS];
    fraction = (base_fraction * base_fraction >> FP_BASE) * base_fraction >> FP_BASE;
    //fraction = (double) pow(1.0 - (((double) PLAYER.status[STATUS_DARKNESS]) / PLAYER.maxStatus[STATUS_DARKNESS]), 3);
		if (fraction < FP_FACTOR / 20) {
			fraction = FP_FACTOR / 20;
    }
    lightRadius = lightRadius * fraction >> FP_BASE;
  } else {
      fraction = FP_FACTOR;
  }

	if (lightRadius < 2 << FP_BASE) {
		lightRadius = 2 << FP_BASE;
	}

	if (GAME.inWater && lightRadius > 3 << FP_BASE) {
		lightRadius = max(lightRadius / 2, 3 << FP_BASE);
	}

	PLAYER.minersLight.fadeTo = 35 + max(0, min(65, PLAYER.bonus.lightMultiplier * 5)) * fraction >> FP_BASE;
	PLAYER.minersLight.radius.hi = PLAYER.minersLight.radius.lo = clamp(lightRadius >> FP_BASE, -30000, 30000);
}
