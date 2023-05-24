import { Address, padToEven, stripHexPrefix, toBuffer, addHexPrefix, bufferToBigInt, bigIntToBuffer, unpadBuffer, bigIntToUnpaddedBuffer, bufArrToArr, rlp, ecsign, bigIntToHex, BigIntLike, zeros } from '@edgematrixjs/util';
import { keccak256 } from 'ethereum-cryptography/keccak';
import { TxData } from './types';
export class Transaction {
  //string buffer
  public readonly subject: Buffer;
  public readonly application: Buffer;
  public readonly content: Buffer;
  public readonly to?: Address;
  public readonly chainId: bigint;

  public readonly v?: bigint;
  public readonly r?: bigint;
  public readonly s?: bigint;

  constructor(data: TxData) {
    const { subject, application, content, to, v, r, s, chainId } = data;
    const vSubject = typeof subject === 'string' ? '0x' + padToEven(stripHexPrefix(subject)) : subject;
    const toB = toBuffer(to === '' ? '0x' : to);
    this.subject = Buffer.from(vSubject);
    this.application = Buffer.from(application);
    this.content = Buffer.from(content);
    this.to = toB.length > 0 ? new Address(toB) : new Address(zeros(20));
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

  getMessageArray() {
    const chainId = bigIntToBuffer(this.chainId);
    const e1 = unpadBuffer(toBuffer(0));
    const e2 = unpadBuffer(toBuffer(0));
    const to = this.to !== undefined ? this.to.buf : Buffer.from([]);
    const values = [this.subject, this.application, this.content, to, chainId, e1, e2];
    return values;
  }
  getMessageToSign(hashMessage: false): Buffer[];
  getMessageToSign(hashMessage?: true): Buffer;
  getMessageToSign(hashMessage = true) {
    const message = this.getMessageArray();
    if (hashMessage) {
      const uint8Array = bufArrToArr(message);
      const encoded = rlp.encode(uint8Array);
      return toBuffer(keccak256(encoded));
    } else {
      return message;
    }
  }

  _processSignature(v: bigint, r: Buffer, s: Buffer) {
    return new Transaction({
      subject: this.subject,
      application: this.application,
      content: this.content,
      to: this.to,
      v: BigInt(v) + this.chainId * BigInt(2) + BigInt(8),
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
    return toBuffer(rlp.encode(bufferAry));
  }

  raw() {
    return [
      this.subject,
      this.application,
      this.content,
      this.to !== undefined ? this.to.buf : Buffer.from([]),
      this.v !== undefined ? bigIntToUnpaddedBuffer(this.v) : toBuffer([]),
      this.r !== undefined ? bigIntToUnpaddedBuffer(this.r) : toBuffer([]),
      this.s !== undefined ? bigIntToUnpaddedBuffer(this.s) : toBuffer([]),
    ];
  }

  toJSON() {
    return {
      subject: this.subject.toString(),
      application: this.application.toString(),
      content: this.content.toString(),
      to: this.to !== undefined ? this.to.toString() : undefined,
      v: this.v !== void 0 ? String(this.v) : void 0,
      r: this.r !== void 0 ? String(this.r) : void 0,
      s: this.s !== void 0 ? String(this.s) : void 0,
    };
  }
}
