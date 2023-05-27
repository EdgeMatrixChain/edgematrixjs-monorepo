import { AxiosResponse, AxiosRequestConfig, Axios } from 'axios';

export enum HTTP_METHOD {
  GET,
  POST,
  POST_JSON,
}

export class Http {
  public client: Axios;

  constructor(config?: AxiosRequestConfig) {
    const opt = config || {};
    opt.timeout = opt.timeout || 600000;
    this.client = new Axios(opt);
    this.client.interceptors.response.use(
      (response) => response,
      (error) => error.response || {}
    );
  }

  _formatOptions(method: HTTP_METHOD, options: AxiosRequestConfig) {
    if (method === HTTP_METHOD.GET) {
      options.method = 'GET';
      if (options.data) {
        options.params = options.data;
        options.paramsSerializer = {
          serialize: (params) =>
            Object.keys(params)
              .map((k) => `${k}=${params[k]}`)
              .join('&'),
        };
        delete options.data;
      }
    } else if (method === HTTP_METHOD.POST) {
      options.method = 'POST';
      options.headers = { 'content-type': 'application/x-www-form-urlencoded' };
      options.data = Object.keys(options.data)
        .map((key) => `${key}=${encodeURIComponent(options.data[key])}`)
        .join('&');
    } else if (method === HTTP_METHOD.POST_JSON) {
      options.method = 'POST';
      options.headers = { 'content-type': 'application/json' };
      options.data = typeof options.data === 'string' ? options.data : JSON.stringify(options.data);
    }
    return options;
  }

  _handler() {
    return (response: AxiosResponse) => {
      if (!response || !response.status) {
        return response;
      }
      const contentType = response.headers ? response.headers['content-type'] : '';
      if (contentType === 'application/json' && typeof response.data === 'string') {
        try {
          response.data = JSON.parse(response.data);
        } catch (e) {
          //try parse json with response.data failed
        }
      }
      return response;
    };
  }

  get(options: AxiosRequestConfig) {
    const _opt = this._formatOptions(HTTP_METHOD.GET, options);
    return this.client.request(_opt).then(this._handler());
  }

  post(options: AxiosRequestConfig) {
    const _opt = this._formatOptions(HTTP_METHOD.POST, options);
    return this.client.request(_opt).then(this._handler());
  }

  postJSON(options: AxiosRequestConfig) {
    const _opt = this._formatOptions(HTTP_METHOD.POST_JSON, options);
    return this.client.request(_opt).then(this._handler());
  }
}
