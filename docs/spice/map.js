


GW.tile.addKind('SEA',       'FLOOR', { ch: '~', bg: [0,0,40,0,0,10,20,true], name: 'sea', article: 'the' });
GW.tile.addKind('BEACH',     'WALL',  { ch: '.', fg: 'light_brown', bg: 'dark_tan', flags: '!T_OBSTRUCTS_VISION' });
GW.tile.addKind('FOREST',    'WALL',  { ch: '%', fg: 'light_brown', bg: [0,20,0,0,0,20,10], article: false });
GW.tile.addKind('MOUNTAINS', 'WALL',  { ch: '^', fg: 'light_brown', bg: [30,10,0,20], article: 'some' });

function makeMap(id=0) {
  // Start as an empty sea
	const map = GW.make.map(64, 64, { id, tile: 'SEA', boundary: 'MOUNTAINS' });

  // Add Topology (beach, forest, mountains)
  const NOISE = new SimplexNoise(GW.random.number());
  map.forEach( (cell, x, y) => {
    const noise = NOISE.noise2D(x/20, y/20) + NOISE.noise2D(x/5, y/5) + NOISE.noise2D(x/10, y/10);
    // if (noise > 1) {
    //   console.log(x, y, noise.toFixed(2));
    // }
    if (noise > 1.4) {
      map.setTile(x, y, 'MOUNTAINS');
    }
    else if (noise > 1.1) {
      map.setTile(x, y, 'FOREST');
    }
    else if (noise > 1) {
      map.setTile(x, y, 'BEACH');
    }
  });

  // Add Ports
  const ports = Object.values(PORTS);
  const slots = GW.random.sequence(16); // divide the map (64x64) into 16 regions (4x4)
  ports.forEach( (port, i) => {
    const slot = slots.shift();
    const x = (slot % 4) * 16 + 8;
    const y = Math.floor(slot / 4) * 16 + 8;

    const loc = map.matchingXYNear(x, y, (cell, x, y) => {
      if (cell.ground == 'SEA') return false;
      return (map.passableArcCount(x, y) == 1);
    });

    if (!loc) {
      console.error('Failed to place port!', port, x, y);
    }
    else {
      map.setTile(loc[0], loc[1], port.tile);
    }

  });

	return map;
}
