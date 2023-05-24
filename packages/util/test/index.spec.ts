import * as tape from 'tape';
import { genPrivateKey, addressWith } from '../src';

tape('Util', function (t) {
  t.test('genPrivateKey()', function (st) {
    const privateKey = genPrivateKey();
    st.equal(privateKey.length, 66, 'should have correct private key length');
    st.end();
  });

  t.test('addressWith(privateKey:string)', function (st) {
    const privateKey = '0xb22be9c19b61adc1d8e89a1dae0346ed274ac9fa239c06286910c29f9fee59d3';
    const _address = '0x57397be2edfc3af7e3d9a3455ae80a58425cb767';
    const address = addressWith(privateKey);
    st.equal(address, _address, 'should have correct address with private key');
    st.end();
  });
});
