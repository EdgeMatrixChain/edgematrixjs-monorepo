import { LegacyTransaction, Transaction } from '@edgematrixjs/tx';
import { addressWith, hexToBuffer, addHexPrefix } from '@edgematrixjs/util';
import { EmSocket } from '@edgematrixjs/socket';
import { Http } from '@edgematrixjs/http';

type RTCConfig = {
  debug?: boolean;
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

type NodeParameters = {
  chainId: number;
  nodeId: string;
  path?: string;
  method?: string;
  headers?: any[];
  body?: any;
};

interface TelegramParameters {
  chainId: number;
  nodeId: string;
  endpoint: string;
  input?: any;
}

type RawTelegramParameters = {
  chainId: number;
  to: string;
  nonce: string;
  data: any;
};

type RawTelegramResponse = {
  _result: number;
  _desc?: string;
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

  _sendRaw(rtcParams: RTCParams, emSocket: EmSocket) {
    const params = this._formatRawParams(rtcParams);
    emSocket.send(JSON.stringify(params));
  }

  /**
   * Subscribe subject
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
   * Send message with socket
   * @deprecated
   * @param {String} {subject:'',content:''}
   */
  sendSocketMessage(params: SubscribeParams, privateKey: string, emSocket: EmSocket) {
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
    this._sendRaw({ params: [data], id: 1, method: 'edge_sendRawMsg' }, emSocket);
  }

  /**
   * Create subject
   * @param {String} privateKey
   * @return {Promise}
   */
  async createSubject(chainId: number, privateKey: string, http: Http): Promise<any> {
    const nonceResp = await this.getTelegramCount(privateKey, http);
    const nonce = nonceResp.data;
    if (!nonce) {
      return { _result: 1, _desc: 'edge_getTelegramCount: nonce is none' };
    }
    const to = '0x0000000000000000000000000000000000003101';
    const data = '0x0';
    const teleResponse = await this.sendRawTelegram({ chainId, to, nonce, data }, privateKey, http);
    let teleResult = { telegram_hash: '' };
    try {
      teleResult = JSON.parse(teleResponse.data?.result);
    } catch (e) {}
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
   * Create channel(subject)
   * @deprecated
   * @param chainId
   * @param privateKey
   * @param http
   * @returns
   */
  createChannel(chainId: number, privateKey: string, http: Http) {
    return this.createSubject(chainId, privateKey, http);
  }

  /**
   * Calling the internal API of the node
   * @param NodeParameters
   * @param privateKey
   * @param http
   * @returns
   */
  async sendNodeApi({ chainId, nodeId, path, method, headers, body }: NodeParameters, privateKey: string, http: Http) {
    const endpoint = '/api';
    const input: any = {
      path: path,
      method: method,
      headers: headers || [],
      body: body,
    };
    return this.sendNodeTelegram({ chainId, nodeId, endpoint, input }, privateKey, http);
  }

  /**
   * Query the "IDL" of the node
   * @param NodeParameters
   * @param privateKey
   * @param http
   * @returns
   */
  async sendNodeIdl({ chainId, nodeId }: NodeParameters, privateKey: string, http: Http) {
    const endpoint = '/idl';
    return this.sendNodeTelegram({ chainId, nodeId, endpoint }, privateKey, http);
  }

  /**
   * Query the "Info" of the node
   * @param NodeParameters
   * @param privateKey
   * @param http
   * @returns
   */
  async sendNodeInfo({ chainId, nodeId }: NodeParameters, privateKey: string, http: Http) {
    const endpoint = '/info';
    return this.sendNodeTelegram({ chainId, nodeId, endpoint }, privateKey, http);
  }

  /**
   * Calling the "echo" of the node
   * @param NodeParameters
   * @param privateKey
   * @param http
   * @returns
   */
  async sendNodeEcho({ chainId, nodeId, body }: NodeParameters, privateKey: string, http: Http) {
    const endpoint = '/echo';
    const input = body;
    return this.sendNodeTelegram({ chainId, nodeId, endpoint, input }, privateKey, http);
  }

  /**
   * The base function for communicating with the node
   * @param TelegramParameters
   * @param privateKey
   * @param http
   * @returns
   */
  async sendNodeTelegram({ chainId, nodeId, endpoint, input }: TelegramParameters, privateKey: string, http: Http) {
    const nonceResp = await this.getTelegramCount(privateKey, http);
    const nonce = nonceResp.data;
    if (!nonce) {
      return { _result: 1, _desc: 'nonce is none' };
    }
    const to = '0x0000000000000000000000000000000000003001';
    const data = {
      peerId: nodeId,
      endpoint: endpoint,
      Input: input === void 0 ? '' : input,
    };
    return this.sendRawTelegram({ chainId, to, nonce, data }, privateKey, http);
  }

  /**
   * Send to EMC legacy transaction
   * @param RawTelegramParameters
   * @param privateKey
   * @param http
   * @returns
   */
  async sendRawTelegram(
    { chainId, to, nonce, data }: RawTelegramParameters,
    privateKey: string,
    http: Http
  ): Promise<RawTelegramResponse> {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    if (this.debug) {
      console.info(`send raw telegram pre data--->\n${dataStr}`);
    }
    const transaction = new LegacyTransaction({
      nonce: nonce,
      gasPrice: '0x0',
      gasLimit: '0x0',
      to: to,
      value: '0x0',
      data: Buffer.from(dataStr, 'utf-8'),
      chainId: chainId,
    });
    const signed = transaction.sign(hexToBuffer(privateKey));
    if (this.debug) {
      console.info(`send raw telegram signed to json--->\n${JSON.stringify(signed.toJSON())}`);
    }
    const serialized = signed.serialize();
    const serializedHex = addHexPrefix(serialized.toString('hex'));
    const teleResponse = await http.postJSON({
      data: this._formatRawParams({ params: [serializedHex], id: 1, method: 'edge_sendRawTelegram' }),
    });
    const resp = teleResponse?.data;
    if (!resp) {
      return { _result: 1, _desc: 'network error' };
    }
    if (resp.error) {
      const error = resp.error;
      return { _result: 1, _desc: `[${error.code}] ${error.message}` };
    }
    return { _result: 0, data: resp };
  }

  /**
   * Query nonce with private key
   * @param hash
   * @param http
   * @returns
   */
  async getTelegramCount(privateKey: string, http: Http) {
    const publicKey = addressWith(privateKey);
    const nonceResponse = await http.postJSON({
      data: this._formatRawParams({ params: [publicKey], id: 1, method: 'edge_getTelegramCount' }),
    });
    const nonce = nonceResponse.data?.result;
    if (!nonce) {
      return { _result: 1, _desc: 'edge_getTelegramCount: nonce is none' };
    } else {
      return { _result: 0, data: nonce };
    }
  }

  /**
   * Query nonce with public key
   * @param hash
   * @param http
   * @returns
   */
  async getTelegramCountWithPublicKey(publicKey: string, http: Http) {
    const nonceResponse = await http.postJSON({
      data: this._formatRawParams({ params: [publicKey], id: 1, method: 'edge_getTelegramCount' }),
    });
    const nonce = nonceResponse.data?.result;
    if (!nonce) {
      return { _result: 1, _desc: 'edge_getTelegramCount: nonce is none' };
    } else {
      return { _result: 0, data: nonce };
    }
  }

  /**
   * Query telegram receipt
   * @param hash
   * @param http
   * @returns
   */
  async getTelegramReceipt(hash: string, http: Http): Promise<any> {
    const response = await http.postJSON({
      data: this._formatRawParams({ method: 'edge_getTelegramReceipt', params: [hash], id: 1 }),
    });
    const result = response.data?.result || {};
    if (result.status !== '0x1') {
      return { _result: 1, hash, _desc: '' };
    } else {
      return { _result: 0, hash, data: result };
    }
  }

  /**
   * send message with http
   * @param messageParams
   * @param privateKey
   * @param http
   * @returns
   */
  async sendMessage(messageParams: MessageParams, privateKey: string, http: Http) {
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
    const response = await http.postJSON({
      data: this._formatRawParams({ params: [data], id: 1, method: 'edge_sendRawMsg' }),
    });
    const resp = response.data || { result: '' };
    // return "result" property is covert last version
    if (resp.result === '0x0') {
      return { _result: 1, ...resp };
    }
    return { _result: 0, ...resp };
  }
}
