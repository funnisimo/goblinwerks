import * as GW from './index.js';


describe('light', () => {

  let light;

  test('will create lights', () => {
    light = GW.make.light({ color: 'blue', radius: 3, fadeTo: 50 });
    expect(light.color).toEqual(GW.colors.blue);
    expect(light.radius).toMatchObject({ clumps: 1, hi: 3, lo: 3 });
    expect(light.fadeTo).toEqual(50);
    expect(light.passThroughActors).toBeFalsy();

    light = GW.make.light('blue', 3, 50);
    expect(light.color).toEqual(GW.colors.blue);
    expect(light.radius).toMatchObject({ clumps: 1, hi: 3, lo: 3 });
    expect(light.fadeTo).toEqual(50);
    expect(light.passThroughActors).toBeFalsy();

    light = GW.make.light(['blue', 3, 50]);
    expect(light.color).toEqual(GW.colors.blue);
    expect(light.radius).toMatchObject({ clumps: 1, hi: 3, lo: 3 });
    expect(light.fadeTo).toEqual(50);
    expect(light.passThroughActors).toEqual(false);

    light = GW.make.light('blue, 3, 50, true');
    expect(light.color).toEqual(GW.colors.blue);
    expect(light.radius).toMatchObject({ clumps: 1, hi: 3, lo: 3 });
    expect(light.fadeTo).toEqual(50);
    expect(light.passThroughActors).toBeTruthy();

    light = GW.make.light('blue, 3, 50, false');
    expect(light.color).toEqual(GW.colors.blue);
    expect(light.radius).toMatchObject({ clumps: 1, hi: 3, lo: 3 });
    expect(light.fadeTo).toEqual(50);
    expect(light.passThroughActors).toBe(false);

  });

  test('can add light kinds', () => {

    light = GW.light.addKind('TEST', { color: 'blue', radius: 3, fadeTo: 50 });
    expect(light).toBe(GW.lights.TEST);
    expect(light.id).toEqual('TEST');
    expect(light.color).toEqual(GW.colors.blue);
    expect(light.radius).toMatchObject({ clumps: 1, hi: 3, lo: 3 });
    expect(light.fadeTo).toEqual(50);
    expect(light.passThroughActors).toBeFalsy();

    light = GW.light.addKind('TEST2', 'blue', 3, 50);
    expect(light).toBe(GW.lights.TEST2);
    expect(light.id).toEqual('TEST2');
    expect(light.color).toEqual(GW.colors.blue);
    expect(light.radius).toMatchObject({ clumps: 1, hi: 3, lo: 3 });
    expect(light.fadeTo).toEqual(50);
    expect(light.passThroughActors).toBeFalsy();

    light = GW.light.addKind('TEST3', 'blue, 3, 50');
    expect(light).toBe(GW.lights.TEST3);
    expect(light.id).toEqual('TEST3');
    expect(light.color).toEqual(GW.colors.blue);
    expect(light.radius).toMatchObject({ clumps: 1, hi: 3, lo: 3 });
    expect(light.fadeTo).toEqual(50);
    expect(light.passThroughActors).toBeFalsy();

  });

  describe('updateLighting', () => {
    let map;
    let cell;

    beforeEach( () => {
      map = GW.make.map(20, 20, 'FLOOR', 'WALL');
    });

    test('defaults to having white light', () => {
      expect(map.flags & GW.flags.map.MAP_STABLE_GLOW_LIGHTS).toBeTruthy();
      expect(map.flags & GW.flags.map.MAP_STABLE_LIGHTS).toBeTruthy();
      map.eachCell( (cell) => {
        expect(cell.light).toEqual([100,100,100]);
        expect(cell.flags & GW.flags.cell.IS_IN_SHADOW).toBeTruthy();
        expect(cell.flags & GW.flags.cell.CELL_LIT).toBeFalsy();
        expect(cell.flags & GW.flags.cell.CELL_DARK).toBeFalsy();
        expect(cell.flags & GW.flags.cell.LIGHT_CHANGED).toBeFalsy();
      });

    });

    test('will return to default from stable glow lights', () => {
      map.flags &= ~GW.flags.map.MAP_STABLE_LIGHTS;
      expect(map.flags & GW.flags.map.MAP_STABLE_GLOW_LIGHTS).toBeTruthy();
      GW.light.updateLighting(map);

      expect(map.flags & GW.flags.map.MAP_STABLE_GLOW_LIGHTS).toBeTruthy();
      expect(map.flags & GW.flags.map.MAP_STABLE_LIGHTS).toBeTruthy();
      map.eachCell( (cell) => {
        expect(cell.light).toEqual([100,100,100]);
        expect(cell.flags & GW.flags.cell.IS_IN_SHADOW).toBeTruthy();
        expect(cell.flags & GW.flags.cell.CELL_LIT).toBeFalsy();
        expect(cell.flags & GW.flags.cell.CELL_DARK).toBeFalsy();
        expect(cell.flags & GW.flags.cell.LIGHT_CHANGED).toBeFalsy();
      });
    });

    test('will set ambient light', () => {
      expect(map.ambientLight).toBeNull();

      map.ambientLight = GW.colors.blue;
      map.flags &= ~GW.flags.map.MAP_STABLE_LIGHTS;

      // stable glow lights will keep ambient light change from taking hold
      expect(map.flags & GW.flags.map.MAP_STABLE_GLOW_LIGHTS).toBeTruthy();
      GW.light.updateLighting(map);

      map.eachCell( (cell) => {
        expect(cell.light).toEqual([100,100,100]);
      });

      map.flags &= ~(GW.flags.map.MAP_STABLE_LIGHTS | GW.flags.map.MAP_STABLE_GLOW_LIGHTS);
      GW.light.updateLighting(map);

      map.eachCell( (cell) => {
        expect(cell.light).toEqual([0,0,100]);
      });

    });

    test('will add lights from tiles', () => {

      GW.light.addKind('TORCH', { color: 'yellow', radius: 3, fadeTo: 50 });
      GW.tile.addKind('WALL_TORCH', {
        name: 'wall with a torch',
        light: 'TORCH',
        flags: 'T_OBSTRUCTS_EVERYTHING'
      });

      expect(map.flags & GW.flags.map.MAP_STABLE_LIGHTS).toBeTruthy();
      expect(map.flags & GW.flags.map.MAP_STABLE_GLOW_LIGHTS).toBeTruthy();
      map.setTile(10, 10, 'WALL_TORCH');

      expect(map.ambientLight).toBeNull();
      expect(map.flags & GW.flags.map.MAP_STABLE_LIGHTS).toBeFalsy();
      expect(map.flags & GW.flags.map.MAP_STABLE_GLOW_LIGHTS).toBeFalsy();

      GW.light.updateLighting(map);

      cell = map.cell(1, 1);
      expect(cell.light).toEqual([0,0,0]);

      cell = map.cell(10, 10);
      expect(cell.light).toEqual([100,100,0]);

    });


    test('will add lights from tiles to ambient light', () => {

      GW.light.addKind('TORCH', { color: 'yellow', radius: 3, fadeTo: 50 });
      GW.tile.addKind('WALL_TORCH', {
        name: 'wall with a torch',
        light: 'TORCH',
        flags: 'T_OBSTRUCTS_EVERYTHING'
      });

      map.ambientLight = GW.make.color(0x202020);
      expect(map.flags & GW.flags.map.MAP_STABLE_LIGHTS).toBeTruthy();
      expect(map.flags & GW.flags.map.MAP_STABLE_GLOW_LIGHTS).toBeTruthy();
      map.setTile(10, 10, 'WALL_TORCH');

      expect(map.ambientLight.css()).toEqual('#1f1f1f');
      expect(map.flags & GW.flags.map.MAP_STABLE_LIGHTS).toBeFalsy();
      expect(map.flags & GW.flags.map.MAP_STABLE_GLOW_LIGHTS).toBeFalsy();

      GW.light.updateLighting(map);

      cell = map.cell(1, 1);
      expect(cell.light).toEqual([12,12,12]); // ambient only

      cell = map.cell(10, 10);
      expect(cell.light).toEqual([112,112,12]); // ambient + 100% light

      cell = map.cell(9, 10);
      expect(cell.light).toEqual([95,95,12]); // ambient + 87% light

      cell = map.cell(8, 10);
      expect(cell.light).toEqual([78,78,12]); // ambient + 64% light

      cell = map.cell(7, 10);
      expect(cell.light).toEqual([62,62,12]); // ambient + 50% light

      cell = map.cell(6, 10);
      expect(cell.light).toEqual([12,12,12]); // ambient + 0% light

    });

    test('will handle static lights', () => {

      GW.light.addKind('TORCH', { color: 'yellow', radius: 3, fadeTo: 50 });
      expect(map.flags & GW.flags.map.MAP_STABLE_LIGHTS).toBeTruthy();
      expect(map.flags & GW.flags.map.MAP_STABLE_GLOW_LIGHTS).toBeTruthy();

      map.ambientLight = GW.make.color(0x202020);
      map.addLight(10, 10, 'TORCH');
      expect(map.flags & GW.flags.map.MAP_STABLE_LIGHTS).toBeFalsy();
      expect(map.flags & GW.flags.map.MAP_STABLE_GLOW_LIGHTS).toBeFalsy();

      GW.light.updateLighting(map);

      cell = map.cell(1, 1);
      expect(cell.light).toEqual([12,12,12]); // ambient only

      cell = map.cell(10, 10);
      expect(cell.light).toEqual([112,112,12]); // ambient + 100% light

      cell = map.cell(9, 10);
      expect(cell.light).toEqual([95,95,12]); // ambient + 87% light

      cell = map.cell(8, 10);
      expect(cell.light).toEqual([78,78,12]); // ambient + 64% light

      cell = map.cell(7, 10);
      expect(cell.light).toEqual([62,62,12]); // ambient + 50% light

      cell = map.cell(6, 10);
      expect(cell.light).toEqual([12,12,12]); // ambient + 0% light

    });

  });

});
