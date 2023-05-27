import { Axios } from 'axios';
import * as tape from 'tape';
import { addressWith, hexToBuffer, addHexPrefix } from '@edgematrixjs/util';
import { Transaction, LegacyTransaction } from '../src';
const httpsUrl = 'https://oregon.edgematrix.xyz';
const wssUrl = 'wss://oregon.edgematrix.xyz/edge_ws';
const privateKey = '0xb22be9c19b61adc1d8e89a1dae0346ed274ac9fa239c06286910c29f9fee59d3';
const publicKey = addressWith(privateKey);

type CustomHttp = {
  postJSON: (data: any) => Promise<any>;
};

type CustomWebsocket = {
  send: (data: string) => void;
  close: () => void;
  addMessageListener: (fn: Function) => void;
  removeMessageListener: (fn: Function) => void;
};

const initHttp = () => {
  const client = new Axios({ baseURL: httpsUrl });
  return {
    async postJSON({ data }: any) {
      const response = await client.request({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        data: JSON.stringify(data),
      });
      if (!response || !response.status) {
        return response;
      }
      const contentType = response.headers ? response.headers['content-type'] : '';
      if (contentType === 'application/json' && typeof response.data === 'string') {
        try {
          response.data = JSON.parse(response.data);
        } catch (e) {
          //try parse json with response.data failed
        }
      }
      return response;
    },
  };
};

const initWebsocket = (): Promise<CustomWebsocket | null> => {
  const BasicWebSocket = typeof window !== 'undefined' && window.WebSocket ? window.WebSocket : require('ws');
  let basicWebSocket: any = null;

  const callbacks: Function[] = [];
  const customWebSocket = {
    send: (data: string) => {
      basicWebSocket?.send(data);
    },
    close: () => {
      basicWebSocket?.close();
    },
    addMessageListener: (fn: Function) => {
      callbacks.push(fn);
    },
    removeMessageListener: (fn: Function) => {
      const index = callbacks.findIndex((f: Function) => f === fn);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    },
  };
  return new Promise((resolve) => {
    basicWebSocket = new BasicWebSocket(wssUrl);
    basicWebSocket.onopen = (evt: any) => {
      resolve(customWebSocket);
    };
    basicWebSocket.onerror = (evt: any) => {
      resolve(null);
    };
    basicWebSocket.onclose = (evt: any) => {
      console.info(`close`);
    };
    basicWebSocket.onmessage = (evt: any) => {
      callbacks.forEach((fn) => fn.call(this, evt));
    };
  });
};

async function sendMessage(
  http: CustomHttp,
  chainId: number,
  subject: string,
  application: string,
  to: string,
  content: string
) {
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

  const params = { jsonrpc: '2.0', id: 1, method: 'edge_sendRawMsg', params: [data] };
  const response = await http.postJSON({ data: params });
  if (!response.data || response.data.error || response.data.result === '0x0') {
    return { _result: 1, _desc: 'edge_sendRawMsg failed', error: response.data?.error, data: response.data?.result };
  }
  return { _result: 0, data: response.data?.result };
}

async function getTelegramCount(http: CustomHttp, address: string): Promise<string> {
  const params = {
    jsonrpc: '2.0',
    id: 1,
    method: 'edge_getTelegramCount',
    params: [address],
  };
  const response = await http.postJSON({ data: params });
  const count = response.data?.result;
  return count || '';
}

tape('tx', function (t) {
  const chainId = 2;
  const application = 'edge_chat';
  let globalSubject = '';

  t.test('Use "LegacyTransaction" create subject', async function (st) {
    const http = initHttp();
    const telegramCount = await getTelegramCount(http, publicKey);
    st.isNotEqual(telegramCount, '', 'nonce success');
    if (!telegramCount) {
      st.end();
      return;
    }

    const chainId = 2;
    const transaction = new LegacyTransaction({
      chainId: chainId,
      nonce: telegramCount,
      gasPrice: '0x0',
      gasLimit: '0x0',
      to: '0x0000000000000000000000000000000000003101',
      value: '0x0',
      data: '0x333435',
    });
    const signed = transaction.sign(hexToBuffer(privateKey));
    const serialized = signed.serialize();
    const data = addHexPrefix(serialized.toString('hex'));
    const teleParams = { jsonrpc: '2.0', id: 1, method: 'edge_sendRawTelegram', params: [data] };
    const teleResp = await http.postJSON({ data: teleParams });
    const teleResult = JSON.parse(teleResp && teleResp.data ? teleResp.data.result || '{}' : '{}');
    const teleHash = teleResult.telegram_hash;
    st.isNotEqual(teleHash, '', 'create subject success');
    if (!teleHash) {
      st.end();
      return;
    }
    console.info(`created telegrame hash (subject) is "${teleHash}"`);

    const querySubjectInEMCStatus = async (hash: string, startTime: number, duration: number): Promise<any> => {
      const params = { jsonrpc: '2.0', method: 'edge_getTelegramReceipt', params: [hash], id: 1 };
      const response = await http.postJSON({ data: params });
      const result = response.data?.result || {};
      console.info(`query subject ${hash} in emc status ${result.status}`);
      if (result.status !== '0x1') {
        if (new Date().getTime() - startTime < duration) {
          return querySubjectInEMCStatus(hash, startTime, duration);
        } else {
          return { _result: 1, hash, _desc: 'create subject failed' };
        }
      } else {
        return { _result: 0, hash, data: result };
      }
    };
    const { _result } = await querySubjectInEMCStatus(teleHash, new Date().getTime(), 10 * 1000);
    if (_result === 0) {
      globalSubject = teleHash;
    }
    st.equal(_result, 0, 'query subject in EMC success');
    st.end();
  });

  t.test('Use "Transaction" send message', async function (st) {
    if (!globalSubject) {
      throw new Error('global subject is empty');
    }
    const http = initHttp();
    const subject = globalSubject;
    const to = '0x57397be2edfc3af7e3d9a3455ae80a58425cb767';
    const data = JSON.stringify({ data: 'edge matrix test transaction' });
    const resp = await sendMessage(http, chainId, subject, application, to, data);
    st.equal(resp._result, 0, 'Transaction in sendMessage success');
    st.end();
  });

  t.test('Use "Transaction" subscribe', async function (st) {
    if (!globalSubject) {
      throw new Error('global subject is empty');
    }

    const transaction = new Transaction({
      subject: globalSubject,
      application: application,
      content: 'subscribe',
      chainId: chainId,
    });
    const signed = transaction.sign(hexToBuffer(privateKey));
    const serialized = signed.serialize();
    const data = addHexPrefix(serialized.toString('hex'));
    const socketData = JSON.stringify({ jsonrpc: '2.0', method: 'edge_subscribe', params: ['rtc', data], id: 1 });
    const sendSubscribe = function () {
      return new Promise(async (resolve) => {
        const customWebSocket = await initWebsocket();
        if (!customWebSocket) {
          st.end();
          return;
        }
        customWebSocket.addMessageListener((evt: any) => {
          let data: any = {};
          try {
            data = JSON.parse(evt.data);
          } catch (e) {}
          let params = data.params || {};
          let result = params.result || {};
          let from = result.From;
          let type = result.Type;
          if (type === 2 && from.toLowerCase() === publicKey) {
            customWebSocket.close();
            resolve(0);
          }
        });
        customWebSocket.send(socketData);
      });
    };
    const _result = await sendSubscribe();
    st.equal(_result, 0, 'Transaction in subscribe success');
    st.end();
  });
});
