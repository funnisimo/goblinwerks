
// CELLS

GW.tile.addKind('BRAMBLES', {
  name:"dense brambles", article: 'some',
  ch:"%", fg:"#483",
  events: {
    async playerEnter(x, y, ctx={}) {
      const player = ctx.actor || GW.data.player;
      await player.kind.applyDamage(player, 1, null, ctx);
      GW.message.add(GW.colors.red, 'Ouch!  %RYou injure yourself on a %Rthorn%R!', null, 'green', null);
      await GW.fx.hit(ctx.map, player);
      if (player.isDead()) {
        await GW.game.gameOver(false, 'Killed by brambles.');
      }
      return true;
    }
  }
});

GW.tile.addKind('PORTAL', {
  name: 'tower exit', article: 'the',
  ch: '\u03a9', fg: [100,40,40], bg: [100,60,20],
  flags: 'T_OBSTRUCTS_ITEMS | T_OBSTRUCTS_SURFACE_EFFECTS | T_PORTAL | T_SACRED | TM_STAND_IN_TILE | TM_LIST_IN_SIDEBAR | TM_VISUALLY_DISTINCT | TM_BRIGHT_MEMORY | TM_INTERRUPT_EXPLORATION_WHEN_SEEN | TM_INVERT_WHEN_HIGHLIGHTED',
  events: {
    playerEnter(x, y, ctx={}) {
      GW.message.add(GW.colors.red, 'You cannot leave until you find the princess.');
      return true;
    }
  }
});

GW.tile.addKind('PRINCESS', {ch:"P", fg:"pink", name:"princess", article: 'the', flags: 'T_OBSTRUCTS_PASSABILITY, TM_LIST_IN_SIDEBAR'});
GW.tile.addKind('PILLAR',   {ch:"I", fg:"#ccc", name:"pillar", flags: 'T_OBSTRUCTS_PASSABILITY'});
const GRASS1 = GW.tile.addKind('GRASS1',    {ch:"'", fg:"#693", name: 'grass', article: 'some' });
const GRASS2 = GW.tile.addKind('GRASS2',    {ch:'"', fg:"#693", name: 'grass', article: 'some'});
const TREE   = GW.tile.addKind('TREE',     {ch:"T", fg:"#693", name: 'tree'});

GW.tiles.FLOOR.sprite.ch = '.';
GW.tiles.FLOOR.sprite.fg = GW.colors.gray;
GW.tiles.WALL.sprite.bg = null;
GW.tiles.WALL.sprite.fg = GW.colors.dark_gray;

const DIST = 10;

const WALL = 0;
const ROOM = 1;
const CORRIDOR = 2;
const DOOR = 3;

// ROOM

function roomSize() {
	let w = 2 * GW.random.range(2, 5)
	let h = w + 2 * GW.random.range(-1, 1)
	return [w, h];
}

function cloneRoom(room) {
	return {
		neighbors: room.neighbors.slice(),
		x: room.x,
    y: room.y,
    width: room.width,
    height: room.height,
		right: room.right,
    bottom: room.bottom,
		center: room.center.slice(),
	}
}

function centerRoom(level, radius) {
	const room = {
		neighbors: [],
		center: level.center.slice(),
		x: level.center[0] - radius,
		y: level.center[1] - radius,
    width: radius * 2,
    height: radius * 2,
    right: 0,
    bottom: 0,
	};

  room.right = room.x + room.width - 1;
  room.bottom = room.y + room.height - 1;

  return room;
}

function roomNearTo(x, y) {
	let cx = x + GW.random.range(-DIST, DIST);
	let cy = y + GW.random.range(-DIST, DIST);
	let center = [cx, cy];

	let size = roomSize();

	const room = {
		neighbors: [],
		center,
		x: cx - Math.floor(size[0]/2),
		y: cy - Math.floor(size[1]/2),
    width: size[0],
    height: size[1],
    right: 0,
    bottom: 0,
	};

  room.right = room.x + room.width - 1;
  room.bottom = room.y + room.height - 1;

  return room;
}

function enlargeRoom(room, diff) {
	let clone = cloneRoom(room);
	clone.x -= diff;
	clone.y -= diff;
	clone.bottom += diff;
	clone.right += diff;
  clone.width = clone.right - clone.x + 1;
  clone.height = clone.bottom - clone.y + 1;
	return clone;
}

function furthestRoom(rooms, start) {
	let bestDist = 0;
	let bestRoom = null;

	let visited = [];

	function visit(room, dist) {
		visited.push(room);

		if (dist > bestDist) {
			bestDist = dist;
			bestRoom = room;
		}

		room.neighbors
			.filter(r => !visited.includes(r))
			.forEach(r => visit(r, dist+1));
	}

	visit(start, null, 0);
	return bestRoom;
}

// LEVEL

const D1_RADIUS = 15;
const D2_RADIUS = 30;
const LAST1_RADIUS = 20;
const LAST_RADIUS = 10;

function dangerToRadius(danger) {
	if (danger == 1) { return D1_RADIUS; }
	if (danger == GW.config.LAST_LEVEL) { return LAST_RADIUS; }

	let diff = LAST1_RADIUS-D2_RADIUS;
	let regularCount = GW.config.LAST_LEVEL - 2;
	if (regularCount == 1) { return D2_RADIUS; }

	return D2_RADIUS + Math.round((danger-2)/(regularCount-1) * diff);
}


class Level {
	constructor(danger) {
		this.danger = this.id = danger;
		this.rooms = [];
		this.start = this.end = null;
		this._cells = GW.grid.alloc(80, 80);
    this.center = [40, 40];
    this.width = 80;
    this.height = 80;
	}

	isInside(x, y) {
  	const d = Math.sqrt( (x - this.center[0])**2 + (y - this.center[1])**2);
		return d < dangerToRadius(this.danger);
	}

	isOutside(x, y) {
  	const d = Math.sqrt( (x - this.center[0])**2 + (y - this.center[1])**2);
		return d > dangerToRadius(this.danger) + 1;
	}

	trim() {
		this._cells.forEach( (v, x, y) => {
			if (v && !this.isInside(x, y)) {
      	this._cells[x][y] = 0;
      }
		});
	}

	fits(room) {
		for (let x=room.x; x<=room.right; x++) {
			for (let y=room.y; y<=room.bottom; y++) {
      	if (!this._cells.hasXY(x, y)) {
        	console.log('xy out of range', x, y);
          return false;
        }
				if (this._cells[x][y]) {
        	return false;
        }
			}
		}

		return true;
	}

	setCell(x, y, cell) {
		this._cells[x][y] = cell;
	}

	digRoom(room) {
		this.rooms.push(room);

		for (let x=room.x; x<=room.right; x++) {
			for (let y=room.y; y<=room.bottom; y++) {
				this.setCell(x, y, ROOM);
			}
		}
	}

	digCorridor(xy1, xy2) {
  	let x, y;
		let steps = GW.utils.distanceFromTo(xy1, xy2) + 1;

		for (let i=0; i<=steps; i++) {
			const p = GW.utils.lerpXY(xy1, xy2, i/steps);
			this.setCell(p[0], p[1], CORRIDOR);
		}
	}

  carveMap(map) {
    this._cells.forEach( (v, x, y) => {
      if (!v) {
        map.setTile(x, y, 'WALL');
      }
      else {
        map.setTile(x, y, 'FLOOR');
      }
    });
  }

	carveDoors(map, room, options = {}) {
		options = Object.assign({ doorChance:50 }, options);
		let x, y;

		for (let i=-1; i <= room.width; i++) {
			for (let j=-1; j <= room.height; j++) {
				if (i == -1 && j == -1) continue;
				if (i == -1 && j == room.height) continue;
				if (i == room.width && j == -1) continue;
				if (i == room.width && j == room.height) continue;

				if (i > -1 && i < room.width && j > -1 && j < room.height) continue;

				const x = room.x + i;
        const y = room.y + j;

				if (this._cells[x][y] != CORRIDOR) { continue; }

				if (!GW.random.chance(options.doorChance)) { continue; }
				map.setTile(x, y, 'DOOR');
			}
		}
	}

}


// DECORATE



function decorateBrambles(map, level) {
	let radius = dangerToRadius(level.danger);
	let dist = GW.random.range(2*radius, 5*radius);
	let angle = GW.random.value() * 2 * Math.PI;

	let center = [level.center[0] + Math.floor(dist * Math.cos(angle)), level.center[1] + Math.floor(dist * Math.sin(angle))];
	let da = radius/dist;

	angle += Math.PI;
	dist += (GW.random.value()-0.5)*radius;

	for (let a=angle-da; a<angle+da; a+=.01) {
    const x = center[0] + Math.floor(dist*Math.cos(a));
    const y = center[1] + Math.floor(dist*Math.sin(a));
		// let xy = center.plus(new XY(Math.cos(a), Math.sin(a)).scale(dist)).round();
		if (!level.isInside(x, y)) { continue; }
    const cell = map.cell(x, y);
		if (cell.ground != 'WALL') { continue; }
    if (cell.flags & GW.flags.cell.IMPREGNABLE) { continue; }
		map.setTile(x, y, 'BRAMBLES');
	}
}

function welcomeLast() {
  let msg = [];

  msg.push(["%RCongratulations!", 'gold']);
  msg.push("Welcome to the last floor!");
  msg.push("You managed to reach the princess and finish the game.");

  let gold = GW.data.player.current.gold || 0;
  if (gold) {
    msg.push(['Furthermore, you were able to accumulate a total of %R%d gold coins%R!', 'gold', gold, null]);
  }

  msg.push("The game is over now, but you are free to look around.");
  msg.push("Press <shift+r> to restart the game.");

  GW.message.addLines(msg);
}


function decorateLast(map, level) {

  map.events.welcome = welcomeLast;

	let radius = dangerToRadius(level.danger);

  const start = map.locations.start = map.locations.down = level.rooms[0].center.slice();
	start[0] -= (radius-2);  // move start to left edge

  const princess = map.locations.up = level.rooms[0].center.slice();
  princess[0] += 3;
	map.setTile(princess[0], princess[1], 'PRINCESS');
	map.setTile(princess[0] -1, princess[1] -1, 'PILLAR');
	map.setTile(princess[0] +1, princess[1] -1, 'PILLAR');
	map.setTile(princess[0] -1, princess[1] +1, 'PILLAR');
	map.setTile(princess[0] +1, princess[1] +1, 'PILLAR');

	for (let x = princess[0]-3; x <= princess[0]+3; x++) {
		for (let y = princess[1]-3; y <= princess[1]+3; y++) {
			if (x == princess[0] && y == princess[1]) { continue; }
      const cell = map.cell(x, y);
			if (cell.ground != 'FLOOR') { continue; }

			if (GW.utils.distanceBetween(x, y, princess[0], princess[1]) == 1) { // close heroes
        console.log('Add', 'hero', x, y);
				// let hero = new beings.Hero();
				// hero.ai = ['idle'];
        // map.addActor(x, y, hero);
				continue;
			}

			if (GW.random.chance(50)) { continue; }
			// let hero = new beings.Hero(); // remote heroes
			// hero.moveTo(xy.clone(), level);
      console.log('Add', 'hero', x, y);
		}
	}
}

function welcomeFirst() {
  GW.message.addLines([
    "A truly beautiful day for a heroic action!\nThis tower is surrounded by plains and trees.\nThere might even be a princess sleeping on the last floor.\nApparently the only way to get to her is to advance through all tower levels.",
	  ["To move around, use the %Rarrow keys%R.", 'gold', null],
  ]);
}

function decorateFirst(map, level) {

  map.events.welcome = welcomeFirst;

	let features = ["rat", "potion", "dagger"];
	level.rooms.forEach(room => {
		if (GW.utils.equalsXY(room.center, map.locations.start)) { // first room
			level.carveDoors(map, room, { doorChance:1 });
			return;
		}

		if (GW.utils.equalsXY(room.center, map.locations.up)) {
			level.carveDoors(map, room);
			return;
		}

		level.carveDoors(map, room);
		if (!features.length) { return; }
		let feature = features.shift();
    // console.log('Add', feature, room.center[0], room.center[1]);
		// switch (feature) {
		// 	case "rat":
		// 		let rat = new beings.Rat();
		// 		rat.ai.hostile = false;
		// 		rat.moveTo(room.center.clone(), level);
		// 	break;
    //
		// 	case "potion":
		// 		level.setItem(room.center.clone(), new items.HealthPotion());
		// 	break;
    //
		// 	case "dagger":
		// 		level.setItem(room.center.clone(), new items.Dagger());
		// 	break;
		// }
	});
}

function decorateFull(map, level) {
	decorateBrambles(map, level);

	let features = {
    dagger: 7,
    sword: 6,
    axe: 5,
    mace: 4,
    greatSword: 3,
    shield: 5,
    helmet: 5,
		armor: 10,
		mana: 10,
    health: 10,
		lutefisk: 1,
		gold: 10,
		enemy: 50,
		hero: 10,
		empty: 100,
	}

	level.rooms.forEach(room => {
		level.carveDoors(map, room);
		if ( GW.utils.equalsXY(room.center, map.locations.down)
        || GW.utils.equalsXY(room.center, map.locations.up))
    {
      return;
    }

		for (let i=0; i<2; i++) {
			const x = GW.random.range(room.x, room.right);
			const y = GW.random.range(room.y, room.bottom);
      const cell = map.cell(x, y);
			if (cell.item || cell.actor) { continue; } // wrong place

      let item;
			let feature = GW.random.weighted(features);
      // console.log('Add', feature, x, y);
			switch (feature) {
			// 	case "item": level.setItem(xy, factory.getItem(level.danger)); break;
			// 	case "potion": level.setItem(xy, factory.getPotion()); break;
        case "armor":
          item = GW.make.item('ARMOR');
          break;
        case "shield":
          item = GW.make.item('SHIELD');
          break;
        case "helmet":
          item = GW.make.item('HELMET');
          break;
				case "lutefisk":
          item = GW.make.item('LUTEFISK');
          break;
        case "health":
          item = GW.make.item('POTION_HEALTH');
          break;
        case "mana":
          item = GW.make.item('POTION_MANA');
          break;
				case "gold":
          item = GW.make.item('GOLD');
          break;
			// 	case "enemy": factory.getBeing(level.danger).moveTo(xy, level); break;
			// 	case "hero": new beings.Hero().moveTo(xy, level); break;
			}
      if (item) {
        map.addItemNear(x, y, item);
      }
		}
	});
}

function decorateRegular(map, level) {
  let start;
  let downTile;

  if (level.danger <= 1) {
    start = level.center.slice();
    start[1] += dangerToRadius(level.danger); // move to bottom of tower
    downTile = 'PORTAL';
  }
  else {
    start = [GW.data.player.x, GW.data.player.y];
  }

  const stairOpts = {
    up: true,
    down: start,
    start: 'down',
    downTile,
    minDistance: dangerToRadius(level.danger),
    isValid(cell, x, y, map) {
      const level = map.config.level;
      if (!level.isInside(x - 1, y - 1)) return false;
      if (!level.isInside(x - 1, y + 1)) return false;
      if (!level.isInside(x + 1, y - 1)) return false;
      if (!level.isInside(x + 1, y + 1)) return false;

      return GW.dungeon.isValidStairLoc(cell, x, y, map);
    },
    map
  };
  GW.dungeon.addStairs(stairOpts);

  // If you wanted to place the stairs by hand, you could do something like this:

  // let r1 = furthestRoom(level.rooms, level.rooms[0]);
	// let r2 = furthestRoom(level.rooms, r1);
  // const start = map.locations.start = r1.center;
	// const end = map.locations.end = r2.center;

	// /* staircase up, all non-last levels */
	// map.setTile(end[0], end[1], 'UP_STAIRS');
  // map.locations.up = end;

	/* staircase down, not first/last levels */
	// if (level.danger > 1) {
	// 	map.setTile(start[0], start[1], 'DOWN_STAIRS');
  //   map.locations.down = start;
	// }

	if (level.danger == 1) {
		decorateFirst(map, level);
	} else {
		decorateFull(map, level);
	}

}

function decorate(map, level) {

	if (level.danger == GW.config.LAST_LEVEL) {
		decorateLast(map, level);
	} else {
		decorateRegular(map, level);
	}
  GW.dungeon.finishDoors(map);

}


// GENERATE

function connectHorizontal(level, room1, room2) {
	let min = Math.max(room1.x, room2.x);
	let max = Math.min(room1.right, room2.right);
	let x = GW.random.range(min, max);
	level.digCorridor([x, room1.center[1]], [x, room2.center[1]]);
}

function connectVertical(level, room1, room2) {
	let min = Math.max(room1.y, room2.y);
	let max = Math.min(room1.bottom, room2.bottom);
	let y = GW.random.range(min, max);
	level.digCorridor([room1.center[0], y], [room2.center[0], y]);
}

function connectL(level, room1, room2) {
	let p1 = [room1.center[0], room2.center[1]];
	let p2 = [room2.center[0], room1.center[1]];

	/* pick the one closer to the center */
	let P = (GW.utils.distanceFromTo(level.center, p1) < GW.utils.distanceFromTo(level.center, p2) ? p1 : p2);

	level.digCorridor(room1.center, P);
	level.digCorridor(room2.center, P);
}

function connect(level, room1, room2) {
	room1.neighbors.push(room2);
	room2.neighbors.push(room1);

	let overlapHorizontal = !(room1.x > room2.right || room2.x > room1.right);
	let overlapVertical = !(room1.y > room2.bottom || room2.y > room1.bottom);

	if (overlapHorizontal) {
		connectHorizontal(level, room1, room2);
	} else if (overlapVertical) {
		connectVertical(level, room1, room2);
	} else {
		connectL(level, room1, room2);
	}
}

function generateNextRoom(level) {
	let center = level.center.slice();
	let failed = -1;

	while (failed < 1000) {
		failed++;
		let oldRoom;
		if (level.rooms.length > 0) {
			oldRoom = GW.random.item(level.rooms);
			center = oldRoom.center;
		}

		let newRoom = roomNearTo(center[0], center[1]);
		if (!level.isInside(newRoom.center[0], newRoom.center[1])) { continue; }
		if (!level.fits(enlargeRoom(newRoom, 2))) { continue; }
		level.digRoom(newRoom);

		if (oldRoom) { connect(level, oldRoom, newRoom); }

//		console.log("room #%s after %s failures", level.rooms.length, failed);
		return true;
	}

//	console.log("failed to add after %s failures", failed);
	return false;
}

function connectWithClosest(room, level) {
	const COMPARE = ((r1, r2) => {
  	return GW.utils.distanceFromTo(level.center, r1.center) - GW.utils.distanceFromTo(level.center, r2.center);
  });

	let avail = level.rooms.filter(r => !r.neighbors.includes(room) && r != room);
	avail.sort(COMPARE);
	if (!avail) { return; }

	connect(level, room, avail[0]);
}

function generate(id) {
  let danger = 1;
  if (id) {
    danger = 1 + Math.abs(id);
  }
  const radius = dangerToRadius(danger);
  console.log('generate: id=', id, 'danger=', danger, 'radius=', radius);

	let level = new Level(danger);

	if (danger == GW.config.LAST_LEVEL) {
		let start = centerRoom(level, radius);
		level.digRoom(start);
	} else {
		while (true) {
			let ok = generateNextRoom(level);
			if (!ok) { break; }
		}
		let r1 = furthestRoom(level.rooms, level.rooms[0]);
		let r2 = furthestRoom(level.rooms, r1);
		connectWithClosest(r1, level);
		connectWithClosest(r2, level);
	}

	level.trim();

  const map = GW.make.map(level.width, level.height, { danger, level });
  level.carveMap(map);
	decorate(map, level);
	return map;
}

const NOISE = new SimplexNoise();

GW.viewport.setFilter( (buf, x, y, map) => {
  if (!map || !map.config.level) return;

  const level = map.config.level;
  if (level.isOutside(x, y)) {
    buf.blackOut();

    let entity;
    const noise = NOISE.noise2D(x/20, y/20);
    if (noise < 0) {
      entity = GRASS2;
    } else if (noise < 0.8) {
      entity = GRASS1;
    } else {
      entity = TREE;
    }
    buf.plot(entity.sprite);
  }
});
