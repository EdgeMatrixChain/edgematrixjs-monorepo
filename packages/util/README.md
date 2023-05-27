# @edgematrixjs/util

This project dependencies and exports third-party libraries and provides some methods including generate public and private keys.

## Dependencies and Exports third-party libraries

```json
"@ethereumjs/rlp": "^4.0.1",
"@ethereumjs/util": "^8.0.5",
"ethereum-cryptography": "^1.2.0"
```

```typescript
export { keccak256 } from 'ethereum-cryptography/keccak';
export * from '@ethereumjs/util';
export const rlp = RLP;
```

## INSTALL

`npm install --save @edgematrixjs/util`

## USAGE

```typescript
import { genPrivateKey, addressWith } from '@edgematrixjs/util';
//Generate private and public keys
const privateKey = genPrivateKey();
const publicKey = addressWith(privateKey);
```

## API

`genPrivateKey` - returns a `string` start with `0x`.

`addressWith(privateKey)` - returns a `string` start with `0x`.

The code from [web3-eth-accounts@1.x][web3-eth-accounts]

[web3-eth-accounts]: https://github.com/web3/web3.js/blob/1.x/packages/web3-eth-accounts/src/index.js

