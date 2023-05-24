import * as tape from 'tape';
import { Http } from '../src';

tape('tx', function (t) {
  t.test('Http.get()', async function (st) {
    const http = new Http({ baseURL: 'https://saas.yfw365.com/saas/wxos/client/goods/shopIndustryCate' });
    const resp = await http.get({ data: { suppliers_id: 1230 } });
    console.info(resp._result);
    st.equal(resp.__status, 200, 'http get is success');
    st.end();
  });
});
