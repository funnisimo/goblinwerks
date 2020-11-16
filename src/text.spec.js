
import * as GW from './index.js';
import * as UTILS from '../test/utils.js';


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
            const text = GW.text.format('test %Fcolor%F.', GW.colors.blue, null);
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
            const text = GW.text.format('test %Fcolors%F.', GW.colors.green, null);
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
      const msg = GW.text.format('a %Fblue%F msg.', 'blue', null);
      expect(msg).toEqual('a \u0019\u0000\u0000\u0064blue\u001a msg.');
      expect(GW.text.length(msg)).toEqual(11);
      expect(msg.length).toEqual(16);
    });

  });

  describe('apply', () => {

    let actor;
    let item;

    beforeEach( () => {
      actor = {
        getName: jest.fn().mockReturnValue('you'),
        getVerb: jest.fn().mockImplementation( (v) => v ),
        getPronoun: jest.fn().mockImplementation( (v) => v ),
      };
      item = {
        getName: jest.fn().mockImplementation( (article) => {
          if (article) return article + ' taco';
          return 'taco';
        }),
      };
    });

    test('can substitute colors', () => {
      const e = GW.text.format('%Fyou%F %Fare%F %Fbeautiful%F.', 'red', null, 'green', null, 'blue', null);
      const a = GW.text.apply('#red#you## #green#are## #blue#beautiful##.');
      expect(a).toEqual(e);
    });

    test('can pass in the color', () => {
      const t = GW.text.apply('#red#$title$##', { title: 'taco', red: 'blue' });
      expect(t).toEqual(GW.text.format('%Ftaco%F', 'blue', null));
    });

    test('can pass in a color object', () => {
      const t = GW.text.apply('#color#$title$##', { title: 'taco', color: GW.colors.blue });
      expect(t).toEqual(GW.text.format('%Ftaco%F', 'blue', null));
    });

    test('can format simple templates', () => {

      const t = GW.text.apply('$you$ $eat$ $the.item$.', { actor, item });
      expect(t).toEqual('you eat the taco.');

      expect(actor.getName).toHaveBeenCalledWith('the');
      expect(actor.getVerb).toHaveBeenCalledWith('eat');
      expect(item.getName).toHaveBeenCalledWith('the');
    });

    test('can do numbers', () => {
      const t = GW.text.apply('$you$ $do$ $damage$ damage.', { actor, damage: 4 });
      expect(t).toEqual('you do 4 damage.');
    });

    test('verb can be special', () => {
      const t = GW.text.apply('$you$ $verb$ for $damage$ damage.', { actor, damage: 4, verb: 'hit' });
      expect(t).toEqual('you hit for 4 damage.');
      expect(actor.getVerb).toHaveBeenCalledWith('hit');
    });

    test('can do pronouns', () => {
      const t = GW.text.apply('$you$ $verb$ $your$ $item$.', { actor, damage: 4, verb: 'eat', item });
      expect(t).toEqual('you eat your taco.');
      expect(actor.getPronoun).toHaveBeenCalledWith('your');
      expect(item.getName).toHaveBeenCalledWith(false);
    });

    test('color with substitutions', () => {
      const t = GW.text.apply('$you$ $verb$ for #red#$damage$## damage.', { actor, damage: 4, verb: 'hit' });
      expect(t).toEqual(GW.text.format('you hit for %F4%F damage.', 'red', null));
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
      const text = GW.text.format(GW.colors.blue, 'testing a long message that will need to be split into multiple lines in order%F to be shown on the screen completely.', null);

      const lines = GW.text.splitIntoLines(text, 30);
      expect(lines.length).toEqual(5);
      expect(lines[0].charCodeAt(0)).toEqual(GW.def.COLOR_ESCAPE);
      expect(lines[1].charCodeAt(0)).toEqual(GW.def.COLOR_ESCAPE);
      expect(lines[2].charCodeAt(0)).toEqual(GW.def.COLOR_ESCAPE);
      expect(lines[3]).toEqual('shown on the screen');
      expect(lines[4]).toEqual('completely.')
    });

    test('split game over', () => {
      const text = GW.text.format(GW.colors.teal, 'You push open the doors and feel the fresh air hit your face.  The relief is palpable, but in the back of your mind you morn for your colleagues who remain inside.');
      const lines = GW.text.splitIntoLines(text, 80);
      expect(lines.length).toEqual(3);
      expect(lines[0].length).toBeLessThan(84); // 80 text + color
      expect(lines[1].length).toBeLessThan(84); // 80 text + color
      expect(lines[2].length).toBeLessThan(84); // 80 text + color
    });

    test('wraps on color ending word correctly', () => {
      const text = GW.text.format('Armor  : %FTempered armor of magical weakness%F', 'red', null);
      expect(text.charCodeAt(9)).toEqual(GW.def.COLOR_ESCAPE);
      expect(text.charCodeAt(10)).toEqual(100);
      expect(text.charCodeAt(11)).toEqual(0);
      expect(text.charCodeAt(12)).toEqual(0);
      const lines = GW.text.splitIntoLines(text, 40, 9);
      expect(lines.length).toEqual(2);
      // console.log(lines);

      expect(lines[1].charCodeAt(0)).toEqual(GW.def.COLOR_ESCAPE);
      expect(lines[1].charCodeAt(1)).toEqual(100);
      expect(lines[1].charCodeAt(2)).toEqual(0);
      expect(lines[1].charCodeAt(3)).toEqual(0);
      expect(lines[1][4]).toEqual('w');
    });

    test('wraps on word with color change correctly', () => {
      const text = GW.text.format('Armor  : %FLeather armor of treachery%F <3%F+#%F>', 'orange', null, 'red', null);
      const lines = GW.text.splitIntoLines(text, 40, 9);
      expect(lines.length).toEqual(2);
      expect(lines[1]).toEqual(GW.text.format('<3%F+#%F>', 'red', null));
    });

    test('push/pop colors', () => {
      const raw = '#yellow#Welcome to Town!\n#dark_purple#Visit our shops to equip yourself for a journey into the #green#Dungeons of Moria##.  Once you are prepared, enter the dungeon and seek the #dark_red#Balrog##.  Destroy him to free us all!\n#white#Press <?> for help.';
      const text = GW.text.apply(raw);
      const lines = GW.text.splitIntoLines(text, 80);
      // console.log(lines);
      expect(lines.length).toEqual(5);
      const purple = GW.text.encodeColor('dark_purple');
      expect(lines[1].substring(4,8)).toEqual(purple);
      expect(lines[2].substring(0,4)).toEqual(purple);
      expect(lines[3].substring(0,4)).toEqual(purple);
      expect(lines[4].substring(0,4)).toEqual(purple);
      expect(lines[4].substring(4,8)).toEqual(GW.text.encodeColor('white'));
    });

  });

  describe('removeColor', () => {
    test('Does nothing to simple text', () => {
      const a = 'tacos';
      expect(GW.text.removeColors(a)).toBe(a);
    });

    test('removes colors at beginning', () => {
      const a = GW.text.format(GW.colors.red, 'tacos');
      expect(a).not.toEqual('tacos');
      expect(GW.text.removeColors(a)).toEqual('tacos');
    });

    test('removes colors in the middle', () => {
      const a = GW.text.format('eat %Ftacos%F today!', 'red', null);
      expect(a).not.toEqual('eat tacos today!');
      expect(GW.text.removeColors(a)).toEqual('eat tacos today!');
    });

    test('removes colors at the end', () => {
      const a = GW.text.format('eat tacos %Ftoday!', 'red');
      expect(a).not.toEqual('eat tacos today!');
      expect(GW.text.removeColors(a)).toEqual('eat tacos today!');
    });
  });

  describe('toPluralNoun', () => {
    test('will remove marker', () => {
      expect(GW.text.toPluralNoun('bowl~ of mush', false)).toEqual('bowl of mush');
    });

    test('will add appropriate plural', () => {
      expect(GW.text.toPluralNoun('bowl~ of mush')).toEqual('bowls of mush');
    });

    test('works without the ~', () => {
      expect(GW.text.toPluralNoun('sword')).toEqual('swords');
      expect(GW.text.toPluralNoun('strawberry')).toEqual('strawberries');
    });
  });

});
