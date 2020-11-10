
import * as GW from './index.js';


describe('GW.ui', () => {

  describe('start', () => {

    test('can have brogue setup (sidebar=left, messages=top, wide=false)', () => {

      GW.ui.start({
        width: 100,
        height: 34,
        sidebar: 20,
        messages: 4,
        flavor: true,

        canvas: false,
        loop: false,
      });

      expect(GW.viewport.bounds.x).toEqual(20);
      expect(GW.viewport.bounds.y).toEqual(5);
      expect(GW.viewport.bounds.width).toEqual(80);
      expect(GW.viewport.bounds.height).toEqual(29);

      expect(GW.message.bounds.x).toEqual(20);
      expect(GW.message.bounds.y).toEqual(0);
      expect(GW.message.bounds.width).toEqual(80);
      expect(GW.message.bounds.height).toEqual(4);

      expect(GW.flavor.bounds.x).toEqual(20);
      expect(GW.flavor.bounds.y).toEqual(4);
      expect(GW.flavor.bounds.width).toEqual(80);
      expect(GW.flavor.bounds.height).toEqual(1);

      expect(GW.sidebar.bounds.x).toEqual(0);
      expect(GW.sidebar.bounds.y).toEqual(0);
      expect(GW.sidebar.bounds.width).toEqual(20);
      expect(GW.sidebar.bounds.height).toEqual(34);

    });

    test('can have escape setup (sidebar=right, messages=bottom, wide=true)', () => {

      GW.ui.start({
        width: 100,
        height: 34,
        sidebar: -20,
        messages: -4,
        flavor: true,
        wideMessages: true,

        canvas: false,
        loop: false,
      });

      expect(GW.viewport.bounds.x).toEqual(0);
      expect(GW.viewport.bounds.y).toEqual(0);
      expect(GW.viewport.bounds.width).toEqual(80);
      expect(GW.viewport.bounds.height).toEqual(29);

      expect(GW.message.bounds.x).toEqual(0);
      expect(GW.message.bounds.y).toEqual(30);
      expect(GW.message.bounds.width).toEqual(100);
      expect(GW.message.bounds.height).toEqual(4);

      expect(GW.flavor.bounds.x).toEqual(0);
      expect(GW.flavor.bounds.y).toEqual(29);
      expect(GW.flavor.bounds.width).toEqual(100);
      expect(GW.flavor.bounds.height).toEqual(1);

      expect(GW.sidebar.bounds.x).toEqual(80);
      expect(GW.sidebar.bounds.y).toEqual(0);
      expect(GW.sidebar.bounds.width).toEqual(20);
      expect(GW.sidebar.bounds.height).toEqual(29);

    });


    test('can have wide message on top setup (sidebar=left, messages=top, wide=true)', () => {

      GW.ui.start({
        width: 100,
        height: 34,
        sidebar: 20,
        messages: 4,
        flavor: true,
        wideMessages: true,

        canvas: false,
        loop: false,
      });

      expect(GW.viewport.bounds.x).toEqual(20);
      expect(GW.viewport.bounds.y).toEqual(5);
      expect(GW.viewport.bounds.width).toEqual(80);
      expect(GW.viewport.bounds.height).toEqual(29);

      expect(GW.message.bounds.x).toEqual(0);
      expect(GW.message.bounds.y).toEqual(0);
      expect(GW.message.bounds.width).toEqual(100);
      expect(GW.message.bounds.height).toEqual(4);

      expect(GW.flavor.bounds.x).toEqual(0);
      expect(GW.flavor.bounds.y).toEqual(4);
      expect(GW.flavor.bounds.width).toEqual(100);
      expect(GW.flavor.bounds.height).toEqual(1);

      expect(GW.sidebar.bounds.x).toEqual(0);
      expect(GW.sidebar.bounds.y).toEqual(5);
      expect(GW.sidebar.bounds.width).toEqual(20);
      expect(GW.sidebar.bounds.height).toEqual(29);

    });
  });
});
