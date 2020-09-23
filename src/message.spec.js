
const GW = require('../dist/gw.cjs');
const UTILS = require('../test/utils.js');


describe('Message', () => {

  describe('format', () => {

    test('handles sprintf like stuff', () => {
      const msg = GW.message.format('a %s of %s.', 'test', 'quality');
      expect(msg).toEqual('a test of quality.');

      expect(GW.message.format('%d ducks.', 4)).toEqual('4 ducks.');
      expect(GW.message.format('%i ducks.', 4)).toEqual('4 ducks.');
    });

    test('can add some color', () => {
      const msg = GW.message.format(GW.colors.blue, 'a blue msg.');
      expect(msg).toEqual('\u0019\u0000\u0000\u0064a blue msg.');
    });

    test('can add some color for a word or two', () => {
      const msg = GW.message.format('a %Rblue%R msg.', 'blue', null);
      expect(msg).toEqual('a \u0019\u0000\u0000\u0064blue\u001a msg.');
      expect(GW.message.textlen(msg)).toEqual(11);
      expect(msg.length).toEqual(16);
    });

  });

  describe('splitIntoLines', () => {

    test('will split a string', () => {
      const lines = GW.message.splitIntoLines('This is a very long string of text that talks about nothing, but does it very well.', 20);
      expect(lines).toHaveLength(5);
      expect(lines).toEqual(["This is a very long", "string of text that", "talks about nothing,", "but does it very", "well."]);
    });

    test('will hyphenate long words if necessary', () => {
      const lines = GW.message.splitIntoLines('This is a superextralong string of text that has extremely long alphabetical strings.', 11);
      // console.log(lines.map( (l) => l.length ));
      expect(lines).toHaveLength(9);
      expect(lines).toEqual(["This is a", "superextra-", "long string", "of text", "that has", "extremely", "long", "alphabetic-", "al strings."]);
    });

  });

  describe('add', () => {

    let buffer;

    beforeEach( () => {
      buffer = GW.make.buffer(100, 34);
    });

    test('adds messages when on top', () => {
      GW.message.setup({ x: 20, y: 0, width: 80, height: 4, archive: 30 });
      GW.message.add('a %s %s.', 'good', 'test');
      GW.message.draw(buffer);
      const msg = UTILS.extractBufferText(buffer, 20, 3); // fills in from bottom up when messages are on top
      expect(msg).toEqual('A good test.');
    });

    test('adds messages when on bottom', () => {
      GW.message.setup({ x: 20, y: 30, width: 80, height: 4, archive: 30 });
      GW.message.add('a %s %s.', 'good', 'test');
      GW.message.draw(buffer);
      const msg = UTILS.extractBufferText(buffer, 20, 30); // fills in from top when messages are on bottom
      expect(msg).toEqual('A good test.');
    });

  });

});
