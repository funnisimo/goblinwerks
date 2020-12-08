


// To make the game play the same way every time, set a seed
// GW.random.seed(12345);


// This is the AI for the zombies that makes them stumble every now and then.
const stumbles = {
  // init(actor) - called when an Actor with this AI is created
  init(actor) {
    actor.current.turnsSinceStumble = 0;
    actor.max.turnsSinceStumble = actor.max.turnsSinceStumble || 10;
  },
  // act(actor) - called each time the actor tries to do this AI
  //            - this can be an async function
  act(actor) {
    const stumbleChance = Math.floor(100 * actor.current.turnsSinceStumble / actor.max.turnsSinceStumble);
    if(actor.current.turnsSinceStumble && GW.random.chance(stumbleChance)) {
        actor.current.turnsSinceStumble = 0;
        actor.status = 'Stumbling';
        actor.endTurn();
        return true;  // means this AI did something
    }
    actor.current.turnsSinceStumble++;
    actor.status = null;
    return false;
  }
}

// Player corpse
GW.tile.addKind('PLAYER_CORPSE', {
  sprite: { ch: '%', fg: 'gray' },
  name: 'your corpse', article: false,
  layer: 'SURFACE'
});

// Player blood - dissipates 1 per 5000 turns
GW.tile.addKind('BLOOD_RED', {
  sprite: { bg: [50,0,0] },
  name: 'red blood', article: 'some',
  layer: 'LIQUID', dissipate: 2,
});


// Our Hero!
const PLAYER = GW.make.player({
    consoleColor: 'green',
    stats: { health: 20 },

    corpse: 'PLAYER_CORPSE',
    blood: 'BLOOD_RED',

    attacks: {
      melee: {
        damage: 1, verb: 'punch',
      },
    },

    // calcBashDamage(actor, itemToBash, ctx)
    // - Called when we want to bash an Item, return the amount of damage done.
    // - If not provided, will use the default
    calcBashDamage(actor, itemToBash, ctx) {
      if (actor.melee) return actor.melee.stats.damage;
      return 1;
    },

    // sidebar(entry, y, dim, highlight, buf)
    // - Called to add this actor to the sidebar (if not provided, it will use the default)
    // - Return the new y (after adding any rows)
    sidebar(entry, y, dim, highlight, buf) {
      const player = entry.entity;
    	y = GW.sidebar.addName(entry, y, dim, highlight, buf);
      y = GW.sidebar.addHealthBar(entry, y, dim, highlight, buf);

      let melee = 'Fists [1]';
      if (player.slots.melee) {
        melee = GW.text.capitalize(player.slots.melee.getName({ details: true, color: !dim }));
      }
      y = GW.sidebar.addText(buf, y, 'Melee : ' + melee, null, null, { dim, highlight, indent: 8 });

      let ranged = 'None';
      if (player.slots.ranged) {
        ranged = GW.text.capitalize(player.slots.ranged.getName({ details: true, color: !dim }));
      }
      y = GW.sidebar.addText(buf, y, 'Ranged: ' + ranged, null, null, { dim, highlight, indent: 8 });
      return y;
    },
});


GW.message.addKind('PICKUP_BETTER', '§you§ §find§ §a item§, but §your actor§ §current§ §is§ better.');
GW.message.addKind('PICKUP_NO_NEED', '§you§ §find§ §a item§, but §you actor§ §do§ not need §it item§.');
GW.message.addKind('PICKUP', '§you§ §pickup§ §a item§.');


// Our item base class
class EscapeItem extends GW.types.ItemKind {
  constructor(opts={}) {
    super(opts);
  }

  // We customize the name function so that the details are shown the way we want.
  getName(item, opts={}) {
    let base = super.getName(item, opts);
    if (opts.details) {
      if (this.stats.damage) {
        base += ` [${this.stats.damage}]`;
      }
      if (this.stats.range) {
        base += ` <${this.stats.range}>`;
      }
      if (this.stats.heal) {
        base += ` /+${this.stats.heal} HP/`;
      }
    }
    return base;
  }

  // handles item pickup
  // - must go in slot or be immediately used
  // - only pickup better/useful items
  pickup(item, actor, ctx) {
    if (!actor.isPlayer()) return false;

    let current;
    if (item.kind.slot) {
      const slot = item.kind.slot;
      current = true;
      if (actor.slots[slot]) {
        current = actor.slots[slot];
        if (current.stats.damage > item.stats.damage) {
          GW.message.add('PICKUP_BETTER', { actor, item, current });
          return false;
        }
      }
      actor.slots[slot] = item;
    }
    else if (item.stats.heal) {
      if (actor.current.health >= actor.max.health) {
        GW.message.add('PICKUP_NO_NEED', { actor, item });
        return false;
      }
      actor.kind.heal(actor, item.stats.heal);
      current = true;
    }
    GW.message.add('PICKUP', { actor, item });
    actor.flags |= GW.flags.actor.AF_CHANGED;
    ctx.quiet = true;
    return current;
  }
}


// Zombie corpse - 1% chance to be removed
GW.tile.addKind('ZOMBIE_CORPSE', {
  sprite: { ch: '%', fg: 'gray' },
  name: 'zombie corpse', article: 'a',
  events: {
    tick: { chance: 100, flags: 'DFF_NULL_SURFACE' }
  },
  layer: 'SURFACE'
});

// Zombie blood - dissipates 1 per 10000 turns
GW.tile.addKind('BLOOD_GREEN', {
  sprite: { bg: [0,50,0] },
  name: 'green blood', article: 'some',
  layer: 'LIQUID', dissipate: 1,
});


class Zombie extends GW.types.ActorKind {
  constructor(opts={}) {
    GW.utils.kindDefaults(opts, {
      name: 'Zombie',
      ch: 'z', fg: 'red',
      'stats.health': 3,

      consoleColor: 'dark_red',
      corpse: 'ZOMBIE_CORPSE',  // Leave this corpse when you are killed

      blood: 'BLOOD_GREEN',
      speed: 180,  // 120 is default, 180 is 50% slower

      bump: ['zombiePush', 'attack'],
      ai: [stumbles, 'attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],

      'attacks.melee': { damage: 1, verb: 'scratch' }
    });
    super(opts);
  }

  // TODO = Can we get zombies to spread out before they start pushing?

  // Zombies do not avoid things (other zombies, furniture, ...).  They just bump into anything in their way.
  avoidedCellFlags(actor) {
    return 0;
  }

  // every time I get pushed by a zombie, I store up some push power
  zombiePush(actor, target, ctx) {
    if (actor.kind !== target.kind) return false;
    const current = actor.current.zombiePush || 0;
    target.current.zombiePush = 1 + current + (target.current.zombiePush || 0);
    actor.current.zombiePush = 0;
    console.log('Zombie push');
    actor.endTurn();
    return true;
  }

  // When I bash something, I release all my zombie power
  calcBashDamage(actor, target, ctx) {
    const result = super.calcBashDamage(actor, target, ctx) + (actor.current.zombiePush || 0);
    actor.current.zombiePush = 0;
    return result;
  }

  // After any successful turn, I reset the zombie power
  endTurn(actor, turnTime) {
    actor.current.zombiePush = 0;
    return turnTime;
  }

  // sidebar
  // - Show the name and health of our zombie
  sidebar(entry, y, dim, highlight, buf) {
    const actor = entry.entity;
    y = GW.sidebar.addName(entry, y, dim, highlight, buf);
    if (actor.current.health != actor.max.health) {
      y = GW.sidebar.addHealthBar(entry, y, dim, highlight, buf);
    }
    if (actor.status) {
      y = GW.sidebar.addText(buf, y, actor.status, null, null, { dim, highlight });
    }
    if (actor.current.zombiePush) {
      y = GW.sidebar.addText(buf, y, 'Push: ' + actor.current.zombiePush, null, null, { dim, highlight });
    }
    return y;
  }

}

GW.types.Zombie = Zombie;

// Bad guys!
GW.actor.addKind('ZOMBIE', new Zombie());

// Some broken furniture - gets in the way, cannot be moved
GW.tile.addKind('BROKEN_FURNITURE', {
  layer: 'SURFACE', priority: 20,
  name: 'broken furniture', article: 'some',
  flags: 'T_OBSTRUCTS_PASSABILITY',
  sprite: { ch: ';', fg: 'light_brown' }
});

// A box that you can push, pull and slide around.  Bash it into broken furniture if you want.
GW.item.addKind('BOX', {
	name: 'box',
	description: 'a large wooden box',
	sprite: { ch: '\u2612', fg: 'yellow' },
	flags: 'A_PUSH, A_PULL, A_SLIDE, A_NO_PICKUP, A_BASH, IK_BLOCKS_MOVE, IK_NO_SIDEBAR',
  corpse: 'BROKEN_FURNITURE',
	stats: { health: 8 }
});

// Table to push and pull around - no sliding though.  Bash away!
GW.item.addKind('TABLE', {
	name: 'table',
	description: 'a wooden table',
	sprite: { ch: 'T', fg: 'purple' }, // ch: '\u2610'
  bump: 'push, bashItem',
	flags: 'A_PUSH, A_PULL, A_NO_PICKUP, A_BASH, IK_BLOCKS_MOVE, IK_NO_SIDEBAR',
  corpse: 'BROKEN_FURNITURE',
	stats: { health: 10 }
});

// Chair
GW.item.addKind('CHAIR', {
	name: 'chair',
	description: 'a wooden chair',
	sprite: { ch: '\u2441', fg: 'orange' },
  bump: 'push, bashItem',
	flags: 'A_PUSH, A_PULL, A_SLIDE, A_NO_PICKUP, A_BASH, IK_BLOCKS_MOVE, IK_NO_SIDEBAR',
  corpse: 'BROKEN_FURNITURE',
	stats: { health: 4 }
});

// Trashcan - shows up in sidebar (just for fun)
GW.item.addKind('TRASHCAN', {
	name: 'trashcan',
	description: 'a trashcan',
	sprite: { ch: 'u', fg: 'green' },
	flags: 'A_PUSH, A_PULL, A_SLIDE, A_NO_PICKUP, A_BASH, IK_BLOCKS_MOVE',
	stats: { health: 2 }
});

// Shelves
GW.item.addKind('SHELVES', {
	name: 'shelves', article: 'some',
	description: 'shelves',
	sprite: { ch: '\u25a4', fg: 'tan' },
  bump: 'push, bashItem',
	flags: 'A_PUSH, A_PULL, A_NO_PICKUP, A_BASH, IK_BLOCKS_MOVE, IK_NO_SIDEBAR',
  corpse: 'BROKEN_FURNITURE',
	stats: { health: 6 }
});

// A Crate - you can open it, but it has nothing inside
GW.item.addKind('CRATE', {
	name: 'crate',
	description: 'a crate',
	sprite: { ch: '\u25a7', fg: 'yellow' },
  bump: 'openItem, push, bashItem',
	flags: 'A_PUSH, A_PULL, A_OPEN, A_CLOSE, A_NO_PICKUP, A_BASH, IK_BLOCKS_MOVE',
  corpse: 'BROKEN_FURNITURE',
	stats: { health: 8 }
});

// A Chest - Nothing inside this either
GW.item.addKind('CHEST', {
	name: 'chest',
	description: 'a chest',
	sprite: { ch: '\u234c', fg: 'yellow' },
  bump: 'openItem, push, bashItem',
	flags: 'A_PUSH, A_PULL, A_OPEN, A_CLOSE, A_NO_PICKUP, A_BASH, IK_BLOCKS_MOVE',
  corpse: 'BROKEN_FURNITURE',
	stats: { health: 8 }
});

// Umbrella - defend yourself like a civilized person
GW.item.addKind('UMBRELLA', new EscapeItem({
	name: 'umbrella',
	sprite: { ch: '\u2602', fg: 'teal' },
	flags: 'A_WIELD',
	stats: { damage: 2 },
  verb: 'poke',
  slot: 'melee',
}));

// Folding chair - Best used when victim is not looking
GW.item.addKind('FOLDING_CHAIR', new EscapeItem({
	name: 'folding chair',
	sprite: { ch: '}', fg: 'orange' },
	flags: 'A_WIELD',
	stats: { damage: 3 },
  verb: 'clobber',
  slot: 'melee',
}));

// Meat tenderizer - Just seems extreme
GW.item.addKind('MEAT_TENDERIZER', new EscapeItem({
	name: 'meat tenderizer',
	sprite: { ch: '}', fg: 'red' },
	flags: 'A_WIELD',
	stats: { damage: 4 },
  verb: 'tenderize',
  slot: 'melee',
}));

// Pointy stick - Very dangerous!
GW.item.addKind('POINTY_STICK', new EscapeItem({
	name: 'pointy stick',
	sprite: { ch: '/', fg: 'brown' },
	flags: 'A_WIELD',
	stats: { damage: 5 },
  verb: 'stab',
  slot: 'melee',
}));

// Pistol - ranged damage
GW.item.addKind('PISTOL', new EscapeItem({
	name: 'pistol',
	sprite: { ch: 'r', fg: 'gray' },
	flags: 'A_WIELD',
	stats: { damage: 2, range: 5 },
  projectile: { ch: '\u00b7', fg: 'white' },
  verb: 'shoot',
  slot: 'ranged',
  consoleColor: 'white',
}));

// MedKit - big healing
GW.item.addKind('MEDKIT', new EscapeItem({
    name: 'Medkit',
    description: 'a Medkit',
    sprite: { ch: '+', fg: 'red', bg: 'white' },
    flags: 'A_USE',
    stats: { heal: 7 },
    consoleColor: 'pink',
}));

// Aspirin - medium heal
GW.item.addKind('ASPIRIN', new EscapeItem({
    name: 'Aspirin', article: 'some',
    description: 'an aspirin',
    sprite: { ch: ':', fg: 'white' },
    flags: 'A_USE',
    stats: { heal: 3 },
    consoleColor: 'pink',
}));

// Bandage - for boo boos.
GW.item.addKind('BANDAGE', new EscapeItem({
    name: 'Bandages', article: 'some',
    description: 'some bandages',
    sprite: { ch: 'o', fg: 'white' },
    flags: 'A_USE',
    stats: { heal: 1 },
    consoleColor: 'pink',
}));

// // Places boxes in a bunch in a room
// const BOXES = GW.make.tileEvent({ item: 'BOX', spread: 75, decrement: 10, flags: 'DFF_ABORT_IF_BLOCKS_MAP | DFF_MUST_TOUCH_WALLS' });
// // Add chairs
// const CHAIRS = GW.make.tileEvent({ item: 'CHAIR', spread: 90, decrement: 100, flags: 'DFF_ABORT_IF_BLOCKS_MAP, DFF_TREAT_AS_BLOCKING' });
// // Put a line of tables and then put chairs around them
// const TABLES = GW.make.tileEvent({ item: 'TABLE', spread: 75, decrement: 30, flags: 'DFF_ABORT_IF_BLOCKS_MAP, DFF_NO_TOUCH_WALLS, DFF_SPREAD_LINE, DFF_SUBSEQ_EVERYWHERE, DFF_TREAT_AS_BLOCKING', next: CHAIRS });


async function exitLevel() {
	await GW.game.gameOver(true, 'ΩtealΩYou push open the doors and feel the fresh air hit your face.  The relief is palpable, but in the back of your mind you morn for your colleagues who remain inside.');
}

// Here is your goal, when the player enters call the exitLevel function
GW.tile.addKind('EXIT', {
	sprite: { ch: 'X', fg: 'green', bg: 'light_blue' }, priority: 50,
	name: 'building exit', article: 'the',
	events: { playerEnter: exitLevel }
});

GW.message.addKind('BEWARE', 'Ωdark_redΩBeware!');

GW.tile.addKind('HELLO_SIGN', {
  name: 'sign',
  layer: 'SURFACE',
  sprite: { ch: '\u2690', fg: '#0ff' },
  flags: ['TM_LIST_IN_SIDEBAR'],
  events: {
    playerEnter(x, y, ctx) {
      GW.message.add('BEWARE', { actor: GW.data.player });
      return true;
    }
  }
});


// Our lights for the level
GW.light.addKind('OVERHEAD', {
  color: 'white', radius: 5, fadeTo: 50, passThroughActors: true
});


// Here is the map for the level
const mapPrefab = {
  data: [
    '############################',
    '#h................#.....z..#',
    '#.......2.........+......#5#',
    '#.................#+########',
    '#.................+....SSSU#',
    '#.................#.6..!...#',
    '#...hh............+..TTTT..#',
    '#..hTTh...........#..Tha@..#',
    '#...hh......h.....##########',
    '#.................#.......4#',
    '#...hh............#........#',
    '#..hTTh...........+...hh...#',
    '#...hh.........h..#...TT...#',
    '#.b...............#..hTTh..#',
    '#...hh.....------.#...TT...#',
    '#..hTTh....------.#..hTTh..#',
    '#...hh............#...TT...#',
    '#...z......------.#..hTTh..#',
    '#..........------.#...TTm..#',
    '#.................+...hh...#',
    '#...z.............#.z......#',
    '#.................#.TTTTTTT#',
    '###+##########+####+########',
    '#...zzz.zzz......3#........#',
    '#..z..............#...z....#',
    '#...z......zzz.zz.+...zz...#',
    '#.................#...z....#',
    '#...z.zz.zz.......#...z....#',
    '##############+#######+#####',
    '#...........#...#.+........#',
    '#..zz.......#...#.#........#',
    '#..zz.......##.##.#..z.....#',
    '#..z..............#.z..z...#',
    '#.................#..#x#...#',
    '############################',
  ],
  // The default level of light in every square (additional lights add on top of this)
  ambientLight: [50,50,50],
  // How to translate the data to tiles, actors, items, lights
  cells: {
    '#': 'WALL',
    '.': 'FLOOR',
    '+': 'DOOR',
    'x': 'EXIT',
    '!': 'HELLO_SIGN',
    default: 'FLOOR',
    '@': { location: 'start' }, // This is where our hero starts

    z: { actor: 'ZOMBIE' },

    h: { item: 'CHAIR' },
    T: { item: 'TABLE' },
    S: { item: 'SHELVES' },
    U: { item: 'TRASHCAN' },
    '-': { item: 'BOX' },

    '2': { item: 'UMBRELLA' },
    '3': { item: 'FOLDING_CHAIR' },
    '4': { item: 'MEAT_TENDERIZER' },
    '5': { item: 'POINTY_STICK' },
    '6': { item: 'PISTOL' },

    m: { item: 'MEDKIT' },
    b: { item: 'BANDAGE' },
    a: { item: 'ASPIRIN' },
  }
};



// Convert our prefab into a map
function mapFromPrefab(prefab) {

  const data = prefab.data;
  const cells = prefab.cells;
  const height = data.length;
  const width = data[0].length;
  const baseTile = prefab.cells.default || 'FLOOR';

  // make the initial map - covered with baseTile (FLOOR)
	const map = GW.make.map(width, height, { tile: baseTile, ambientLight: prefab.ambientLight });

  for(let y = 0; y < height; ++y) {
    const line = data[y];
    for(let x = 0; x < width; ++x) {
      const ch = line[x];
      const info = cells[ch] || null;
      if (!info) continue;

      // set the tile first
      if (typeof info === 'string') {
        map.setTile(x, y, info);
        continue;
      }
      map.setTile(x, y, info.tile || cells.default);

      // add any location names
      if (info.location) {
        map.locations[info.location] = [x, y];
      }
      // add any items
      if (info.item) {
        const item = GW.make.item(info.item);
        if (item) {
          map.addItem(x, y, item);
        }
      }
      // add any actors
      if (info.actor) {
        const actor = GW.make.actor(info.actor);
        if (actor) {
          map.addActor(x, y, actor);
        }
      }
      // add any lights
      if (info.light) {
        map.addLight(x, y, info.light);
      }
    }
  }

  // Not place some overhead lighting
  map.eachCell((cell, x, y) => {
    if((x+1) % 5 === 0 && (y+1) % 5 === 0){
      if(cell.hasTile('FLOOR')) {
        map.addLight(x, y, 'OVERHEAD');
      }
    }
  });

	return map;
}


// show the help screen
async function showHelp() {

  // start a dialog - returns the buffer to draw into
	const buf = GW.ui.startDialog();

	let y = 2;
	buf.drawText(20, y++, 'GoblinWerks Escape from ECMA Labs', 'green');
	y++;
	y = buf.wrapText(15, y, 50, 'You are in the basement of a secret laboratory that does experiments with toxic chemicals.  There was an accident and a toxic gas was released that will kill you.  It has already affected most of your colleagues.  You must get out quickly!', 'white');
	y++;
	buf.drawText(15, y, 'dir   ', 'yellow');
	y = buf.wrapText(21, y, 42, ': Pressing an arrow key moves the player in that direction.', 'white', null, 2);
  buf.drawText(15, y, 'b', 'yellow');
	y = buf.wrapText(21, y, 42, ': Bash something.', 'lighter_gray');
  buf.drawText(15, y, 'f', 'yellow');
	y = buf.wrapText(21, y, 42, ': Fire your ranged weapon at a target.', 'lighter_gray');
  buf.drawText(15, y, 'g', 'yellow');
	y = buf.wrapText(21, y, 42, ': Grab something.', 'white', null, 2);
  buf.drawText(15, y, 'o', 'yellow');
	y = buf.wrapText(21, y, 42, ': Open something.', 'lighter_gray');
  buf.drawText(15, y, 'c', 'yellow');
	y = buf.wrapText(21, y, 42, ': Close something.', 'white', null, 2);
	buf.drawText(15, y, 'space ', 'yellow');
	y = buf.wrapText(21, y, 42, ': Wait a short time.', 'white', null, 2);
	buf.drawText(15, y, '?', 'yellow');
	y = buf.wrapText(21, y, 42, ': Show this screen.', 'lighter_gray');

  // this just overwrites the background color on the range
	buf.fillRect(12, 0, 54, y + 2, null, null, 'darkest_gray' );

  // draw the dialog to the screen
	GW.ui.draw();

  // wait for a keypress
	await GW.io.nextKeyPress(-1);

  // clear the dialog and return to the game
	GW.ui.finishDialog();
}

GW.message.addKind('WELCOME', 'ΩyellowΩEscape from ECMA Labs!∆\nΩpurpleΩYou are in the basement of a lab where something has gone horribly wrong.\nFind your way to the surface.∆\nPress <?> for help.');

// start the game
async function start() {

  // make our map
  const map = mapFromPrefab(mapPrefab);

  // setup the UI
	const canvas = GW.ui.start({
      div: 'game',  // use this canvas element ID
      width: 80,    // total width of canvas in cells
      height: 36,   // total height of canvas in cells
      messages: -5, // show 5 recent message lines (at the bottom)
      cursor: true, // highlight cursor in map view
      flavor: true, // show flavor for cells under cursor
      sidebar: -40, // right side, 40 wide
      wideMessages: true, // messages go full width of canvas, not just width of map
      followPlayer: true, // The player stays at the center of the map
  });

  // here are our commands that we can do
	GW.io.setKeymap({
		dir: 'movePlayer', space: 'rest',
    g: 'grab', b: 'bash', o: 'open', c: 'close',
    f: 'fire', a: 'attack', p: 'push',
		'?': showHelp
	});

  // welcome message
	GW.message.add('WELCOME');

  // start the game
	const success = await GW.game.start({ player: PLAYER, map, fov: true });
  await GW.ui.fadeTo(GW.colors.black, 1000);

  GW.ui.buffer.blackOut();
  // did you win?
  if (!success) {
    GW.ui.buffer.wrapText(10, 10, 40, 'Thank you for playing.  Please try again soon!', 'white', null);
  }
  else {
    GW.ui.buffer.wrapText(10, 10, 40, 'What a great performance.  Please play again soon!', 'white', null);
  }
  GW.ui.buffer.render();

  GW.ui.stop();
  console.log('DONE');
}

window.onload = start;
