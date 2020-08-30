
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
    if (!received || typeof received.x !== 'number' || typeof received.y !== 'number') {
      throw new Error('expected value to be object with xLoc and yLoc members');
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
});
