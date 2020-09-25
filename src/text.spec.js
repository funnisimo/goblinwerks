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

    test.todo('Splitting a line will keep color settings on new line.');

  });
});
