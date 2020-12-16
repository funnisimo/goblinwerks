
import { utils as Utils, random, frequency as Frequency } from 'gw-core';
import * as Flags from './flags.js';
import * as GW from './gw.js';


GW.hordes.all = [];
const HORDE_CHANCE = [];

export class Horde {
  constructor(config={}) {
    this.minions = null;
    Object.assign(this,config);
    this.frequency = Frequency.make(this.frequency);
    this.flags = Flags.Horde.toFlag(this.flags);
  }
}


export function make(...args) {
  let opts = args[0];
  if (args.length == 1 && Array.isArray(args[0])) args = args[0];
  if (args.length == 2 && (typeof args[0] === 'string') && (typeof args[1] === 'object')) {
    args[1].leader = args[0];
    opts = args[1];
  }
  else if (args.length > 1) {
    let [leader, frequency, minions] = args;
    opts = {
      leader, frequency, minions
    };
  }
  return new Horde(opts);
}

GW.make.horde = make;

export function addKind(id, ...args) {
  const horde = make(...args);
  horde.id = id;
  if (GW.hordes[id]) {
    const index = GW.hordes.all.indexOf(GW.hordes[id]);
    if (index >= 0) {
      GW.hordes.all[index] = horde;
    }
    else {
      throw new Error('Horde registered, but not in all hordes list - ' + id);
    }
  }
  else {
    GW.hordes.all.push(horde);
    HORDE_CHANCE.push(0);
  }
  GW.hordes[id] = horde;

  return horde;
}


export function removeKind(id) {
  const horde = GW.hordes[id];
  if (!horde) return;
  const index = GW.hordes.all.indexOf(horde);
  if (index >= 0) {
    GW.hordes.all.splice(index, 1);
    HORDE_CHANCE.pop();
  }
  delete GW.hordes[id];
}


export function pick(depth, forbiddenFlags=0, requiredFlags=0, summoner=null) {
  if (summoner && summoner.id) {
    summoner = summoner.id;
  }

	for (let i=0; i<GW.hordes.all.length; i++) {
    const horde = GW.hordes.all[i];
    HORDE_CHANCE[i] = 0;
		if (horde.flags & forbiddenFlags) continue;
		if (~(horde.flags) & requiredFlags) continue;
    if (summoner && (horde.leader !== summoner)) continue;

    HORDE_CHANCE[i] = horde.frequency(depth);
	}

	let index = random.weighted(HORDE_CHANCE);
  if (index < 0) return null;
  return GW.hordes.all[index];
}


// let x, y be random?
export function spawn(hordeId, map, x, y) {

  const horde = (typeof hordeId === 'string') ? GW.hordes[hordeId] : hordeId;
  if (!horde) throw new Error('Failed to find horde - ' + hordeId);

  // Shouldn't this should be at level design time?
	// if (horde.machine) {
	// 	// Build the accompanying machine (e.g. a goblin encampment)
	// 	RUT.Map.Blueprint.build(horde.machine, map, x, y);
	// }

  console.log('spawn leader', horde.leader);

  // console.log('HORDE SPAWN', horde);
	const leader = GW.make.actor(horde.leader);

	// if (horde.flags & Flags.Horde.HORDE_LEADER_CAPTIVE) {
	// 	leader.state |= BeingState.BS_CAPTIVE;
	// 	leader.state |= BeingState.BS_WANDERING;
	// 	leader.stats.set('health', Math.round(leader.stats.max.health / 4) + 1);  // captives are injured
  //
	// 	// Draw the manacles unless the horde spawns in weird terrain (e.g. cages).
	// 	if (!horde.spawnTile) {
	// 		RUT.Map.Decorators.manacles(map, x, y);
	// 	}
	// } else if (horde.flags & Flags.Horde.HORDE_ALLIED_WITH_PLAYER) {
	// 	RUT.Monster.becomeAllyWith(leader);
	// }

  if (typeof x !== 'number') {
    const opts = x;
    if (opts.x >= 0 && opts.y >=0) {
      // TODO - matchingLocNear(x, y, opts)
      x = opts.x;
      y = opts.y;
    }
    else {
      // opts is matcher config
      Utils.setDefaults(opts, {
        forbidCellFlags: leader.kind.forbiddenCellFlags(),
        forbidTileFlags: leader.kind.forbiddenTileFlags(),
        forbidTileMechFlags: leader.kind.forbiddenTileMechFlags(),
      });

      const loc = map.randomMatchingLoc(opts);
      if (!loc) {
        return null;
      }
      x = loc[0];
      y = loc[1];
    }
  }

  map.killActorAt(map, x, y);
  map.addActor(x, y, leader);

	// if (RUT.Monster.canSubmergeNow(leader)) {
	// 	leader.state |= BeingState.BS_SUBMERGED;
	// }

	// RUT.Horde.spawnMinions(horde, leader, false);

	return leader;
}



// If hordeID is 0, it's randomly assigned based on the depth, with a 10% chance of an out-of-depth spawn from 1-5 levels deeper.
// Returns a pointer to the leader.
export function spawnRandom(map, blockedFov, forbiddenFlags=0, requiredFlags=0)
{
  let failsafe;
  let horde;
  let depth = map.level || map.difficulty || map.depth || map.challenge || 0;

	if ((depth > 1) && (random.chance(10))) {
		depth += random.range(1, Math.min(5, Math.round(depth / 2)));
		if (depth > GW.config.map.deepestLevel) {
			depth = GW.config.map.deepestLevel; // Math.max(map.level, AMULET_LEVEL);
		}
    forbiddenFlags |= Flags.Horde.HORDE_NEVER_OOD;
	}

	horde = pick(depth, forbiddenFlags, requiredFlags);
	if (!horde) {
    console.log('No qualifying hordes.', depth, forbiddenFlags, requiredFlags);
		return null;
	}

  const matchOpts = {
    hallways: false,
    tile: horde.spawnTile,
    blockingMap: blockedFov,
  };

  return spawn(horde, map, matchOpts);
}
