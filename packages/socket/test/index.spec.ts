import * as tape from 'tape';
import { EmSocket } from '../src';

tape('socket', function (t) {
  t.test('EmSocket()', async function (st) {
    const emSocket = new EmSocket({ url: 'ws://3.145.214.36:40012/edge_ws' });
    emSocket.setOpenListener((event: Event) => {
      console.info('after 1s close');
      setTimeout(() => emSocket.close(), 1000);
    });
    emSocket.setCloseListener(() => {
      t.ok(1, 'socket closed');
      t.end();
    });
    emSocket.addMessageListener(() => {
      console.info('test message');
    });
    emSocket.connect();
  });
});
