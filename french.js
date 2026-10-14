const units = [
  'zero',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
];

function underOneHundred(number) {
  if (number < 17) return units[number];
  if (number < 20) return `dix-${units[number - 10]}`;

  const tens = Math.floor(number / 10);
  const remainder = number % 10;
  const tensWords = {
    2: 'vingt',
    3: 'trente',
    4: 'quarante',
    5: 'cinquante',
    6: 'soixante',
  };

  if (number < 70) {
    const word = tensWords[tens];
    if (remainder === 0) return word;
    if (remainder === 1) return `${word} et un`;
    return `${word}-${units[remainder]}`;
  }

  if (number < 80) {
    if (number === 71) return 'soixante et onze';
    return `soixante-${underOneHundred(number - 60)}`;
  }

  if (number === 80) return 'quatre-vingts';
  return `quatre-vingt-${underOneHundred(number - 80)}`;
}

function underOneThousand(number) {
  if (number < 100) return underOneHundred(number);

  const hundreds = Math.floor(number / 100);
  const remainder = number % 100;
  const prefix = hundreds === 1 ? 'cent' : `${units[hundreds]} cent`;

  if (remainder === 0) return hundreds === 1 ? prefix : `${prefix}s`;
  return `${prefix} ${underOneHundred(remainder)}`;
}

function numberToFrench(number) {
  if (!Number.isInteger(number) || number < -1000000 || number > 1000000) {
    throw new RangeError('numberToFrench expects an integer between -1,000,000 and 1,000,000');
  }

  if (number < 0) return `moins ${numberToFrench(-number)}`;
  if (number < 1000) return underOneThousand(number);

  const thousands = Math.floor(number / 1000);
  const remainder = number % 1000;
  const prefix = thousands === 1 ? 'mille' : `${underOneThousand(thousands)} mille`;

  if (remainder === 0) return prefix;
  return `${prefix} ${underOneThousand(remainder)}`;
}

module.exports = { numberToFrench };
