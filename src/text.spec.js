
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
            const text = 'test ΩblueΩcolor∆.';
            GW.text.eachChar(text, (c, color) => {
                result += c;
                if (color) {
                    expect(color).toEqual('blue');
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
            const text = 'test ΩgreenΩcolors∆.';
            expect(GW.text.length(text)).not.toEqual(text.length);
            expect(GW.text.length(text)).toEqual('test colors.'.length);
        });

    });

    describe('splice', () => {
        test('Splice to add', () => {
            expect(GW.text.spliceRaw('test text', 0, 0, 'a real ')).toEqual('a real test text');
            expect(GW.text.spliceRaw('test text', 5, 0, 'a real ')).toEqual('test a real text');
            expect(GW.text.spliceRaw('test text', 0, 5, 'a real ')).toEqual('a real text');
            expect(GW.text.spliceRaw('test text', 5, 4, 'everything')).toEqual('test everything');
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
        toString: jest.fn().mockImplementation( () => 'taco' ),
      };
    });

    test('can pass in the color', () => {
      const t = GW.text.apply('Ω§c§Ω§title§∆', { title: 'taco', c: 'blue' });
      expect(t).toEqual('ΩblueΩtaco∆');
    });

    test('can pass in a color object', () => {
      const t = GW.text.apply('Ω§color§Ω§title§∆', { title: 'taco', color: GW.colors.blue });
      expect(t).toEqual('ΩblueΩtaco∆');
    });

    test('can format simple templates', () => {
      const t = GW.text.apply('§you§ §eat§ §the item§.', { actor, item });
      expect(t).toEqual('you eat the taco.');

      expect(actor.getName).toHaveBeenCalledWith('the');
      expect(actor.getVerb).toHaveBeenCalledWith('eat');
      expect(item.getName).toHaveBeenCalledWith('the');
    });

    test('can do numbers', () => {
      const t = GW.text.apply('§you§ §do§ §damage§ damage.', { actor, damage: 4 });
      expect(t).toEqual('you do 4 damage.');
    });

    test('verb can be special', () => {
      const t = GW.text.apply('§you§ §verb§ for §damage§ damage.', { actor, damage: 4, verb: 'hit' });
      expect(t).toEqual('you hit for 4 damage.');
      expect(actor.getVerb).toHaveBeenCalledWith('hit');
    });

    test('can do pronouns', () => {
      const t = GW.text.apply('§you§ §verb§ §your§ §item§.', { actor, damage: 4, verb: 'eat', item });
      expect(t).toEqual('you eat your taco.');
      expect(actor.getPronoun).toHaveBeenCalledWith('your');
      expect(item.toString).toHaveBeenCalled();
    });

    test('color with substitutions', () => {
      const t = GW.text.apply('§you§ §verb§ for ΩredΩ§damage§∆ damage.', { actor, damage: 4, verb: 'hit' });
      expect(t).toEqual('you hit for ΩredΩ4∆ damage.');
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
      expect(lines).toHaveLength(10);
      expect(lines).toEqual(["This is a", "superex-", "tralong", "string of", "text that", "has", "extremely", "long alpha-", "betical", "strings."]);
    });

    test('Splitting a line will keep color settings on new line.', () => {
      const text = 'ΩblueΩtesting a long message that will need to be split into multiple lines in order∆ to be shown on the screen completely.';

      const lines = GW.text.splitIntoLines(text, 30);
      // console.log(lines);
      expect(lines.length).toEqual(5);
      expect(lines[0].startsWith('ΩblueΩ')).toBeTruthy();
      expect(lines[1].startsWith('ΩblueΩ')).toBeTruthy();
      expect(lines[2].startsWith('ΩblueΩ')).toBeTruthy();
      expect(lines[3]).toEqual('shown on the screen');
      expect(lines[4]).toEqual('completely.')
    });

    test('split game over', () => {
      const text = 'ΩtealΩYou push open the doors and feel the fresh air hit your face.  The relief is palpable, but in the back of your mind you morn for your colleagues who remain inside.';
      const lines = GW.text.splitIntoLines(text, 80);
      expect(lines.length).toEqual(3);
      expect(lines[0].startsWith('ΩtealΩ')).toBeTruthy();
      expect(lines[1].startsWith('ΩtealΩ')).toBeTruthy();
      expect(lines[2].startsWith('ΩtealΩ')).toBeTruthy();
    });

    test('wraps on color ending word correctly', () => {
      const text = 'Armor  : ΩredΩTempered armor of magical weakness∆';
      expect(text.substring(9,14)).toEqual('ΩredΩ');
      const lines = GW.text.splitIntoLines(text, 40, 9);
      expect(lines.length).toEqual(2);
      // console.log(lines);

      expect(lines[1].startsWith('ΩredΩ')).toBeTruthy();
      expect(lines[1][5]).toEqual('w');
    });

    test('wraps on word with color change correctly', () => {
      //            012345678        90123456789012345678901234 567     89 0
      const text = 'Armor  : ΩorangeΩLeather armor of treachery∆ <3ΩredΩ+#∆>';

      // split on 'y'
      let lines = GW.text.splitIntoLines(text, 34, 9);
      // console.log(lines);
      expect(lines.length).toEqual(2);
      expect(lines[1]).toEqual('<3ΩredΩ+#∆>');

      // split on ' '
      lines = GW.text.splitIntoLines(text, 35, 9);
      // console.log(lines);
      expect(lines.length).toEqual(2);
      expect(lines[1]).toEqual('<3ΩredΩ+#∆>');
    });

    test('push/pop colors', () => {
      const raw = 'ΩyellowΩWelcome to Town!∆\nΩdark_purpleΩVisit our shops to equip yourself for a journey into the ΩgreenΩDungeons of Moria∆.  Once you are prepared, enter the dungeon and seek the Ωdark_redΩ#Balrog∆.  Destroy him to free us all!∆\nΩwhiteΩPress <?> for help.';
      const text = GW.text.apply(raw);
      const lines = GW.text.splitIntoLines(text, 80);
      // console.log(lines);
      expect(lines.length).toEqual(5);
      const purple = 'Ωdark_purpleΩ';
      expect(lines[1].substring(0,13)).toEqual(purple);
      expect(lines[2].substring(0,13)).toEqual(purple);
      expect(lines[3].substring(0,13)).toEqual(purple);
      expect(lines[4].substring(0,7)).toEqual('ΩwhiteΩ');
    });

  });

  describe('removeColors', () => {
    test('Does nothing to simple text', () => {
      const a = 'tacos';
      expect(GW.text.removeColors(a)).toBe(a);
    });

    test('removes colors at beginning', () => {
      const a = 'ΩredΩtacos∆';
      expect(a).not.toEqual('tacos');
      expect(GW.text.removeColors(a)).toEqual('tacos');
    });

    test('removes colors in the middle', () => {
      const a = 'eat ΩredΩtacos∆ today!';
      expect(a).not.toEqual('eat tacos today!');
      expect(GW.text.removeColors(a)).toEqual('eat tacos today!');
    });

    test('removes colors at the end', () => {
      const a = 'eat tacos ΩredΩtoday!';
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
      expect(GW.text.toPluralNoun('glass~ of wine')).toEqual('glasses of wine');
    });

    test('works without the ~', () => {
      expect(GW.text.toPluralNoun('sword')).toEqual('swords');
      expect(GW.text.toPluralNoun('strawberry')).toEqual('strawberries');
    });

  });

});
