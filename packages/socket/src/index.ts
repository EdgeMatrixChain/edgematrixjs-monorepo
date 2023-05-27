type EmSocketConfig = {
  url: string;
  debug?: false;
};

function getWebSocket() {
  if (typeof window !== 'undefined' && window.WebSocket) {
    return window.WebSocket;
  } else {
    return require('ws');
  }
}

export class EmSocket {
  public url?: string;
  public debug?: boolean;
  public client?: any;
  public openListener?: Function | null;
  public closeListener?: Function | null;
  public errorListener?: Function | null;
  public messageListeners: Array<Function> = [];

  constructor(config?: EmSocketConfig) {
    this.url = config?.url;
    this.debug = config?.debug;
  }

  setOpenListener(fn: Function) {
    if (typeof fn !== 'function') {
      throw new Error('setOpenListener args 1 must be Function');
    }
    this.openListener = fn;
    return this;
  }

  removeOpenListener() {
    this.openListener = null;
    return this;
  }

  setCloseListener(fn: Function) {
    if (typeof fn !== 'function') {
      throw new Error('setCloseListener args 1 must be Function');
    }
    this.closeListener = fn;
    return this;
  }

  removeCloseListener() {
    this.closeListener = null;
    return this;
  }

  setErrorListener(fn: Function) {
    if (typeof fn !== 'function') {
      throw new Error('setCloseListener args 1 must be Function');
    }
    this.errorListener = fn;
    return this;
  }

  removeErrorListener() {
    this.errorListener = null;
    return this;
  }

  addMessageListener(fn: Function) {
    if (typeof fn !== 'function') {
      throw new Error('addMessageListener args 1 must be Function');
    }
    this.messageListeners.push(fn);
    return this;
  }

  removeMessageListener(fn: Function) {
    if (typeof fn !== 'function') {
      throw new Error('removeMessageListener args 1 must be Function');
    }
    const index = this.messageListeners.findIndex((_fn) => _fn === fn);
    if (index > -1) {
      this.messageListeners.splice(index, 1);
    } else {
      console.warn('removeMessageListener not found "fn" in this.listeners');
    }
    return this;
  }

  getClient(): any {
    return this.client;
  }

  send(data: string) {
    if (!this.client) {
      console.warn('websocket is disconnected');
      return this;
    }
    this.client.send(data);
    return this;
  }

  close() {
    if (!this.client) {
      console.warn('websocket is disconnected');
      return this;
    }
    this.client.close();
    return this;
  }

  /**
   * connect websocket
   */
  connect(config?: EmSocketConfig) {
    if (this.client) {
      console.warn('websocket is connecting');
      return this;
    }

    const url = config?.url || this.url || '';

    if (!url) {
      throw new Error('connect: websocket url is none');
    }

    const _WebSocket = getWebSocket();

    this.client = new _WebSocket(url);

    this.client.onopen = (evt: any) => {
      this.debug && console.log('websocket opened url: ', url);
      if (typeof this.openListener === 'function') {
        this.openListener(evt);
      }
    };

    this.client.onmessage = (evt: any) => {
      this.debug && console.log('received message');
      this.messageListeners.forEach((fn: Function) => {
        fn.call(this, evt);
      });
    };

    this.client.onclose = (evt: any) => {
      this.debug && console.log('closed');
      if (typeof this.closeListener === 'function') {
        this.closeListener(evt);
      }
      this.client = undefined;
    };

    this.client.onerror = (evt: any) => {
      this.debug && console.log('websocket error');
      if (typeof this.errorListener === 'function') {
        this.errorListener(evt);
      }
      this.client = undefined;
    };

    return this;
  }
}
