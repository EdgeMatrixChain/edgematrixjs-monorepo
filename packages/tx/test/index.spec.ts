import axios from 'axios';
import * as tape from 'tape';
import { addressWith, hexToBuffer, addHexPrefix } from '@edgematrixjs/util';
import { Http } from '@edgematrixjs/http';
import { Transaction, LegacyTransaction } from '../src';

const request = axios.create({ timeout: 60000000 });
const requestJSON = { method: 'POST', headers: { 'content-type': 'application/json' } };

const http = new Http({ baseURL: 'http://3.145.214.36:40012' });
const privateKey = '0xb22be9c19b61adc1d8e89a1dae0346ed274ac9fa239c06286910c29f9fee59d3';
const address = addressWith(privateKey);
console.info(address);

async function sendTransaction(http: Http, chainId: number, subject: string, application: string, to: string, content: string) {
  // const subject = '0x8eeb338239ada22d81ffb7adc995fe31a4d1dc2d701bc8a58fffe5b53e14281e';
  // const to = '0x0aF137aa3EcC7d10d926013ee34049AfA77382e6';
  // const application = 'edge_chat';
  // const content = 'edge matrix test';
  const transaction = new Transaction({
    subject: subject,
    application: application,
    content: content,
    to: to,
    chainId: chainId,
  });
  const signed = transaction.sign(hexToBuffer(privateKey));
  console.info(`sign to json--->`, signed.toJSON());
  const serialized = signed.serialize();
  const data = addHexPrefix(serialized.toString('hex'));
  const params = { jsonrpc: '2.0', id: 1, method: 'edge_sendRawMsg', params: [data] };
  console.info(`post--->`, params);
  const resp = await http.postJSON({ data: params });
  if (resp.result === '0x0') {
    return { _result: 1, _desc: 'edge_sendRawMsg failed', ...resp.data };
  }
  return { _result: 0, ...resp.data };
}

async function sendTransaction2(url: string, chainId: number, subject: string, application: string, to?: string, content?: string) {
  // const subject = '0x8eeb338239ada22d81ffb7adc995fe31a4d1dc2d701bc8a58fffe5b53e14281e';
  // const to = '0x0aF137aa3EcC7d10d926013ee34049AfA77382e6';
  // const application = 'edge_chat';
  // const content = 'edge matrix test';
  const transaction = new Transaction({
    subject: subject,
    application: application,
    content: content || '',
    to: to,
    chainId: chainId,
  });
  const signed = transaction.sign(hexToBuffer(privateKey));
  console.info(`sign to json--->`, signed.toJSON());
  const serialized = signed.serialize();
  const data = addHexPrefix(serialized.toString('hex'));
  const params = { jsonrpc: '2.0', id: 1, method: 'edge_sendRawMsg', params: [data] };
  console.info(`post--->`, params);
  const resp = await request({ ...requestJSON, url, data: params });
  if (resp.data.result === '0x0') {
    return { _result: 1, _desc: 'edge_sendRawMsg failed', ...resp.data };
  }
  return { _result: 0, ...resp.data };
}

tape('tx', function (t) {
  // t.test('use transaction send message with empty address', async function (st) {
  //   const subject = '0x8eeb338239ada22d81ffb7adc995fe31a4d1dc2d701bc8a58fffe5b53e14281e';
  //   const resp = await sendTransaction(http, 2, subject, 'edge_chat', '', 'edge matrix test3');
  //   st.equal(resp._result, 0, 'should have correct response');
  //   st.end();
  // });
  t.test('use transaction send message with empty address', async function (st) {
    const subject = '0x8eeb338239ada22d81ffb7adc995fe31a4d1dc2d701bc8a58fffe5b53e14281e';
    const resp = await sendTransaction(http, 2, subject, 'edge_chat', '', JSON.stringify({ data: 'edge matrix test1' }));
    // const resp = await sendTransaction2('http://3.145.214.36:40012', 2, subject, 'edge_chat', '', JSON.stringify({ data: 'edge matrix test1' }));
    st.equal(resp._result, 0, 'should have correct response');
    st.end();
  });
  return;
  t.test('use transaction send message with address1', async function (st) {
    const subject = '0x8eeb338239ada22d81ffb7adc995fe31a4d1dc2d701bc8a58fffe5b53e14281e';
    const resp = await sendTransaction(http, 2, subject, 'edge_chat', '0x0aF137aa3EcC7d10d926013ee34049AfA77382e6', 'edge matrix test1');
    st.equal(resp._result, 0, 'should have correct response');
    st.end();
  });

  t.test('use transaction send message with address2', async function (st) {
    const subject = '0x8eeb338239ada22d81ffb7adc995fe31a4d1dc2d701bc8a58fffe5b53e14281e';
    const resp = await sendTransaction(http, 2, subject, 'edge_chat', '0x57397Be2eDfc3AF7e3d9a3455aE80A58425Cb767', 'edge matrix test2');
    st.equal(resp._result, 0, 'should have correct response');
    st.end();
  });

  t.test('new LegacyTransaction()', async function (st) {
    const chainId = 2;
    //test net
    const url = `http://3.145.214.36:40012`;
    const nonceParams = { jsonrpc: '2.0', method: 'edge_getTelegramCount', params: [address], id: 1 };
    const nonceResp = await http.postJSON({ url, data: nonceParams });
    const nonce = nonceResp.data.result;
    if (!nonce) {
      console.info({ _result: 1, _desc: 'edge_getTelegramCount: nonce is none' });
      st.end();
      return;
    }
    const transaction = new LegacyTransaction({ nonce: nonce, gasPrice: '0x0', gasLimit: '0x0', to: '0x0000000000000000000000000000000000003101', value: '0x0', data: '0x333435', chainId: chainId });
    const signed = transaction.sign(hexToBuffer(privateKey));
    console.info(`sign to json--->`, signed.toJSON());
    const serialized = signed.serialize();
    const data = addHexPrefix(serialized.toString('hex'));
    const teleParams = { jsonrpc: '2.0', id: 1, method: 'edge_sendRawTelegram', params: [data] };
    console.info(`url--->`, url);
    console.info(`post--->`, teleParams);
    const teleResp = await http.postJSON({ url, data: teleParams });
    const teleResult = JSON.parse(teleResp ? teleResp.data.result || '{}' : '{}');
    const teleHash = teleResult.telegram_hash;
    if (!teleHash) {
      console.info({ _result: 1, _desc: 'edge_sendRawTelegram: telegram_hash is none' });
      st.end();
      return;
    }
    console.info(`teleHash->`, teleHash);

    const queryBlockResult = async (hash: string, startTime: number, duration: number): Promise<any> => {
      const resp = await http.postJSON({ url, data: { jsonrpc: '2.0', method: 'edge_getTelegramReceipt', params: [hash], id: 1 } });
      const result = resp.result || {};
      const { status } = result;
      if (status !== '0x1') {
        if (new Date().getTime() - startTime < duration) {
          return queryBlockResult(hash, startTime, duration);
        } else {
          return { _result: 1, hash, _desc: 'create telegram failed' };
        }
      } else {
        return { _result: 0, hash, data: result };
      }
    };
    const resp = await queryBlockResult(teleHash, new Date().getTime(), 10 * 1000);
    st.equal(resp._result, 0, 'should have correct response');
    st.end();
  });
});
