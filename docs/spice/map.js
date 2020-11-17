

const NOISE = new SimplexNoise();

GW.tiles.FLOOR.sprite.ch = '~';
GW.tiles.FLOOR.sprite.bg = GW.make.color(0,0,40,0,0,10,20,true);

GW.tiles.WALL.sprite.ch = '^';
GW.tiles.WALL.sprite.bg = GW.make.color('dark_brown');
GW.tiles.WALL.sprite.fg = GW.make.color('light_brown');

GW.tile.addKind('BEACH',  { Extends: 'WALL', ch: '.', bg: 'dark_tan', flags: '!T_OBSTRUCTS_VISION' });
GW.tile.addKind('FOREST', { Extends: 'WALL', ch: '%', bg: [0,20,0,0,0,20,10] });

function makeMap(id=0) {
	const map = GW.make.map(64, 64, { id, tile: 'FLOOR', boundary: 'WALL' });

  // TODO - Design your map

  map.forEach( (cell, x, y) => {
    const noise = NOISE.noise2D(x/20, y/20) + NOISE.noise2D(x/5, y/5) + NOISE.noise2D(x/10, y/10);
    if (noise > 1) {
      console.log(x, y, noise.toFixed(2));
    }
    if (noise > 1.4) {
      map.setTile(x, y, 'WALL');
    }
    else if (noise > 1.1) {
      map.setTile(x, y, 'FOREST');
    }
    else if (noise > 1) {
      map.setTile(x, y, 'BEACH');
    }

  });

	return map;
}
