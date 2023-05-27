# @edgematrixjs/tx

This project provides two transaction classes: Transaction and LegacyTransaction.

These classes are responsible for encoding and hashing messages for communication with EMC using `RLP.encode` and `keccak256`.

They have different signature parameters required.

For more usage examples, please refer to the `test/index.spec.ts`.

Before you start, it is recommended to run the test.

## Referenced

[ethereumjs-monorepo/packages/tx/src/legacyTransaction.ts][git-legacyTransaction]

## Install

`npm install --save @edgematrixjs/tx`

## Test

`npm run test:browser`

`npm run test:node`

## Usage

```typescript
import { Transaction } from '@edgematrixjs/tx';
const transaction = new Transaction({
  subject: subject,
  application: application,
  content: content,
  to: to,
  chainId: chainId,
});
const signed = transaction.sign(hexToBuffer(privateKey));
const serialized = signed.serialize();
const data = addHexPrefix(serialized.toString('hex'));
```

```typescript
import { LegacyTransaction } from '@edgematrixjs/tx';
const transaction = new LegacyTransaction({
  chainId: chainId,
  nonce: telegramCount,
  gasPrice: '0x0',
  gasLimit: '0x0',
  to: '0x0000000000000000000000000000000000003101',
  value: '0x0',
  data: '0x0',
});
const signed = transaction.sign(hexToBuffer(privateKey));
const serialized = signed.serialize();
const data = addHexPrefix(serialized.toString('hex'));
```

[git-legacyTransaction]: https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/tx/src/legacyTransaction.ts
