import { BigIntLike, AddressLike, BufferLike } from '@edgematrixjs/util';

/**
 * Legacy Transaction Data
 */
export type LegacyTxData = {
  /**
   * The transaction's nonce.
   */
  nonce?: BigIntLike;

  /**
   * The transaction's gas price.
   */
  gasPrice?: BigIntLike;

  /**
   * The transaction's gas limit.
   */
  gasLimit?: BigIntLike;

  /**
   * The transaction's the address is sent to.
   */
  to?: AddressLike;

  /**
   * The amount of Ether sent.
   */
  value?: BigIntLike;

  /**
   * This will contain the data of the message or the init of a contract.
   */
  data?: BufferLike;

  /**
   * EC recovery ID.
   */
  v?: BigIntLike;

  /**
   * EC signature parameter.
   */
  r?: BigIntLike;

  /**
   * EC signature parameter.
   */
  s?: BigIntLike;

  chainId: BigIntLike;
};

/**
 * Edge Matrix Transaction Data
 */
export type TxData = {
  subject: Buffer | string;
  application: Buffer | string;
  content: Buffer | string;
  to?: AddressLike;
  /**
   * EC recovery ID.
   */
  v?: BigIntLike;

  /**
   * EC signature parameter.
   */
  r?: BigIntLike;

  /**
   * EC signature parameter.
   */
  s?: BigIntLike;

  chainId: BigIntLike;
};
