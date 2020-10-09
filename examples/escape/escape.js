
const FIRST_LEVEL = 0;
const LAST_LEVEL = 1;

GW.random.seed(12345);

const PLAYER = GW.make.player({
		sprite: GW.make.sprite('@', 'white'),
		name: 'you',
		speed: 120,
    stats: { health: 20 },
    sidebar(entry, y, dim, highlight, buf) {
    	y = GW.sidebar.addName(entry, y, dim, highlight, buf);
      y = GW.sidebar.addHealthBar(entry, y, dim, highlight, buf);
      y = GW.sidebar.addText(buf, y, 'Melee : None', null, null, dim, highlight);
      y = GW.sidebar.addText(buf, y, 'Ranged: None', null, null, dim, highlight);
      return y;
    },
});


GW.tile.addKind('BROKEN_BOX', {
  layer: 'SURFACE', priority: 20,
  name: 'broken box', article: 'a',
  sprite: { ch: ';', fg: 'light_brown' }
});

GW.item.addKind('BOX', {
	name: 'box',
	description: 'a large wooden box',
	sprite: { ch: '\u2612', fg: 'yellow' },
	flags: 'A_PUSH, A_PULL, A_SLIDE, A_NO_PICKUP, A_BASH, IK_BLOCKS_MOVE, IK_NO_SIDEBAR',
  corpse: 'BROKEN_BOX',
	stats: { health: 8 }
});

GW.item.addKind('TABLE', {
	name: 'table',
	description: 'a wooden table',
	sprite: { ch: 'T', fg: 'purple' }, // ch: '\u2610'
	flags: 'A_PUSH, A_PULL, A_NO_PICKUP, A_BASH, IK_BLOCKS_MOVE, IK_NO_SIDEBAR',
	stats: { health: 10 }
});

GW.item.addKind('CHAIR', {
	name: 'chair',
	description: 'a wooden chair',
	sprite: { ch: '\u2441', fg: 'orange' },
	flags: 'A_PUSH, A_PULL, A_SLIDE, A_NO_PICKUP, A_BASH, IK_BLOCKS_MOVE, IK_NO_SIDEBAR',
	stats: { health: 4 }
});

GW.item.addKind('TRASHCAN', {
	name: 'trashcan',
	description: 'a trashcan',
	sprite: { ch: 'u', fg: 'green' },
	flags: 'A_PUSH, A_PULL, A_SLIDE, A_NO_PICKUP, A_BASH, IK_BLOCKS_MOVE',
	stats: { health: 2 }
});

GW.item.addKind('SHELVES', {
	name: 'shelves',
	description: 'shelves',
	sprite: { ch: '\u25a4', fg: 'tan' },
	flags: 'A_PUSH, A_PULL, A_NO_PICKUP, A_BASH, IK_BLOCKS_MOVE, IK_NO_SIDEBAR',
	stats: { health: 6 }
});

GW.item.addKind('CRATE', {
	name: 'crate',
	description: 'a crate',
	sprite: { ch: '\u25a7', fg: 'yellow' },
	flags: 'A_PUSH, A_PULL, A_OPEN, A_CLOSE, A_NO_PICKUP, A_BASH, IK_BLOCKS_MOVE',
	stats: { health: 8 }
});

GW.item.addKind('CHEST', {
	name: 'chest',
	description: 'a chest',
	sprite: { ch: '\u234c', fg: 'yellow' },
	flags: 'A_PUSH, A_PULL, A_OPEN, A_CLOSE, A_NO_PICKUP, A_BASH, IK_BLOCKS_MOVE',
	stats: { health: 8 }
});

GW.item.addKind('UMBRELLA', {
	name: 'umbrella',
	description: 'an umbrella',
	sprite: { ch: '\u2602', fg: 'teal' },
	flags: 'A_WIELD',
	stats: { damage: 2 },
  verb: 'poke',
  slot: 'melee',
});

GW.item.addKind('FOLDING_CHAIR', {
	name: 'folding chair',
	description: 'a folding chair',
	sprite: { ch: '}', fg: 'orange' },
	flags: 'A_WIELD',
	stats: { damage: 3 },
  verb: 'clobber',
  slot: 'melee',
});

GW.item.addKind('MEAT_TENDERIZER', {
	name: 'meat tenderizer',
	description: 'a meat tenderizer',
	sprite: { ch: '}', fg: 'red' },
	flags: 'A_WIELD',
	stats: { damage: 4 },
  verb: 'tenderize',
  slot: 'melee',
});

GW.item.addKind('POINTY_STICK', {
	name: 'pointy stick',
	description: 'a pointy stick',
	sprite: { ch: '/', fg: 'brown' },
	flags: 'A_WIELD',
	stats: { damage: 5 },
  verb: 'stab',
  slot: 'melee',
});

GW.item.addKind('PISTOL', {
	name: 'pistol',
	description: 'a pistol',
	sprite: { ch: 'r', fg: 'gray' },
	flags: 'A_WIELD',
	stats: { damage: 2, range: 5 },
  verb: 'shoot',
  slot: 'ranged',
});

GW.item.addKind('MEDKIT', {
    name: 'Medkit',
    description: 'a Medkit',
    sprite: { ch: '+', fg: 'red', bg: 'white' },
    flags: 'A_USE',
    stats: { heal: 7 },
});

GW.item.addKind('ASPIRIN', {
    name: 'Aspirin',
    description: 'an aspirin',
    sprite: { ch: ':', fg: 'white' },
    flags: 'A_USE',
    stats: { heal: 3 },
});

GW.item.addKind('BANDAGE', {
    name: 'Bandage',
    description: 'a bandage',
    sprite: { ch: 'o', fg: 'white' },
    flags: 'A_USE',
    stats: { heal: 1 },
});


// DESTROYABLE DOORS??

const BOXES = GW.make.tileEvent({ item: 'BOX', spread: 75, decrement: 10, flags: 'DFF_ABORT_IF_BLOCKS_MAP | DFF_MUST_TOUCH_WALLS' });
const CHAIRS = GW.make.tileEvent({ item: 'CHAIR', spread: 90, decrement: 100, flags: 'DFF_ABORT_IF_BLOCKS_MAP, DFF_TREAT_AS_BLOCKING' });
const TABLES = GW.make.tileEvent({ item: 'TABLE', spread: 75, decrement: 30, flags: 'DFF_ABORT_IF_BLOCKS_MAP, DFF_NO_TOUCH_WALLS, DFF_SPREAD_LINE, DFF_SUBSEQ_EVERYWHERE, DFF_TREAT_AS_BLOCKING', next: CHAIRS });


async function crossedFinish() {
	await GW.game.gameOver(true, GW.colors.teal, 'You push open the doors and feel the fresh air hit your face.  The relief is palpable, but in the back of your mind you morn for your colleagues who remain inside.');
}

const GOAL_TILE = GW.tile.addKind('EXIT', {
	sprite: { ch: 'X', fg: 'green', bg: 'light_blue' }, priority: 50,
	name: 'building exit', article: 'the',
	events: { playerEnter: crossedFinish }
});


const mapPrefab = {
  data: [
    '############################',
    '#h................#.....z..#',
    '#.......2.........+......#5#',
    '#.................#+########',
    '#.................+....SSSU#',
    '#.................#....!...#',
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
    '#.......6.........#...z....#',
    '#...z.zz.zz.......#...z....#',
    '##############+#######+#####',
    '#...........#...#.+........#',
    '#..zz.......#...#.#........#',
    '#..zz.......##.##.#..z.....#',
    '#..z..............#.z..z...#',
    '#.................#..#x#...#',
    '############################',
  ],
  cells: {
    '#': 'WALL',
    '.': 'FLOOR',
    '+': 'DOOR',
    'x': 'EXIT',
    '!': 'HELLO_SIGN',
    default: 'FLOOR',
    '@': { location: 'start' },

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




function mapFromPrefab(prefab) {

  const data = prefab.data;
  const cells = prefab.cells;
  const height = data.length;
  const width = data[0].length;
  const baseTile = prefab.cells.default || 'FLOOR';

	const map = GW.make.map(width, height, baseTile);

  for(let y = 0; y < height; ++y) {
    const line = data[y];
    for(let x = 0; x < width; ++x) {
      const ch = line[x];
      const info = cells[ch] || null;
      if (!info) continue;

      if (typeof info === 'string') {
        map.setTile(x, y, info);
        continue;
      }

      if (info.location) {
        map.locations[info.location] = [x, y];
      }
      if (info.tile) {
        map.setTile(x, y, info.tile);
      }
      if (info.item) {
        const item = GW.make.item(info.item);
        if (item) {
          map.addItem(x, y, item);
        }
      }
      if (info.actor) {
        console.log('Not creating actors yet!', info.actor, x, y);
      }
    }
  }

	return map;
}


async function showHelp() {
	const buf = GW.ui.startDialog();

	let y = 2;
	buf.plotText(20, y++, 'GoblinWerks Escape from ECMA Labs', 'green');
	y++;
	y = buf.wrapText(15, y, 50, 'You are in the basement of a secret laboratory that does experiments with toxic chemicals.  There was an accident and a toxic gas was released that will kill you.  It has already affected most of your colleagues.  You must get out quickly!', 'white');
	y++;
	buf.plotText(15, y, 'dir   ', 'yellow');
	y = buf.wrapText(21, y, 42, ': Pressing an arrow key moves the player in that direction.', 'white', null, 2);
	buf.plotText(15, y, 'space ', 'yellow');
	y = buf.wrapText(21, y, 42, ': Wait a short time.', 'white', null, 2);
	buf.plotText(15, y, '?', 'yellow');
	y = buf.wrapText(21, y, 42, ': Show this screen.', 'lighter_gray');

	buf.fillRect(14, 1, 52, y, null, null, 'black' );

	GW.ui.draw();
	await GW.io.nextKeyPress(-1);
	GW.ui.finishDialog();
}



// start the environment
async function start() {

  const map = mapFromPrefab(mapPrefab);

	const canvas = GW.ui.start({
      div: 'game',  // use this canvas element
      width: Math.max(map.width + 30, 80),  // total width of canvas in cells
      height: Math.max(map.height + 6, 36), // total height of canvas in cells
      messages: -5, // show 5 recent message lines
      cursor: true, // highlight cursor in map view
      flavor: true, // show flavor for cells under cursor
      sidebar: -30, // right side, 30 wide
  });
	GW.io.setKeymap({
		dir: 'moveDir', space: 'rest',
    g: 'grab', b: 'bash', o: 'open', c: 'close',
		'?': showHelp
	});

	GW.message.add('%REscape from ECMA Labs!\n%RYou are in the basement of a lab where something has gone horribly wrong.\nFind your way to the surface.\n%RPress <?> for help.', 'yellow', 'purple', null);
	GW.game.start({ player: PLAYER, map, fov: true });

}

window.onload = start;
