


class Monster extends GW.types.ActorKind {
  constructor(opts={}) {
    GW.utils.kindDefaults(opts, {
      name: 'Monster',
      ch: '?', fg: 'red',
      'stats.health': 1,

      consoleColor: null,
      corpse: null,

      blood: null,
      speed: 120,  // 120 is default, 180 is 50% slower

      bump: ['attack'],
      ai: ['sleep', 'attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],

      'attacks.melee': { damage: 1, verb: 'scratch' }
    });
    super(opts);
  }

}

GW.types.Monster = Monster;

// Bad guys!

const M = [
["URCHIN", "Urchin",    0, 'p', 'brown',      '0', [  1, 4],   1, [ 40,  4], 1, [ 72, 148,   0,   0], "BB_MOVES_RANDOM_25, BB_OPEN_DOORS, BB_PICKUP_ITEMS", "evil"],
["IDIOT",  "Idiot",     0, 'p', 'brown',      '0', [  1, 2],   1, [  0,  6], 0, [ 79,   0,   0,   0], "BB_MOVES_RANDOM_25, BB_OPEN_DOORS, BB_PICKUP_ITEMS"],
['BEGGAR', "Beggar",    0, 'p', 'brown',      '0', [  1, 4],   1, [ 40, 10], 0, [ 72,   0,   0,   0], "BB_MOVES_RANDOM_25, BB_OPEN_DOORS, BB_PICKUP_ITEMS"],
['LEPER',  "Leper",     0, 'p', 'brown',      '0', [  1, 1],   1, [ 50,  5], -1, [ 72,   0,   0,   0], "BB_MOVES_RANDOM_25, BB_OPEN_DOORS, BB_PICKUP_ITEMS"],
['ROGUE',  "Rogue",     0, 'p', 'dark_brown', '0', [  2, 8],   8, [ 99, 10], 1, [  5, 149,   0,   0], "BB_OPEN_DOORS, BB_PICKUP_ITEMS, TR_CHANCE_50, TR_GOLD, TR_ITEMS", "evil"],
['DRUNK',  "Drunk",     0, 'p', 'brown',      '0', [  2, 3],   1, [  0, 10], -1, [ 72,   0,   0,   0], "BB_MOVES_RANDOM, BB_OPEN_DOORS, BB_PICKUP_ITEMS, BB_AVOID_COMBAT, TR_CHANCE_50"],
['MERCENARY', "Mercenary", 0, 'p', 'brown',   '0', [  5, 8],  20, [250,  2], 1, [  9,   0,   0,   0], "BB_MOVES_RANDOM_25, BB_OPEN_DOORS, BB_PICKUP_ITEMS, TR_CHANCE_87, TR_ITEMS", "evil"],
['VETERAN', "Veteran",  0, 'p', 'brown',      '0', [  7, 8],  30, [250,  2], 1, [ 15,   0,   0,   0], "BB_MOVES_RANDOM_25, BB_OPEN_DOORS, BB_PICKUP_ITEMS, TR_CHANCE_87, TR_ITEMS"],
];

M.forEach( (info) => {
  const [id, name, xp, ch, fg, frequency, hitDice, armor, notice, speed, attacks, flags, tags] = info;

  const stats = {
    sleep: notice[0],
    perception: notice[1],
    health: hitDice,
    armor,
  };

  GW.actor.addKind(id, new Monster({
    name,
    xp,
    ch,
    fg,
    stats,
    speed: 150 - (30*speed),
    flags,
  }));

  if (frequency) {
    GW.horde.addKind(id, id, { frequency });
  }

});
