import * as tape from 'tape';
import { Http } from '@edgematrixjs/http';
import { EmSocket } from '@edgematrixjs/socket';
import { addressWith, zeroAddress, toChecksumAddress } from '@edgematrixjs/util';
import { RTC } from '../src';

const httpsUrl = 'https://oregon.edgematrix.xyz';
const privateKey = '0x1fcfc42862c2af94c0e14ae2385b5796c93a8ebd716d42e04cd58bbb2fa9a1e2';
const publicKey = toChecksumAddress(addressWith(privateKey));
const nodeId = '16Uiu2HAm14xAsnJHDqnQNQ2Qqo1SapdRk9j8mBKY6mghVDP9B9u5';
const chainId = 2;

function parseJSON(str: string) {
  if (!str) return null;
  if (typeof str === 'object') {
    return str;
  }
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}
function formatted(responseData: any) {
  const responseDataFormatted = { ...responseData };
  if (responseDataFormatted.result) {
    responseDataFormatted.result = parseJSON(responseDataFormatted.result) || responseDataFormatted.result;
    if (responseDataFormatted.result?.response) {
      let insideResponse = responseDataFormatted.result.response;
      try {
        insideResponse = window.atob(insideResponse);
      } catch (e) {
        insideResponse = Buffer.from(insideResponse, 'base64').toString();
      }
      insideResponse = parseJSON(insideResponse) || insideResponse;
      responseDataFormatted.result.response = insideResponse;
    }
  }
  return responseDataFormatted;
}

tape('rtc node', function (t) {
  t.test('send node api', async function (st) {
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
    const newData = formatted(data);
    const insideResponse = newData.result?.response;
    const images = insideResponse?.images || [];
    st.equal(images.length, 1, `send node api success`);
    st.end();
  });

  t.test('send info', async function (st) {
    const emHttp = new Http({ baseURL: httpsUrl });
    const rtc = new RTC();
    const { _result, _desc, data } = await rtc.sendNodeInfo({ chainId, nodeId }, privateKey, emHttp);
    if (_result !== 0) {
      throw new Error(_desc);
    }
    const newData = formatted(data);
    const insideResponse = newData.result?.response;
    const responseNodeId = insideResponse?.peerId;
    st.equal(responseNodeId, nodeId, `send info success`);
    st.end();
  });

  t.test('send idl', async function (st) {
    const emHttp = new Http({ baseURL: httpsUrl });
    const rtc = new RTC();
    const { _result, _desc, data } = await rtc.sendNodeIdl({ chainId, nodeId }, privateKey, emHttp);
    if (_result !== 0) {
      throw new Error(_desc);
    }
    const newData = formatted(data);
    const insideResponse = newData.result?.response || {};
    const idl = Array.isArray(insideResponse) ? insideResponse : insideResponse.idl || [];
    const firstApi = idl[0];
    st.equal(firstApi.path, '/sdapi/v1/txt2img', `send idl success ${firstApi.path}`);
    st.end();
  });
  t.test('send echo', async function (st) {
    const emHttp = new Http({ baseURL: httpsUrl });
    const rtc = new RTC();
    const body = 'hello';
    const { _result, _desc, data } = await rtc.sendNodeEcho({ chainId, nodeId, body }, privateKey, emHttp);
    if (_result !== 0) {
      throw new Error(_desc);
    }
    const newData = formatted(data);
    const insideResponse = newData.result?.response;
    st.equal(insideResponse, 'recieved data: "hello"', `send echo success`);
    st.end();
  });
});
