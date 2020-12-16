
const diff = require('jest-diff').default;

expect.extend({
  toBeInteger(received) {
    if (typeof received !== 'number') {
      throw new Error('expected value to be a number');
    }

    let success = Math.floor(received) == received;

    return success ? ({
      pass: true,
      message: () => `Expected ${received} not to be an integer`,
    }) : ({
      pass: false,
      message: () => `Expected ${received} to be an integer`,
    });
  },
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

  toBakeFrom(received, expected) {
    const options = {
      comment: 'toBakeFrom',
      isNot: this.isNot,
      promise: this.promise,
    };

    let pass = false;
    let e = expected;

    if (received) {
      let r = received;

      pass = (r[0] >= e[0]) && (r[0] <= e[0] + e[3] + e[4]);
      pass = pass && (r[1] >= e[1]) && (r[1] <= e[1] + e[3] + e[5]);
      pass = pass && (r[2] >= e[2]) && (r[2] <= e[2] + e[3] + e[6]);
    }

    const message = pass
      ? () =>
          this.utils.matcherHint('toBakeFrom', undefined, undefined, options) +
          '\n\n' +
          `Expected: not ${this.utils.printExpected(expected)}\n` +
          `Received: ${this.utils.printReceived(received)}`
      : () => {
          const diffString = diff(expected, received, {
            expand: this.expand,
          });
          return (
            this.utils.matcherHint('toBakeFrom', undefined, undefined, options) +
            '\n\n' +
            (diffString && diffString.includes('- Expect')
              ? `Difference:\n\n${diffString}`
              : `Expected: ${this.utils.printExpected(expected)}\n` +
                `Received: ${this.utils.printReceived(received)}`)
          );
        };

    return {actual: received, message, pass};
  },

  toEqual(received, expected) {
      const options = {
        comment: 'toEqual',
        isNot: this.isNot,
        promise: this.promise,
      };

      let matchType = 'equals';
      let pass = false;
      if (received && received.equals) {
        pass = received.equals(expected);
        // console.log('received.equals', pass, received.toString(true), expected.toString(true));
      }
      else if (expected && expected.equals) {
        pass = expected.equals(received);
        // console.log('expected.equals', pass, received.toString(true), expected.toString(true));
      }
      else {
        matchType = 'deep equals';
        pass = this.equals(received, expected);
        // console.log('this.equals', pass, received.toString(true), expected.toString(true));
      }

      const message = pass
        ? () =>
            this.utils.matcherHint(matchType, undefined, undefined, options) +
            '\n\n' +
            `Expected: not ${this.utils.printExpected(expected)}\n` +
            `Received: ${this.utils.printReceived(received)}`
        : () => {
            const diffString = diff(expected, received, {
              expand: this.expand,
            });
            return (
              this.utils.matcherHint(matchType, undefined, undefined, options) +
              '\n\n' +
              (diffString && diffString.includes('- Expect')
                ? `Difference:\n\n${diffString}`
                : `Expected: ${this.utils.printExpected(expected)}\n` +
                  `Received: ${this.utils.printReceived(received)}`)
            );
          };

      return {actual: received, message, pass};
    },

});
