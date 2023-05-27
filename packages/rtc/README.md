# @edgematrixjs/rtc

This project is built on top of the edgematrixjs-packages and provides commonly used APIs such as "Send Message," "Create a Subject," and "Subscribe to a Subject."

It uses "@edgematrixjs/tx" for encoding and signing communication data.

It utilizes "@edgematrixjs/http" for HTTP communication. However, you can also use your own implementation by implementing the `postJSON()` method.

For WebSocket communication, it relies on "@edgematrixjs/socket." You can also use a custom implementation by implementing the `send()`, `removeMessageListener()`, and `addMessageListener()` methods.

## Install

`npm install @edgematrixjs/rtc`

## Example

#### Create Subject

```typescript
const chatId = 2;
const privateKey = '';
const httpsUrl = 'https://oregon.edgematrix.xyz';
const emHttp = new Http({ baseURL: httpsUrl });
const rtc = new RTC();
const { _result, hash } = await rtc.createSubject(chainId, privateKey, emHttp);
//_result === 0 is success, the 'hash' is subject
```

#### Subscribe Subject

```typescript
//connect method implement follow in test/index.spec.ts
const wssUrl = 'wss://oregon.edgematrix.xyz/edge_ws';
const handleAction = ({ action, event }) => {};
const { _result: _socketResult, emSocket, event } = await connect({ network: wssUrl, callback: handleAction });
if (_socketResult !== 0) {
  throw new Error('socket is error');
}
const rtc = new RTC();
const chatId = 2;
const application = 'edge_chat';
const subject = 'Your Subject';
const content = 'Your Content';
const params = { subject, application, content, chainId };
const { _result } = await rtc.subscribe(params, privateKey, emSocket);
//_result === 0 is success
```

#### Send Message

```typescript
const httpsUrl = 'https://oregon.edgematrix.xyz';
const emHttp = new Http({ baseURL: httpsUrl });
const rtc = new RTC();
const params = {
  subject: globalSubject,
  application: 'edge_chat',
  content: JSON.stringify({ data: 'test send message' }),
  //When the "To" parameter is empty, everyone who subscribed to the subject will receive your message
  //to?: {TargetPublicKey},
  chainId,
};
const { _result } = await rtc.sendMessage(params, privateKey, emHttp);
//_result === 0 is success
```

The more used in test/index.spec.ts

```command
npm run test:node
or
npm run test:browser
```

## API

#### `constructor(config?: RTCConfig)`

Initializes the RTC object with an optional configuration object.

#### `subscribe(params: SubscribeParams, privateKey: string, emSocket: EmSocket): Promise<CreateSubjectResp>`

Subscribes to a subject for real-time communication.

- Parameters:
  - params: An object containing the subject, content, application, and chainId.
  - privateKey: The private key used for signing the transaction.
  - emSocket: The EmSocket object for communication.
- Returns: A promise that resolves with the response containing the result and hash of the subscription.

#### `sendSocketMessage(params: SubscribeParams, privateKey: string, emSocket: EmSocket)`

Sends a message using the socket.

- Parameters:
  - params: An object containing the subject, content, application, and chainId.
  - privateKey: The private key used for signing the transaction.
  - emSocket: The EmSocket object for communication.

#### `createSubject(chainId: number, privateKey: string, http: Http): Promise<any>`

Creates a new subject for real-time communication.

- Parameters:
  - chainId: The chain ID.
  - privateKey: The private key used for signing the transaction.
  - http: The Http object for making HTTP requests.
- Returns: A promise that resolves with the response containing the result and data of the subject creation.

#### `getTelegramCount(chainId: number, privateKey: string, http: Http): Promise<any>`

Retrieves the telegram count for a given chain and address.

- Parameters:
  - chainId: The chain ID.
  - privateKey: The private key used for signing the transaction.
  - http: The Http object for making HTTP requests.
- Returns: A promise that resolves with the response containing the result and nonce.

#### `getTelegramReceipt(hash: string, http: Http): Promise<any>`

Retrieves the receipt of a telegram message.

- Parameters:
  - hash: The hash of the telegram message.
  - http: The Http object for making HTTP requests.
- Returns: A promise that resolves with the response containing the result, hash, and data of the telegram receipt.

#### `sendMessage(messageParams: MessageParams, privateKey: string, http: Http): Promise<any>`

Sends a message using HTTP.

- Parameters:
  - messageParams: An object containing the subject, content, to, application, and chainId.
  - privateKey: The private key used for signing the transaction.
  - http: The Http object for making HTTP requests.
- Returns: A promise that resolves with the response containing the result of the message sending.

### Test Result

```
# rtc
# query telegram count
ok 1 query telegram count is 0x26
# create subject
ok 2 create subject is 0xe8ee349147655b2a6d74148dc5b1c6e1b042d256655f6f0f829336cccab170c3
# query telegram receipt
ok 3 query subject receipt have correct
# subscribe
igonre message, because [event.data.params] is empty! {"jsonrpc":"2.0","id":1,"result":"f88a789b-6352-4e8e-bf19-236d24090dfe"}
received [subscribe message] in subject [0xe8ee349147655b2a6d74148dc5b1c6e1b042d256655f6f0f829336cccab170c3], from is [0x34A582824d4232480715d668771EE7Ab37A17a91], to is [0x0000000000000000000000000000000000000000], message is [subject]
ok 4 subscribe have correct
# send message
ok 5 send message have correct
received [ordinary message] in subject [0xe8ee349147655b2a6d74148dc5b1c6e1b042d256655f6f0f829336cccab170c3], from is [0x34A582824d4232480715d668771EE7Ab37A17a91], to is [0x0000000000000000000000000000000000000000], message is [test send message]

1..5
# tests 5
# pass  5

# ok
```
