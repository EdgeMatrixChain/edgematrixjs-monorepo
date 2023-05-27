import * as tape from 'tape';
import { Http } from '../src';

tape('http', function (t) {
  t.test('postJSON()', async function (st) {
    const http = new Http({ baseURL: 'https://oregon.edgematrix.xyz' });
    const publicKey = '0x57397be2edfc3af7e3d9a3455ae80a58425cb767';
    const nonceResp = await http.postJSON({
      data: { jsonrpc: '2.0', id: 1, method: 'edge_getTelegramCount', params: [publicKey] },
    });
    st.equal(nonceResp.status, 200, 'http get is success');
    st.end();
  });
});
