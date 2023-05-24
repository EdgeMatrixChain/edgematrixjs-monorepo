import { LegacyTransaction, Transaction } from '@edgematrixjs/tx';
import { addressWith, hexToBuffer, addHexPrefix } from '@edgematrixjs/util';
import { EmSocket } from '@edgematrixjs/socket';
import { Http } from '@edgematrixjs/http';

type RTCConfig = {
  debug: boolean;
};

type RTCParams = {
  method: string;
  params: any;
  id?: number;
};

type SubscribeParams = {
  subject: string;
  application: string;
  content: string;
  chainId: number;
};

type MessageParams = {
  subject: string;
  application: string;
  content: string;
  to?: string;
  chainId: number;
};

type CreateSubjectResp = {
  _result: number;
  hash?: string; //hexString
  data?: any;
};

export class RTC {
  public debug = false;

  constructor(config?: RTCConfig) {
    this.debug = config?.debug || false;
  }

  _formatRawParams(rtcParams: RTCParams) {
    return {
      jsonrpc: '2.0',
      method: rtcParams.method,
      params: rtcParams.params,
      id: rtcParams.id || 1,
    };
  }

  _sendRaw(rtcParams: RTCParams, ws: EmSocket) {
    const params = this._formatRawParams(rtcParams);
    ws.send(JSON.stringify(params));
  }

  /**
   * subscribe subject
   * @param {String} {subject:'',content:''}
   */
  subscribe(params: SubscribeParams, privateKey: string, emSocket: EmSocket): Promise<CreateSubjectResp> {
    return new Promise((resolve) => {
      const { subject, content, application, chainId } = params;
      if (!subject) {
        throw new Error('subject not be none');
      }
      if (typeof subject !== 'string') {
        throw new Error('subject must be string');
      }

      let timer: any = null;
      let isComplete = false;

      let RESULT_SUCCESS = 0;
      let RESULT_FAILED = 1;

      const onMessage = (event: any) => {
        if (isComplete) return;
        let data = { params: { result: { From: '', Type: 0 } } };
        try {
          data = JSON.parse(event.data);
        } catch (e) {}
        let params = data.params || {};
        let result = params.result || {};
        let from = result.From;
        let type = result.Type;
        if (type === 2 && from.toLowerCase() === addressWith(privateKey)) {
          clearTimeout(timer);
          onComplete(RESULT_SUCCESS);
        }
      };

      const onComplete = (_result: number) => {
        isComplete = true;
        emSocket.removeMessageListener(onMessage);
        resolve({ _result });
      };

      emSocket.addMessageListener(onMessage);

      const transaction = new Transaction({
        subject: subject,
        application: application,
        content: typeof content !== 'string' ? '' : content,
        chainId: chainId,
      });
      const signed = transaction.sign(hexToBuffer(privateKey));
      const serialized = signed.serialize();
      const data = addHexPrefix(serialized.toString('hex'));
      this._sendRaw({ params: ['rtc', data], id: 1, method: 'edge_subscribe' }, emSocket);
      //delay 2s failed
      timer = setTimeout(() => onComplete(RESULT_FAILED), 2000);
    });
  }

  /**
   * send message with socket
   * @deprecated
   * @param {String} {subject:'',content:''}
   */
  sendSocketMessage(params: SubscribeParams, privateKey: string, ws: EmSocket) {
    const { subject, content, application, chainId } = params;
    if (!subject) {
      throw new Error('subject not be none');
    }
    if (typeof subject !== 'string') {
      throw new Error('subject must be string');
    }

    const transaction = new Transaction({
      subject: subject,
      application: application,
      content: typeof content !== 'string' ? '' : content,
      chainId: chainId,
    });
    const signed = transaction.sign(hexToBuffer(privateKey));
    const serialized = signed.serialize();
    const data = addHexPrefix(serialized.toString('hex'));
    this._sendRaw({ params: [data], id: 1, method: 'edge_sendRawMsg' }, ws);
  }

  /**
   * create subject
   * @param {String} privateKey
   * @return {Promise}
   */
  async createSubject(chainId: number, privateKey: string, http: Http): Promise<any> {
    const nonceResp = await this.getTelegramCount(chainId, privateKey, http);
    const nonce = nonceResp.data;
    if (!nonce) {
      return { _result: 1, _desc: 'edge_getTelegramCount: nonce is none' };
    }
    const transaction = new LegacyTransaction({
      nonce: nonce,
      gasPrice: '0x0',
      gasLimit: '0x0',
      to: '0x0000000000000000000000000000000000003101',
      value: '0x0',
      data: '0x333435',
      chainId: chainId,
    });
    const signed = transaction.sign(hexToBuffer(privateKey));
    if (this.debug) {
      console.info(`create subject signed to json--->\n${JSON.stringify(signed.toJSON())}`);
    }
    const serialized = signed.serialize();
    const data = addHexPrefix(serialized.toString('hex'));
    const teleResp = await http.postJSON({
      data: this._formatRawParams({ params: [data], id: 1, method: 'edge_sendRawTelegram' }),
    });
    const teleResult = JSON.parse(teleResp ? teleResp.result || '{}' : '{}');
    const teleHash = teleResult.telegram_hash;
    if (!teleHash) {
      return { _result: 1, _desc: 'create subject: telegram_hash is none' };
    }
    const queryBlockResult = async (hash: string, startTime: number, duration: number): Promise<any> => {
      const resp = await this.getTelegramReceipt(hash, http);
      if (resp._result !== 0) {
        if (new Date().getTime() - startTime < duration) {
          return queryBlockResult(hash, startTime, duration);
        } else {
          return resp;
        }
      } else {
        return resp;
      }
    };
    return queryBlockResult(teleHash, new Date().getTime(), 10 * 1000);
  }

  /**
   * create channel(subject)
   * @deprecated
   * @param chainId
   * @param privateKey
   * @param http
   * @returns
   */
  createChannel(chainId: number, privateKey: string, http: Http) {
    return this.createSubject(chainId, privateKey, http);
  }

  async getTelegramCount(chainId: number, privateKey: string, http: Http) {
    const address = addressWith(privateKey);
    const nonceResp = await http.postJSON({
      data: this._formatRawParams({ params: [address], id: 1, method: 'edge_getTelegramCount' }),
    });
    const nonce = nonceResp.result;
    if (!nonce) {
      return { _result: 1, _desc: 'edge_getTelegramCount: nonce is none' };
    } else {
      return { _result: 1, data: nonce };
    }
  }

  async getTelegramReceipt(hash: string, http: Http): Promise<any> {
    const resp = await http.postJSON({
      data: this._formatRawParams({ method: 'edge_getTelegramReceipt', params: [hash], id: 1 }),
    });
    resp.result = resp.result || {};
    const { status } = resp.result;
    if (status !== '0x1') {
      return { _result: 1, hash, _desc: '' };
    } else {
      return { _result: 0, hash, data: resp.result };
    }
  }

  /**
   * send message with http
   * @param messageParams
   * @param privateKey
   * @param http
   * @returns
   */
  sendMessage(messageParams: MessageParams, privateKey: string, http: Http) {
    const { subject, content, to, application, chainId } = messageParams;
    if (!subject) {
      throw new Error('subject not be none');
    }
    if (typeof subject !== 'string') {
      throw new Error('subject must be string');
    }
    const transaction = new Transaction({
      subject: subject,
      application: application,
      to: typeof to !== 'string' ? '' : to,
      content: typeof content !== 'string' ? '' : content,
      chainId: chainId,
    });
    const signed = transaction.sign(hexToBuffer(privateKey));
    if (this.debug) {
      console.info(`send message signed to json--->\n${JSON.stringify(signed.toJSON())}`);
    }
    const serialized = signed.serialize();
    const data = addHexPrefix(serialized.toString('hex'));
    return http.postJSON({ data: this._formatRawParams({ params: [data], id: 1, method: 'edge_sendRawMsg' }) });
  }
}
