function random(bytes: number) {
  let rnd;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    rnd = window.crypto.getRandomValues(new Uint8Array(bytes));
  } else if (typeof require !== 'undefined') {
    rnd = require('crypto').randomBytes(bytes);
  } else {
    throw new Error('not found crypto');
  }
  let hex = '0x';
  for (let i = 0; i < bytes; ++i) {
    const v = '00' + rnd[i].toString(16);
    hex += v.slice(-2);
  }
  return hex;
}

export { random };
