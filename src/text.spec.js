const GW = require('../dist/gw.cjs');
const UTILS = require('../test/utils.js');


describe('Message', () => {

  describe('format', () => {

    test('handles sprintf like stuff', () => {
      const msg = GW.text.format('a %s of %s.', 'test', 'quality');
      expect(msg).toEqual('a test of quality.');

      expect(GW.text.format('%d ducks.', 4)).toEqual('4 ducks.');
      expect(GW.text.format('%i ducks.', 4)).toEqual('4 ducks.');
    });

    test('can add some color', () => {
      const msg = GW.text.format(GW.colors.blue, 'a blue msg.');
      expect(msg).toEqual('\u0019\u0000\u0000\u0064a blue msg.');
    });

    test('can add some color for a word or two', () => {
      const msg = GW.text.format('a %Rblue%R msg.', 'blue', null);
      expect(msg).toEqual('a \u0019\u0000\u0000\u0064blue\u001a msg.');
      expect(GW.text.length(msg)).toEqual(11);
      expect(msg.length).toEqual(16);
    });

  });

  describe('splitIntoLines', () => {

    test('will split a string', () => {
      const lines = GW.text.splitIntoLines('This is a very long string of text that talks about nothing, but does it very well.', 20);
      expect(lines).toHaveLength(5);
      expect(lines).toEqual(["This is a very long", "string of text that", "talks about nothing,", "but does it very", "well."]);
    });

    test('will hyphenate long words if necessary', () => {
      const lines = GW.text.splitIntoLines('This is a superextralong string of text that has extremely long alphabetical strings.', 11);
      // console.log(lines.map( (l) => l.length ));
      expect(lines).toHaveLength(9);
      expect(lines).toEqual(["This is a", "superextra-", "long string", "of text", "that has", "extremely", "long", "alphabetic-", "al strings."]);
    });

    test('Splitting a line will keep color settings on new line.', () => {
      const text = GW.text.format(GW.colors.blue, 'testing a long message that will need to be split into multiple lines in order%R to be shown on the screen completely.', null);

      const lines = GW.text.splitIntoLines(text, 30);
      expect(lines.length).toEqual(4);
      expect(lines[0].charCodeAt(0)).toEqual(GW.def.COLOR_ESCAPE);
      expect(lines[1].charCodeAt(0)).toEqual(GW.def.COLOR_ESCAPE);
      expect(lines[2].charCodeAt(0)).toEqual(GW.def.COLOR_ESCAPE);
      expect(lines[3].charCodeAt(0)).not.toEqual(GW.def.COLOR_ESCAPE);
    });

    test('split game over', () => {
      const text = GW.text.format(GW.colors.teal, 'You push open the doors and feel the fresh air hit your face.  The relief is palpable, but in the back of your mind you morn for your colleagues who remain inside.');
      const lines = GW.text.splitIntoLines(text, 80);
      expect(lines.length).toEqual(3);
      expect(lines[0].length).toBeLessThan(84); // 80 text + color
      expect(lines[1].length).toBeLessThan(84); // 80 text + color
      expect(lines[2].length).toBeLessThan(84); // 80 text + color
    });

  });
});
