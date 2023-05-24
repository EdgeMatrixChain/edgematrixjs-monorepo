import * as tape from 'tape';
import { Http } from '@edgematrixjs/http';
import { EmSocket } from '@edgematrixjs/socket';
import { addressWith, zeroAddress, toChecksumAddress } from '@edgematrixjs/util';
import { RTC } from '../src';

const privateKey = '0x1fcfc42862c2af94c0e14ae2385b5796c93a8ebd716d42e04cd58bbb2fa9a1e2'; // '0xb22be9c19b61adc1d8e89a1dae0346ed274ac9fa239c06286910c29f9fee59d3';
const address = toChecksumAddress(addressWith(privateKey));
const subject = '0x8eeb338239ada22d81ffb7adc995fe31a4d1dc2d701bc8a58fffe5b53e14281e';
// 0x57397be2edfc3af7e3d9a3455ae80a58425cb767

tape('rtc', function (t) {
  t.test('create telegram', async function (st) {
    const emHttp = new Http({ baseURL: 'http://3.145.214.36:40012' });
    const rtc = new RTC();
    const chainId = 2;
    const resp = await rtc.createSubject(chainId, privateKey, emHttp);
    st.equal(resp._result, 0, 'create telegram have correct');
    st.end();
  });

  t.test('query telegram receipt', async function (st) {
    const emHttp = new Http({ baseURL: 'http://3.145.214.36:40012' });
    const rtc = new RTC();
    const subject = '0x1dcfc57ca80abf2a354901af0559fd0b88725d0bff2f4c392f370b809fefa705';
    const resp = await rtc.getTelegramReceipt(subject, emHttp);
    st.equal(resp._result, 0, 'query telegram receipt have correct');
    st.end();
  });

  t.test('query not exist telegram receipt', async function (st) {
    const emHttp = new Http({ baseURL: 'http://3.145.214.36:40012' });
    const rtc = new RTC();
    const subject = '0x1dcfc57ca80abf2a354901af0559fd0b88725d0bff2f4c392f370b809fefa704';
    const resp = await rtc.getTelegramReceipt(subject, emHttp);
    st.equal(resp._result, 1, 'query telegram receipt not have correct');
    st.end();
  });
});
