
import * as GW from './index.js';


describe('FOV', () => {

  test('will calculate FOV', () => {

    const map = GW.make.map(50, 50);

    map.setTile(20, 25, 'WALL');
    map.setTile(25, 20, 'WALL');

    const grid = GW.grid.alloc(map.width, map.height);

    map.calcFov(grid, 25, 25, 10);

    expect(grid[25][25]).toEqual(1);  // center is always visible
    expect(grid[20][25]).toEqual(1);
    expect(grid[19][25]).toEqual(0);
    expect(grid[25][20]).toEqual(1);
    expect(grid[25][19]).toEqual(0);

    // grid[25][25] = 2;
    // grid.dump();

    expect(grid[25][35]).toEqual(1);  // 10 away

    GW.grid.free(grid);
  });


  describe('tests', () => {
    let map;
    let grid;

    afterEach( () => {
      GW.grid.free(grid);
      GW.fov.debug = GW.utils.NOOP;
    });

    function fillMap(pattern) {
      pattern.forEach( (line, j) => {
        for(let i = 0; i < line.length; ++i) {
          const ch = line[i];
          const tile = (ch == '#' || ch == '+') ? 'WALL' : 'FLOOR';
          map.setTile(i, j, tile);
        }
      });
    }

    function toText() {
      const pattern = [];
      for(let y = 0; y < grid.height; ++y) {
        let row = '';
        for(let x = 0; x < grid.width; ++x) {
          const v = grid[x][y];
          const cell = map.cell(x, y);
          const ch = cell.actor ? '@' : (cell.ground == 'FLOOR' ? '.' : cell.groundTile.sprite.ch);
          row += (v > 0) ? ch : (ch == '#' ? '+' : 's');
        }
        pattern.push(row);
      }
      return pattern;
    }

    function check(expected, actual) {
      expect(actual.length).toEqual(expected.length);
      expect(actual).toEqual(expected);
    }

    function calcFov(expected, opts={}) {
      let x = 0;
      let y = 0;

      for(let j = 0; j < expected.length; ++j) {
        const text = expected[j];
        for(let i = 0; i < text.length; ++i) {
          if (text[i] == '@') {
            x = i;
            y = j;
          }
        }
      }

      let msgs = [];
      if (opts.captureDebug) {
        function capture(...args) {
          msgs.push(GW.text.format(...args));
        }
        GW.fov.debug = capture;
      }
      map.calcFov(grid, x, y, opts.radius);
      if (opts.captureDebug) {
        console.log(msgs.join('\n'));
        GW.fov.debug = GW.utils.NOOP;
      }
    }

    function testFov(text, opts={}) {
      if (opts === true) { opts = { captureDebug: true }; }
      const h = text.length;
      const w = text[0].length;
      map = GW.make.map(w, h, { tile: 'FLOOR' });
      grid = GW.grid.alloc(w, h);

      fillMap(text);
      calcFov(text, opts);
      const actual = toText();
      const expected = text.map( (line) => line.replace('@', '.') );
      check(expected, actual);
    }

    // http://roguebasin.roguelikedevelopment.org/index.php?title=FOV_using_recursive_shadowcasting
    test('does not match roguebasin', () => {

      testFov(['....sssss..s...ss', // '....ssssss.....ss'
               '.....ssss#.s...ss', // '.....ssss#..s..ss'
               '.....ssss#.....ss', // '.....ssss#..s..ss'
               '......ss##..#..##', //
               '.......##........', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '................@']);//
    });

    test('no barriers', () => {
      testFov(['.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '........@........', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................']);//
    });

    test('small range', () => {
      testFov(['sssssssssssssssss', //
               'sssssssssssssssss', //
               'sssssssssssssssss', //
               'sssssssssssssssss', //
               'sssssssssssssssss', //
               'sssssssssssssssss', //
               'ssssss.....ssssss', //
               'sssss.......sssss', //
               'sssss.......sssss', //
               'sssss...@...sssss', //
               'sssss.......sssss', //
               'sssss.......sssss', //
               'ssssss.....ssssss', //
               'sssssssssssssssss', //
               'sssssssssssssssss', //
               'sssssssssssssssss', //
               'sssssssssssssssss'],
               {radius: 3 });//
    });


    test('random barriers', () => {
      testFov(['......sss........sss.', //
               '.......ss.......sss..', //
               '.......ss......sss...', //
               '........s......ss....', //
               's.......s.....ss.....', //
               'sss...........s......', //
               'sss#.....#...#......s', //
               '...#..............sss', //
               '................#....', //
               '.....................', //
               'ssss#.....@..........', //
               '.....................', //
               '..........#..........', //
               '..........s..........', //
               '.........sss.........', //
               '.........sss.........', //
               '.........sss.........', //
               '........sssss........', //
               '........sssss........', //
               '........sssss........', //
               '.......sssssss.......']);//
    });

    test('one wall - vertical', () => {
      testFov(['.......sss.......', //
               '.......sss.......', //
               '.......sss.......', //
               '.......sss.......', //
               '........s........', //
               '........s........', //
               '........s........', //
               '........s........', //
               '........s........', //
               '........#........', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '........@........', //
               '.................']);//

      testFov( ['.......sss.......', //
                '.......sss.......', //
                '.......sss.......', //
                '.......sss.......', //
                '.......sss.......', //
                '.......sss.......', //
                '........s........', //
                '........s........', //
                '........s........', //
                '........s........', //
                '........#........', //
                '.................', //
                '.................', //
                '.................', //
                '.................', //
                '........@........', //
                '.................']);//

      testFov( ['......sssss......', //
                '.......sss.......', //
                '.......sss.......', //
                '.......sss.......', //
                '.......sss.......', //
                '.......sss.......', //
                '.......sss.......', //
                '.......sss.......', //
                '........s........', //
                '........s........', //
                '........s........', //
                '........#........', //
                '.................', //
                '.................', //
                '.................', //
                '........@........', //
                '.................']);//

      testFov( ['......sssss......', //
                '......sssss......', //
                '......sssss......', //
                '......sssss......', //
                '......sssss......', //
                '.......sss.......', //
                '.......sss.......', //
                '.......sss.......', //
                '.......sss.......', //
                '.......sss.......', //
                '........s........', //
                '........s........', //
                '........#........', //
                '.................', //
                '.................', //
                '........@........', //
                '.................']);//

      testFov( ['....sssssssss....', //
                '....sssssssss....', //
                '....sssssssss....', //
                '.....sssssss.....', //
                '.....sssssss.....', //
                '.....sssssss.....', //
                '......sssss......', //
                '......sssss......', //
                '......sssss......', //
                '.......sss.......', //
                '.......sss.......', //
                '.......sss.......', //
                '........s........', //
                '........#........', //
                '.................', //
                '........@........', //
                '.................']);//

      testFov( ['sssssssssssssssss', //
                'sssssssssssssssss', //
                'sssssssssssssssss', //
                'sssssssssssssssss', //
                'sssssssssssssssss', //
                'sssssssssssssssss', //
                'sssssssssssssssss', //
                '.sssssssssssssss.', //
                '..sssssssssssss..', //
                '...sssssssssss...', //
                '....sssssssss....', //
                '.....sssssss.....', //
                '......sssss......', //
                '.......sss.......', //
                '........#........', //
                '........@........', //
                '.................']);//

    });

    test('one wall - horizontal', () => {

      testFov(['.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               'ssss.............', //
               'sssssssss#.....@.', //
               'ssss.............', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................']);//

     testFov(['.................', //
              '.................', //
              '.................', //
              '.................', //
              '.................', //
              '.................', //
              '.................', //
              '.................', //
              'ssssss...........', //
              'ssssssssss#....@.', //
              'ssssss...........', //
              '.................', //
              '.................', //
              '.................', //
              '.................', //
              '.................', //
              '.................']);//

      testFov(['.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               's................', //
               'ssssssss.........', //
               'sssssssssss#...@.', //
               'ssssssss.........', //
               's................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................']);//

       testFov(['.................', //
                '.................', //
                '.................', //
                '.................', //
                '.................', //
                '.................', //
                '.................', //
                'sssss............', //
                'ssssssssss.......', //
                'ssssssssssss#..@.', //
                'ssssssssss.......', //
                'sssss............', //
                '.................', //
                '.................', //
                '.................', //
                '.................', //
                '.................']);//

      testFov(['.................', //
               '.................', //
               '.................', //
               '.................', //
               '.................', //
               'sss..............', //
               'ssssss...........', //
               'sssssssss........', //
               'ssssssssssss.....', //
               'sssssssssssss#.@.', //
               'ssssssssssss.....', //
               'sssssssss........', //
               'ssssss...........', //
               'sss..............', //
               '.................', //
               '.................', //
               '.................']);//


     testFov(['ssssss...........', //
              'sssssss..........', //
              'ssssssss.........', //
              'sssssssss........', //
              'ssssssssss.......', //
              'sssssssssss......', //
              'ssssssssssss.....', //
              'sssssssssssss....', //
              'ssssssssssssss...', //
              'ssssssssssssss#@.', //
              'ssssssssssssss...', //
              'sssssssssssss....', //
              'ssssssssssss.....', //
              'sssssssssss......', //
              'ssssssssss.......', //
              'sssssssss........', //
              'ssssssss.........']);//

    });

    test('door peek scenario', () => {

      testFov(['sssssssssssssssss', //  This is what I do not like:
               'sssssssssssssssss', //
               'sssssssssssssssss', // 'sssssssssssssssss'
               'sssssssssssssssss', // 'sssssssssssssssss'
               'sssssssssssssssss', // 'sssssssssssssssss'
               'sssssssssssssssss', // 'sssssssssssssssss'
               'sssssssssssssssss', // '.ssssssssssssssss'
               'sssssssssssssssss', // '..sssssssssssssss'
               'sssssssssssssssss', // '...ssssssssssssss'
               'sssssssssssssssss', // '....sssssssssssss'
               'sssssssssssssssss', // '.....ssssssssssss'
               'sssssssssssssssss', // '......sssssssssss'
               'sssssssssssssssss', // '.......ssssssssss'
               '....ssssssss#####', // '........ssss#####'
               '.........####....', // '.........####....'
               'sss..............', // '.................'
               'sssssssss#......@']);//'sssssssss#......@'

     testFov(['sssssssssssssssss', //
              'sssssssssssssssss', //
              'sssssssssssssssss', //
              'sssssssssssssssss', //
              'sssssssssssssssss', //
              'sssssssssssssssss', //
              'sssssssssssssssss', //
              'sssssssssssssssss', //
              'sssssssssssssssss', //
              'sssssssssssssssss', //
              'sssssssssssssssss', //
              'sssssssssssssssss', //
              'sssssssssssssssss', //
              '#####ssssssss....', //
              '....####.........', //
              '..............sss', //
              '@......#sssssssss']);//

    });

    test('weird bleed through problem', () => {

      testFov([
          '++##################', // 0
          '++#.............@...',
          '++#.................',
          '++#.................',
          '++#.................',
          '++#.................', // 5
          '++#.................',
          '++#.................',
          '++#.................',
          '++#.................',
          '++#.................', // 10
          '++#.................',
          '++#.................',
          '++####..............', // 13
          '++++s..#...###......',
          '+++s..s.###++#......', // 15
          '+++..sss+++++##....#',
          '+++..s.s++++++#....#', // 17
          '++##s.s+++++++######',
          '++++++++ssssssssssss', // 19
          '++++ss++ssssssssssss',
          '++sssss+ssssssssssss', // 21
          '++sssss+ssssssssssss',
          '++s+ss++ssssssssssss', // 23
          '++++++++++++++++++++',
        ]);

        testFov([
            '++##################', // 0
            '++#.................',
            '++#.................',
            '++#.................',
            '++#.................',
            '++#.................', // 5
            '++#.................',
            '++#.................',
            '++#.................',
            '++#........@........',
            '++#.................', // 10
            '++#.................',
            '++#.................',
            '++####..............', // 13
            '++++s..#...###......',
            '+++s..s.###+++s.....', // 15
            '++#..sss+++++++....#',
            '++#.ss.s+++++++s...#', // 17
            '++#+s.s+++++++++####',
            '++++++++ssssssssssss', // 19
            '++++ss++ssssssssssss',
            '++sssss+ssssssssssss', // 21
            '++sssss+ssssssssssss',
            '++s+ss++ssssssssssss', // 23
            '++++++++++++++++++++',
          ]);
    });

  });


});
