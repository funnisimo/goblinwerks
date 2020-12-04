
import * as GW from './index.js';
import * as UTILS from '../test/utils.js';


describe('GW.table', () => {

  test('simple chain', () => {

    const table = GW.make.table({
      letters: true,  // start row with letter for the row
      headers: true,  // show a header on top of each column
      selectedColor: 'teal',
      color: 'white',
      selected: 0,
    })
    .column('', '§count%2d§')
    .column('Item', '§name%-10s§')
    .column('Each', '§price%4d§');

    const buffer = GW.make.buffer(40, 10);
    const data = { count: 1, name: 'taco', price: 2, next: null };

    table.draw(buffer, 0, 0, data);

    // buffer.dump();

    const width = 3 + 3 + 11 + 5 - 1;
    expect(UTILS.extractBufferText(buffer, 0, 0, width)).toEqual('      Item       Each');
    expect(UTILS.extractBufferText(buffer, 0, 1, width)).toEqual('a)  1 taco          2');
    expect(buffer._data[0][1].fg).toEqual(GW.colors.teal);
  });


  test('simple array', () => {

    const table = GW.make.table({
      letters: true,  // start row with letter for the row
      headers: true,  // show a header on top of each column
      selectedColor: 'teal',
      color: 'white',
      selected: 0,
    })
    .column('', '§count%2d§')
    .column('Item', '§name%-10s§')
    .column('Each', '§price%4d§');

    const buffer = GW.make.buffer(40, 10);
    const data = [{ count: 1, name: 'taco', price: 2 }];

    table.draw(buffer, 0, 0, data);

    // buffer.dump();

    const width = 3 + 3 + 11 + 5 - 1;
    expect(UTILS.extractBufferText(buffer, 0, 0, width)).toEqual('      Item       Each');
    expect(UTILS.extractBufferText(buffer, 0, 1, width)).toEqual('a)  1 taco          2');
    expect(buffer._data[0][1].fg).toEqual(GW.colors.teal);
  });
});
