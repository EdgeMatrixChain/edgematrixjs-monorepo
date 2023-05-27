# @edgematrixjs/socket

This project simple wrapper around `WebSocket`;

To provide methods `send,addMessageListener,removeMessageListener` for the `@edgematrixjs/rtc` library;

You can follow this project and to custom wrapper.

## INSTALL

`npm install --save @edgematrixjs/socket`

## USAGE IN `RTC`

```typescript
import { EmSocket } from '@edgematrixjs/socket';
import { RTC } from '@edgematrixjs/rtc';

type CallbackOptions = {
  action: 'OPEN' | 'ERROR' | 'CLOSE' | 'MESSAGE';
  emSocket: EmSocket;
  event: any;
};

type ConnectOptions = {
  network: string;
  callback?: ({ action, event }: CallbackOptions) => void;
};

type ConnectResult = {
  _result: number;
  emSocket: EmSocket;
  event: any;
};

function connect({ network, callback }: ConnectOptions): Promise<ConnectResult> {
  let isInit = false;
  return new Promise((resolve) => {
    const emSocket = new EmSocket({ url: network });
    emSocket.setOpenListener((event: any) => {
      if (!isInit) {
        isInit = true;
        resolve({ _result: 0, emSocket, event });
      } else {
        typeof callback === 'function' && callback({ action: 'OPEN', emSocket, event });
      }
    });
    emSocket.setErrorListener((event: any) => {
      if (!isInit) {
        isInit = true;
        resolve({ _result: 1, emSocket, event });
      } else {
        typeof callback === 'function' && callback({ action: 'ERROR', emSocket, event });
      }
    });
    emSocket.setCloseListener((event: any) => {
      //closed
      typeof callback === 'function' && callback({ action: 'CLOSE', emSocket, event });
    });
    emSocket.addMessageListener((event: any) => {
      //received message evt.data
      typeof callback === 'function' && callback({ action: 'MESSAGE', emSocket, event });
    });
    emSocket.connect();
  });
}

async function initConnect() {
  const network = 'wss://oregon.edgematrix.xyz/edge_ws';
  const callback = ({ action, event }: CallbackOptions) => {
    //something for action
  };
  const { _result, emSocket, event } = await connect({ network, callback });
  return _result === 0 ? emSocket : null;
}

async function subscribeSubject() {
  const emSocket = initConnect();
  if (!emSocket) return;
  const rtc = new RTC({ debug: false });
  const subscribeParams = { subject: '{subject}', application: '{application}', content: '{content}', chainId: 2 };
  const privateKey = '{privatekey}';
  const { _result: subscribeResult } = rtc.subscribe(subscribeParams, privateKey, emSocket);
}

subscribeSubject();
```

## METHODS

`constructor(config?: EmSocketConfig)`

`setOpenListener(fn: Function)` Sets the open listener function.

`removeOpenListener()` Removes the open listener.

`setCloseListener(fn: Function)` Sets the close listener function.

`removeCloseListener()` Removes the close listener.

`setErrorListener(fn: Function)` Sets the error listener function.

`removeErrorListener()` Removes the error listener.

`addMessageListener(fn: Function)` Adds a message listener function.

`removeMessageListener(fn: Function)` Removes a message listener function.

`getClient()` Returns the client.

`send(data: string)` Sends data to the server.

`close()` Closes the connection.

`connect(config?: EmSocketConfig)` Connects to the server.
