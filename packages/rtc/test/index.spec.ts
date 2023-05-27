import * as tape from 'tape';
import { Http } from '@edgematrixjs/http';
import { EmSocket } from '@edgematrixjs/socket';
import { addressWith, zeroAddress, toChecksumAddress } from '@edgematrixjs/util';
import { RTC } from '../src';

const httpsUrl = 'https://oregon.edgematrix.xyz';
const wssUrl = 'wss://oregon.edgematrix.xyz/edge_ws';
const privateKey = '0x1fcfc42862c2af94c0e14ae2385b5796c93a8ebd716d42e04cd58bbb2fa9a1e2';
const publicKey = toChecksumAddress(addressWith(privateKey));
// 0x57397be2edfc3af7e3d9a3455ae80a58425cb767
const chainId = 2;

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
// {
//   jsonrpc: '2.0',
//   method: 'edge_subscription',
//   params: {
//     subscription: '5378ae5a-097d-4bb7-8ef8-24e0ca44314f',
//     result: {
//       Subject: '0x5129491448997931048e38400da2ff008f8dabb8783fb8aca906673bd42e6a14',
//       Application: 'edge_chat',
//       Content: 'subject',
//       V: 40,
//       R: 71399569600831993216401225023941511463537678048112518206642537937182569037104,
//       S: 37771237772835637475645736978295111342831148648737313502357141259120507349373,
//       Hash: '0x0f3cecc272cb4513b8e05689cd5fed708af8b499798a3fa0f401093868cf1115',
//       From: '0x34A582824d4232480715d668771EE7Ab37A17a91',
//       To: '0x0000000000000000000000000000000000000000',
//       Type: 2,
//     },
//   },
// };

type MESSAGE_ORDINARY = 0;
type MESSAGE_SUBCRIBE = 2;
type hexString = string;

type EMCSocketMessageParams = {
  subscription: string;
  result: {
    Subject: string;
    Application: string;
    Content: string; //message
    V: BigInt;
    R: BigInt;
    S: BigInt;
    Hash: hexString; //hexString
    From: hexString; //hexString
    To: hexString; //hexString
    Type: MESSAGE_ORDINARY | MESSAGE_SUBCRIBE;
  };
};

type EMCSocketMessage = {
  jsonrpc: string;
  method: string;
  params: EMCSocketMessageParams;
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

tape('rtc', function (t) {
  let telegramCount = '';
  let globalSubject = '';

  t.test('query telegram count', async function (st) {
    const emHttp = new Http({ baseURL: httpsUrl });
    const rtc = new RTC();
    const { _result, _desc, data } = await rtc.getTelegramCount(privateKey, emHttp);
    if (_result === 0) {
      telegramCount = data;
    }
    st.equal(_result, 0, `query telegram count is ${data}`);
    st.end();
  });

  t.test('create subject', async function (st) {
    const emHttp = new Http({ baseURL: httpsUrl });
    const rtc = new RTC();
    const { _result, hash } = await rtc.createSubject(chainId, privateKey, emHttp);
    if (_result === 0) {
      globalSubject = hash;
    }
    st.equal(_result, 0, `create subject is ${hash}`);
    st.end();
  });

  t.test('query telegram receipt', async function (st) {
    if (!globalSubject) {
      throw new Error('global subject is empty');
    }
    const emHttp = new Http({ baseURL: httpsUrl });
    const rtc = new RTC();
    const resp = await rtc.getTelegramReceipt(globalSubject, emHttp);
    st.equal(resp._result, 0, 'query subject receipt have correct');
    st.end();
  });

  t.test('subscribe', async function (st) {
    if (!globalSubject) {
      throw new Error('global subject is empty');
    }
    const handleAction = ({ action, event }: CallbackOptions) => {
      switch (action) {
        case 'OPEN':
          //handle something
          break;
        case 'ERROR':
          //handle something
          break;
        case 'CLOSE':
          //handle something
          break;
        case 'MESSAGE':
          // event.data like this
          // {
          //   jsonrpc: '2.0',
          //   method: 'edge_subscription',
          //   params: {
          //     subscription: '5378ae5a-097d-4bb7-8ef8-24e0ca44314f',
          //     result: {
          //       Subject: '0x5129491448997931048e38400da2ff008f8dabb8783fb8aca906673bd42e6a14',
          //       Application: 'edge_chat',
          //       Content: 'subject',
          //       V: 40,
          //       R: 71399569600831993216401225023941511463537678048112518206642537937182569037104,
          //       S: 37771237772835637475645736978295111342831148648737313502357141259120507349373,
          //       Hash: '0x0f3cecc272cb4513b8e05689cd5fed708af8b499798a3fa0f401093868cf1115',
          //       From: '0x34A582824d4232480715d668771EE7Ab37A17a91',
          //       To: '0x0000000000000000000000000000000000000000',
          //       Type: 2,
          //     },
          //   },
          // };
          let eventData: EMCSocketMessage | null = null;
          try {
            eventData = JSON.parse(event.data);
          } catch (e) {
            console.info('igonre message, because parse [event.data] failed!', event.data);
            return;
          }

          if (!eventData?.params) {
            console.info('igonre message, because [event.data.params] is empty!', event.data);
            return;
          }
          
          let type: MESSAGE_ORDINARY | MESSAGE_SUBCRIBE | undefined = eventData?.params?.result?.Type;
          let from = eventData?.params?.result?.From || '';
          let to = eventData?.params?.result?.To || '';
          let subject = eventData?.params?.result?.Subject || '';
          let message: any = eventData?.params?.result?.Content || '';

          try {
            message = JSON.parse(message);
          } catch (e) {}

          let messageType = type === 0 ? 'ordinary message' : 'subscribe message';

          console.info(
            `received [${messageType}] in subject [${subject}], from is [${from}], to is [${to}], message is [${
              message.data || message
            }]`
          );

          if (message.data === 'test send message') {
            emSocket.close();
          }
          break;
        default:
          console.info(`unknow ${action}`);
          break;
      }
    };
    const { _result, emSocket, event } = await connect({ network: wssUrl, callback: handleAction });
    if (_result !== 0) {
      throw new Error('socket is error');
    }
    const rtc = new RTC();
    const params = { subject: globalSubject, application: 'edge_chat', content: 'subject', chainId };
    const { _result: _subscribeResult } = await rtc.subscribe(params, privateKey, emSocket);
    st.equal(_subscribeResult, 0, 'subscribe have correct');
    st.end();
  });

  t.test('send message', async function (st) {
    if (!globalSubject) {
      throw new Error('global subject is empty');
    }
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
    st.equal(_result, 0, 'send message have correct');
    st.end();
  });
});
