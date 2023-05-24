import * as ETHUtils from '@ethereumjs/util';
import { RLP } from '@ethereumjs/rlp';
import { keccak256 } from 'ethereum-cryptography/keccak';
import { random } from './random-bytes';

// import { Buffer } from 'buffer';
// (function (global) {
//   if (global && !global.Buffer) global.Buffer = Buffer;
// })(window);

export function bufferToBigInt(buffer: Buffer) {
  const hex = ETHUtils.bufferToHex(buffer);
  if (hex === '0x') {
    return BigInt(0);
  }
  return BigInt(hex);
}

export function bigIntToBuffer(num: bigint) {
  return ETHUtils.toBuffer('0x' + num.toString(16));
}

export function bigIntToUnpaddedBuffer(num: bigint) {
  return ETHUtils.unpadBuffer(bigIntToBuffer(num));
}

export function bigIntToHex(num: bigint) {
  return '0x' + num.toString(16);
}

export function hexToBuffer(hex: string) {
  const _hex = hex.startsWith('0x') ? hex.substring(2) : hex;
  return Buffer.from(_hex, 'hex');
}

export function hexConcat(a: string, b: string) {
  if (!ETHUtils.isHexString(a) || !ETHUtils.isHexString(b)) {
    throw new Error('The parameters must be hex-string');
  }
  return a.concat(b.slice(2));
}

export function keccak256hex(v: string) {
  if (!ETHUtils.isHexString(v)) {
    throw new Error('The parameters must be hex-string');
  }
  return ETHUtils.addHexPrefix(ETHUtils.toBuffer(keccak256(ETHUtils.toBuffer(v))).toString('hex'));
}

export function genPrivateKey() {
  const innerHex = keccak256hex(hexConcat(random(32), random(32)));
  const middleHex = hexConcat(hexConcat(random(32), innerHex), random(32));
  const outerHex = keccak256hex(middleHex);
  return outerHex;
}

export function addressWith(privateKey: string) {
  const buf = ETHUtils.privateToAddress(hexToBuffer(privateKey));
  return ETHUtils.addHexPrefix(buf.toString('hex'));
}

export * from '@ethereumjs/util';

export const rlp = RLP;

export const randomBytes = random;

