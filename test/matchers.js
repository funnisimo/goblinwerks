
expect.extend({
  toBeInRange(received, lo, hi) {
    if (typeof lo !== 'number') {
      throw new Error('expected lo to be a number');
    }
    if (typeof hi !== 'number') {
      throw new Error('expected hi to be a number');
    }
    if (typeof received !== 'number') {
      throw new Error('expected value to be a number');
    }

    let success = (received >= lo && received <= hi);

    return success ? ({
      pass: true,
      message: () => `Expected ${received} not to be in range [${lo}-${hi}]`,
    }) : ({
      pass: false,
      message: () => `Expected ${received} to be in range [${lo}-${hi}]`,
    });
  },
	toBeAtXY(received, x, y) {
    if (typeof x !== 'number') {
      throw new Error('expected x to be a number');
    }
    if (typeof y !== 'number') {
      throw new Error('expected y to be a number');
    }
    if (!received) {
      throw new Error('expected object to be at XY, but received none.');
    }
    if (typeof received.x !== 'number' || typeof received.y !== 'number') {
      throw new Error('expected value to be object with x and y members');
    }

    let success = (received && received.x == x && received.y == y);

		const name = (received && received.info) ? received.info.id : 'object';

    return success ? ({
      pass: true,
      message: () => `Expected ${name} not to be at location ${x},${y}`,
    }) : ({
      pass: false,
      message: () => `Expected ${name} @ ${received.x},${received.y} to be at location ${x},${y}`,
    });
  },
  toFloatEqual(received, expected) {
    if (typeof expected !== 'number') {
      throw new Error('expected must be a number');
    }
    if (typeof received !== 'number') {
      throw new Error('value must be a number');
    }

    const diff = Math.abs(expected - received);

    let success = (diff < 0.00001);

    return success ? ({
      pass: true,
      message: () => `Expected ${received} not to equal ${expected}`,
    }) : ({
      pass: false,
      message: () => `Expected ${received} to equal ${expected}`,
    });
  },
  toEqualColor(received, ...expected) {
    if (expected.length == 1 && Array.isArray(expected[0])) {
      expected = expected[0];
    }
    if (!Array.isArray(expected)) {
      throw new Error('expected must be an array.');
    }
    if (!Array.isArray(received)) {
      throw new Error('value must be a color object.');
    }

    while( expected.length < received.length ) {
      expected.push(0);
    }

    let success = (expected.length == received.length);
    for( let i = 0; i < expected.length && success; ++i) {
      if (expected[i] != received[i]) {
        success = false;
      }
    }

    return success ? ({
      pass: true,
      message: () => `Expected ${received} not to equal ${expected}`,
    }) : ({
      pass: false,
      message: () => `Expected ${received} to equal ${expected}`,
    });
  },

});
