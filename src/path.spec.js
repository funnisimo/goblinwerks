
import * as GW from './index.js';


describe('GW.path', () => {

  let distGrid;
  let costGrid;

  afterEach( () => {
    distGrid = GW.grid.free(distGrid);
    costGrid = GW.grid.free(costGrid);
  });

  test('can scan a grid', () => {
    distGrid = GW.grid.alloc(10, 10);
    costGrid = GW.grid.alloc(10, 10, 1);

    costGrid[3][2] = GW.def.PDS_OBSTRUCTION;
    costGrid[4][2] = GW.def.PDS_OBSTRUCTION;
    costGrid[5][2] = GW.def.PDS_OBSTRUCTION;
    costGrid[6][2] = GW.def.PDS_OBSTRUCTION;

    GW.path.calculateDistances(distGrid, 4, 4, costGrid, true);

    expect(distGrid[4][4]).toEqual(0);
    expect(distGrid[4][5]).toEqual(1);
    expect(distGrid[5][5]).toFloatEqual(1.4142);  // diagonals cost sqrt(2)
    expect(distGrid[4][8]).toEqual(4);
    expect(distGrid[8][4]).toEqual(4);
    expect(distGrid[4][1]).toFloatEqual(6.4142);  // have to go around stuff
    expect(distGrid[4][9]).toEqual(30000);
  });


  test('can calculate a path', () => {
    const map = GW.make.map(10, 10, { tile: 'FLOOR' });
    const player = GW.make.player({ name: 'hero' });

    map.addActor(2, 2, player);

    expect(player.mapToMe).not.toBeDefined();
    player.updateMapToMe();
    expect(player.mapToMe).toBeDefined();
    expect(player.mapToMe.x).toEqual(player.x);
    expect(player.mapToMe.y).toEqual(player.y);

    const path = GW.path.getPath(map, player.mapToMe, 5, 7, player);
    // console.log(path);
    expect(path.length).toEqual(5);

  });


  function makeMap(data, player) {
    const height = data.length + 2;
    const width = data.reduce( (max, line) => Math.max(max, line.length), 0) + 2;

    const map = GW.data.map = GW.make.map(width, height, { floor: 'FLOOR', wall: 'WALL' });
    for(let y = 0; y < data.length; ++y) {
      const line = data[y];
      for(let x = 0; x < line.length; ++x) {
        const ch = line[x];
        if (ch == '#') {
          map.setTile(x+1, y+1, 'WALL');
        }
        else if (ch == '@') {
          map.locations.start = [x+1, y+1];
          map.addActor(x+1, y+1, player)
        }
        else if (ch == 'X') {
          map.locations.end = [x+1,y+1];
        }
        else if (ch == 'A') {
          const actor = GW.make.actor({ name: 'Actor', ch: 'A', fg: 'green' });
          map.addActor(x+1, y+1, actor);
        }
      }
    }
    map.revealAll();
    GW.config.fov = true;
    GW.visibility.update(map, player.x, player.y, 20);
    GW.config.fov = false;
    player.updateMapToMe();
    return map;
  }

  function testResults(data, map, player, path) {
    let success = true;
    if (!path) {
      // look for X and .
      success = !data.some( (line) => line.match(/[\.X]/) );
    }
    else {
      for(let i = 0; i < path.length; ++i) {
        const [x, y] = path[i];
        const ch = data[y-1][x-1];
        if (!('X.'.includes(ch))) success = false;
      }
    }
    if (!success) {
      path = path || [];
      console.log('ACTUAL');
      map.dump();

      console.log('MEMORY');
      map.dump( (c) => c.isVisible() ? c.groundTile.sprite.ch : c.memory.sprite.ch );

      console.log('VISIBLE');
      map.dump( (c) => c.isVisible() ? c.groundTile.sprite.ch : '*');
      player.costGrid.dump();
      player.mapToMe.dump();
      console.log('start', map.locations.start);
      console.log('end', map.locations.end);
      console.log(path);

      let steps = [];
      path.forEach( (step) => {
        steps.push(step + ' : ' + player.mapToMe[step[0]][step[1]]);
      });
      console.log(steps.join('\n'));

      steps = [];
      for(let j = 0; j < data.length; ++j) {
        const line = data[j];
        for(let i = 0; i < line.length; ++i) {
          const ch = line[i];
          if (ch == 'X' || ch == '.') {
            const x = i + 1;
            const y = j + 1;
            const v = player.mapToMe[x][y];
            steps.push([x, y, v]);
          }
        }
      }
      steps.sort( (a, b) => b[2] - a[2]);
      console.log(steps.join('\n'));
    }
    return success;
  }

  function testPath(data) {
    const player = GW.make.player();
    const map = makeMap(data, player);
    const path = GW.path.getPath(map, player.mapToMe, map.locations.end[0], map.locations.end[1], player);
    return testResults(data, map, player, path);
  }

  test('finds correct path', () => {
    const m = [
      '####X   ',
      '####.   ',
      '####.   ',
      '####.   ',
      '####.   ',
      '@....   ',
      '        ',
    ];

    expect(testPath(m)).toBeTruthy();
  });

  test('finds path around actor', () => {
    const m = [
      '####X   ',
      '#### .  ',
      '####A.  ',
      '####.   ',
      '####.   ',
      '@....   ',
      '        ',
    ];

    expect(testPath(m)).toBeTruthy();
  });

  test.only('handles player memory', () => {
    const data = [
      '####X   ',
      '#### .  ',
      '####A.  ',
      '####.   ',
      '####.   ',
      '@....   ',
      '        ',
    ];

    const player = GW.data.player = GW.make.player();
    const map = makeMap(data, player);

    const cell = map.cell(5,3);
    expect(cell.actor).toBeObject();
    expect(cell.actor).not.toBeNull();
    expect(cell.memory.actor).toBe(cell.actor);

    map.moveActor(6,3,cell.actor);
    player.updateMapToMe(true);

    debugger;

    const path = GW.path.getPath(map, player.mapToMe, map.locations.end[0], map.locations.end[1], player);
    expect(testResults(data, map, player, path)).toBeTruthy();
  });


});
