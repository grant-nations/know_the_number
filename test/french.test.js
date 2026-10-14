const test = require('node:test');
const assert = require('node:assert/strict');
const { numberToFrench } = require('../french');

test('formats French number edge cases', () => {
  const cases = {
    '-305': 'moins trois cent cinq',
    0: 'zero',
    17: 'dix-sept',
    21: 'vingt et un',
    71: 'soixante et onze',
    80: 'quatre-vingts',
    81: 'quatre-vingt-un',
    99: 'quatre-vingt-dix-neuf',
    100: 'cent',
    200: 'deux cents',
    201: 'deux cent un',
    999: 'neuf cent quatre-vingt-dix-neuf',
    1000: 'mille',
    2000: 'deux mille',
    10000: 'dix mille',
  };

  for (const [number, expected] of Object.entries(cases)) {
    assert.equal(numberToFrench(Number(number)), expected);
  }
});
