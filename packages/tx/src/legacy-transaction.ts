import {
  Address,
  toBuffer,
  addHexPrefix,
  bufferToBigInt,
  bigIntToBuffer,
  unpadBuffer,
  bigIntToUnpaddedBuffer,
  bufArrToArr,
  rlp,
  keccak256hex,
  ecsign,
  bigIntToHex,
  BigIntLike,
} from '@edgematrixjs/util';
import { LegacyTxData } from './types';

export class LegacyTransaction {
  public readonly nonce: bigint;
  public readonly gasPrice: bigint;
  public readonly gasLimit: bigint;
  public readonly to?: Address;
  public readonly value: bigint;
  public readonly data: Buffer;
  public readonly chainId: bigint;

  public readonly v?: bigint;
  public readonly r?: bigint;
  public readonly s?: bigint;

  constructor(txData: LegacyTxData) {
    const { nonce, gasPrice, gasLimit, to, value, data, v, r, s, chainId } = txData;
    const toB = toBuffer(to === '' ? '0x' : to);
    this.nonce = this._toBigIntIfNeed(nonce);
    this.gasPrice = this._toBigIntIfNeed(gasPrice);
    this.gasLimit = this._toBigIntIfNeed(gasLimit);
    this.to = toB.length > 0 ? new Address(toB) : undefined;
    this.value = this._toBigIntIfNeed(value);
    this.data = toBuffer(data === '' ? '0x' : data);
    this.v = this._toBigIntIfNeed(v);
    this.r = this._toBigIntIfNeed(r);
    this.s = this._toBigIntIfNeed(s);
    this.chainId = this._toBigIntIfNeed(chainId);
  }

  _toBigIntIfNeed(x?: BigIntLike) {
    if (typeof x === 'bigint') {
      return x;
    }
    const xB = toBuffer(x === '' ? '0x' : x);
    return xB.length > 0 ? bufferToBigInt(xB) : BigInt(0);
  }

  getChainIdBigInt() {
    return BigInt(this.chainId);
  }

  getMessageArray() {
    const chainId = bigIntToBuffer(this.getChainIdBigInt());
    const e1 = unpadBuffer(toBuffer(0));
    const e2 = unpadBuffer(toBuffer(0));
    const values = [
      bigIntToUnpaddedBuffer(this.nonce),
      bigIntToUnpaddedBuffer(this.gasPrice),
      bigIntToUnpaddedBuffer(this.gasLimit),
      this.to !== undefined ? this.to.buf : Buffer.from([]),
      bigIntToUnpaddedBuffer(this.value),
      this.data,
      chainId,
      e1,
      e2,
    ];
    return values;
  }

  getMessageToSign(hashMessage: false): Buffer[];
  getMessageToSign(hashMessage?: true): Buffer;
  getMessageToSign(hashMessage = true) {
    const message = this.getMessageArray();
    if (hashMessage) {
      const encoded = rlp.encode(bufArrToArr(message));
      const hash = keccak256hex(addHexPrefix(toBuffer(encoded).toString('hex')));
      return toBuffer(hash);
    } else {
      return message;
    }
  }

  _processSignature(v: bigint, r: Buffer, s: Buffer) {
    return new LegacyTransaction({
      nonce: this.nonce,
      gasPrice: this.gasPrice,
      gasLimit: this.gasLimit,
      to: this.to,
      value: this.value,
      data: this.data,
      v: BigInt(v) + this.getChainIdBigInt() * BigInt(2) + BigInt(8),
      r: bufferToBigInt(r),
      s: bufferToBigInt(s),
      chainId: this.chainId,
    });
  }
  /**
   *
   * @param {*} privateKey
   * @returns
   */
  sign(privateKey: Buffer) {
    if (privateKey.length !== 32) {
      throw new Error('Private key must be 32 bytes in length.');
    }
    const msgHash = this.getMessageToSign(true);
    const { v, r, s } = ecsign(msgHash, privateKey);
    const tx = this._processSignature(v, r, s);
    return tx;
  }

  serialize() {
    const raw = this.raw();
    const bufferAry = bufArrToArr(raw);
    return Buffer.from(rlp.encode(bufferAry));
  }

  raw() {
    return [
      bigIntToUnpaddedBuffer(this.nonce),
      bigIntToUnpaddedBuffer(this.gasPrice),
      bigIntToUnpaddedBuffer(this.gasLimit),
      this.to !== undefined ? this.to.buf : Buffer.from([]),
      bigIntToUnpaddedBuffer(this.value),
      this.data,
      this.v !== undefined ? bigIntToUnpaddedBuffer(this.v) : Buffer.from([]),
      this.r !== undefined ? bigIntToUnpaddedBuffer(this.r) : Buffer.from([]),
      this.s !== undefined ? bigIntToUnpaddedBuffer(this.s) : Buffer.from([]),
    ];
  }

  toJSON() {
    return {
      nonce: bigIntToHex(this.nonce),
      gasPrice: bigIntToHex(this.gasPrice),
      gasLimit: bigIntToHex(this.gasLimit),
      to: this.to !== undefined ? this.to.toString() : undefined,
      value: bigIntToHex(this.value),
      data: '0x' + this.data.toString('hex'),
      v: this.v !== void 0 ? String(this.v) : void 0,
      r: this.r !== void 0 ? String(this.r) : void 0,
      s: this.s !== void 0 ? String(this.s) : void 0,
    };
  }
}
