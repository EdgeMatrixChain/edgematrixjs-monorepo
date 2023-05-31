# @edgematrixjs/rtc

This project is built on top of the edgematrixjs-packages and provides commonly used APIs such as "Send Node [Methods]", "Send Message", "Create a Subject", and "Subscribe to a Subject."

It uses "@edgematrixjs/tx" for encoding and signing communication data.

It utilizes "@edgematrixjs/http" for HTTP communication. However, you can also use your own implementation by implementing the `postJSON()` method.

For WebSocket communication, it relies on "@edgematrixjs/socket." You can also use a custom implementation by implementing the `send()`, `removeMessageListener()`, and `addMessageListener()` methods.

## Install

`npm install --save @edgematrixjs/rtc`

## Dependencies

```json
{
  "@edgematrixjs/tx": "^1.0.0",
  "@edgematrixjs/util": "^1.0.0",
  "@edgematrixjs/http": "^1.0.0",
  "@edgematrixjs/socket": "^1.0.0"
}
```

## Example

#### Send Node Api

```typescript
import { Http } from '@edgematrixjs/http';
import { RTC } from '@edgematrixjs/rtc';
const emHttp = new Http({ baseURL: httpsUrl });
const rtc = new RTC();
const path = '/sdapi/v1/txt2img';
const method = 'POST';
const headers: any[] = [];
const body = { prompt: 'cat', width: 80, height: 80 };
const { _result, _desc, data } = await rtc.sendNodeApi(
  { chainId, nodeId, path, method, headers, body },
  privateKey,
  emHttp
);
if (_result !== 0) {
  throw new Error(_desc);
}
//the formatted implementing follow "test/node.spec.tx"
const newData = formatted(data);
const insideResponse = newData.result?.response;
const images = insideResponse?.images || [];
st.equal(images.length, 1, `send node api success`);
```

#### Create Subject

```typescript
import { Http } from '@edgematrixjs/http';
import { RTC } from '@edgematrixjs/rtc';
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
import { EmSocket } from '@edgematrixjs/socket';
import { RTC } from '@edgematrixjs/rtc';
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
import { Http } from '@edgematrixjs/http';
import { RTC } from '@edgematrixjs/rtc';
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

#### `sendNodeApi({ chainId, nodeId, path, method, headers, body }: NodeParameters, privateKey: string, http: Http): Promise<RawTelegramResponse>`

Calling the internal API of the node

- Parameters:
  - NodeParameters: chainId:number, nodeId:number, path:'string', method:'string', headers:[], body,
  - privateKey: The private key used for signing the transaction.
  - http: The Http object for making HTTP requests.
- Returns: RawTelegramResponse {\_result,\_desc?,data}

#### `sendNodeInfo({ chainId, nodeId}: NodeParameters, privateKey: string, http: Http): Promise<RawTelegramResponse>`

Query the "Info" of the node

- Parameters:
  - NodeParameters: chainId:number, nodeId:number
  - privateKey: The private key used for signing the transaction.
  - http: The Http object for making HTTP requests.
- Returns: RawTelegramResponse {\_result,\_desc?,data}

#### `sendNodeIdl({ chainId, nodeId }: NodeParameters, privateKey: string, http: Http): Promise<RawTelegramResponse>`

Query the "IDL" of the node

- Parameters:
  - NodeParameters: chainId:number, nodeId:number
  - privateKey: The private key used for signing the transaction.
  - http: The Http object for making HTTP requests.
- Returns: RawTelegramResponse {\_result,\_desc?,data}

#### `sendNodeEcho({ chainId, nodeId, body }: NodeParameters, privateKey: string, http: Http): Promise<RawTelegramResponse>`

Calling the "echo" of the node

- Parameters:
  - NodeParameters: chainId:number, nodeId:number, body:string,
  - privateKey: The private key used for signing the transaction.
  - http: The Http object for making HTTP requests.
- Returns: RawTelegramResponse {\_result,\_desc?,data}
