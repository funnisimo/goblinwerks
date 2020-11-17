
import * as GW from './index.js';

describe('GW.events', () => {

  test('basic event', async () => {
    const listener = jest.fn();
    GW.on('test', listener);
    await GW.emit('test', 1, 2, 3);
    expect(listener).toHaveBeenCalledWith('test', 1, 2, 3);
  });

  test('basic event removing', async () => {
    const listener = jest.fn();
    GW.on('test', listener);
    GW.off('test', listener);
    await GW.emit('test', 1, 2, 3);
    expect(listener).not.toHaveBeenCalled();
  });

  test('multiple calls', async () => {
    const listener = jest.fn();
    GW.on('test', listener);
    await GW.emit('test', 1, 2, 3);
    await GW.emit('test', 1, 2, 3);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  test('once', async () => {
    const listener = jest.fn();
    GW.on('test', listener, undefined, true);
    await GW.emit('test', 1, 2, 3);
    await GW.emit('test', 1, 2, 3);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('multiple listeners', async () => {
    const a = jest.fn();
    GW.on('test', a);

    const b = jest.fn();
    GW.on('test', b);

    const c = jest.fn();
    GW.on('test', c);

    await GW.emit('test', 1, 2, 3);
    await GW.emit('test', 1, 2, 3);
    expect(a).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenCalledTimes(2);
    expect(c).toHaveBeenCalledTimes(2);
  });


  test('multiple listeners, some with once', async () => {
    const a = jest.fn();
    GW.on('test', a);

    const b = jest.fn();
    GW.once('test', b);

    const c = jest.fn();
    GW.on('test', c);

    await GW.emit('test', 1, 2, 3);
    await GW.emit('test', 1, 2, 3);
    expect(a).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenCalledTimes(1);
    expect(c).toHaveBeenCalledTimes(2);
  });

  test('multiple listeners, first with once', async () => {
    const a = jest.fn();
    GW.once('test', a);

    const b = jest.fn();
    GW.on('test', b);

    const c = jest.fn();
    GW.once('test', c);

    await GW.emit('test', 1, 2, 3);
    await GW.emit('test', 1, 2, 3);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
    expect(c).toHaveBeenCalledTimes(1);
  });

  test('multiple async listeners', async () => {
    const a = jest.fn().mockResolvedValue(true);
    GW.on('test', a);

    const b = jest.fn().mockResolvedValue(true);
    GW.on('test', b);

    const c = jest.fn().mockResolvedValue(true);
    GW.on('test', c);

    await GW.emit('test', 1, 2, 3);
    await GW.emit('test', 1, 2, 3);
    expect(a).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenCalledTimes(2);
    expect(c).toHaveBeenCalledTimes(2);
  });
});
