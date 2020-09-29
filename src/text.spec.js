const GW = require('../dist/gw.cjs');
const UTILS = require('../test/utils.js');


describe('Message', () => {

    describe('eachChar', () => {

        test('returns each char in text', () => {
            let result = '';
            const text = 'test';
            GW.text.eachChar(text, (c) => {
                result += c;
            });
            expect(result).toEqual(text);
        });

        test('mixes in colors', () => {
            let result = '';
            let colorCount = 0;
            const text = GW.text.format('test %Rcolor%R.', GW.colors.blue, null);
            GW.text.eachChar(text, (c, color) => {
                result += c;
                if (color) {
                    expect(color.css()).toEqual('#0000ff');
                    ++colorCount;
                }
            });
            expect(result).toEqual('test color.');
            expect(colorCount).toEqual(5);
        });

    });

    describe('length', () => {

        test('works with plain strings', () => {
            expect(GW.text.length('test')).toEqual(4);
        });

        test('works with colors', () => {
            const text = GW.text.format('test %Rcolors%R.', GW.colors.green, null);
            expect(GW.text.length(text)).not.toEqual(text.length);
            expect(GW.text.length(text)).toEqual('test colors.'.length);
        });

    });

    describe('splice', () => {
        test('Splice to add', () => {
            expect(GW.text.splice('test text', 0, 0, 'a real ')).toEqual('a real test text');
            expect(GW.text.splice('test text', 5, 0, 'a real ')).toEqual('test a real text');
            expect(GW.text.splice('test text', 0, 5, 'a real ')).toEqual('a real text');
            expect(GW.text.splice('test text', 5, 4, 'everything')).toEqual('test everything');
        });
    });

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
