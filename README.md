# EdgeMatrix JS Monorepo

## Packages

| package                        | npm                       | keywords                                         |
| ------------------------------ | ------------------------- | ------------------------------------------------ |
| [@edgematrixjs/util][util]     | [npm package][npm-util]   | `utility` `create private key`                   |
| [@edgematrixjs/tx][tx]         | [npm package][npm-tx]     | `rlp encode` `keccak256 sign `                   |
| [@edgematrixjs/socket][socket] | [npm package][npm-socket] | `websocket`                                      |
| [@edgematrixjs/http][http]     | [npm package][npm-http]   | `http`                                           |
| [@edgematrixjs/rtc][rtc]       | [npm package][npm-rtc]    | `create subject` `scribe subject` `send message` |
| [@edgematrixjs/client][client] | [npm package][npm-client] | `edgematrixjs for browser`                       |

## Basic Usage

## CommonJS and ESmodules

```
npm install --save @edgematrixjs/rtc
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

## Browser

```
<script src="packages/client/dist/bundle.js"></script>
```

```html
<script>
  const privateKey = '0xb22be9c19b61adc1d8e89a1dae0346ed274ac9fa239c06286910c29f9fee59d3';
  const subject = '0x8eeb338239ada22d81ffb7adc995fe31a4d1dc2d701bc8a58fffe5b53e14281e';
  const httpsUrl = 'https://oregon.edgematrix.xyz';
  const wssUrl = 'wss://oregon.edgematrix.xyz/edge_ws';

  window.onload = function () {
    const Http = edgematrixjs.Http;
    const RTC = edgematrixjs.RTC;
    const ws = new edgematrixjs.EmSocket({ url: wssUrl });
    //set open listener
    ws.setOpenListener((event) => {
      const rtc = new RTC();
      const subscribe = { subject: subject, application: 'edge_chat', content: 'subject', chainId: 2 };

      rtc.subscribe(subscribe, privateKey, ws).then((resp) => {
        //send message
        const http = new Http({ baseURL: httpsUrl });
        const messageContent = { data: 'hello' };
        const message = {
          subject: subject,
          application: 'edge_chat',
          chainId: 2,
          content: JSON.stringify(messageContent),
        };
        rtc.sendMessage(message, privateKey, http);
      });
    });

    //set message listener
    ws.addMessageListener((event) => {
      const data = JSON.parse(event.data) || {};
      const params = data.params || {};
      const result = params.result || {};
      const from = result.From;
      const type = result.Type;
      let content = { data: '' };
      try {
        content = JSON.parse(result.Content);
      } catch (e) {}
      console.info(`recerved message `, content);
    });
    //connect socket
    ws.connect();
  };
</script>
```

[npm-util]: https://www.npmjs.com/package/@edgematrixjs/util
[npm-tx]: https://www.npmjs.com/package/@edgematrixjs/tx
[npm-socket]: https://www.npmjs.com/package/@edgematrixjs/socket
[npm-rtc]: https://www.npmjs.com/package/@edgematrixjs/rtc
[npm-http]: https://www.npmjs.com/package/@edgematrixjs/http
[npm-client]: https://www.npmjs.com/package/@edgematrixjs/client
[util]: ./packages/util
[tx]: ./packages/tx
[socket]: ./packages/socket
[rtc]: ./packages/rtc
[http]: ./packages/http
[client]: ./packages/client
