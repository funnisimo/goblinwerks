
import * as GW from './index.js';
import * as UTILS from '../test/utils.js';


describe('Message', () => {

  describe('add', () => {

    let buffer;

    beforeEach( () => {
      buffer = GW.make.buffer(100, 34);
    });

    test('adds messages when on top', () => {
      GW.message.setup({ x: 20, y: 0, width: 80, height: 4, archive: 30 });
      GW.message.add('a §b§ §c§.', { b: 'good', c: 'test' });
      GW.message.draw(buffer);
      const msg = UTILS.extractBufferText(buffer, 20, 3, 12); // fills in from bottom up when messages are on top
      expect(msg).toEqual('A good test.');
    });

    test('adds messages when on bottom', () => {
      GW.message.setup({ x: 20, y: 30, width: 80, height: 4, archive: 30 });
      GW.message.add('a §b§ §c§.', { b: 'good', c: 'test' });
      GW.message.draw(buffer);
      const msg = UTILS.extractBufferText(buffer, 20, 30, 12); // fills in from top when messages are on bottom
      expect(msg).toEqual('A good test.');
    });

  });

});
