import { AxiosResponse, AxiosRequestConfig, Axios } from 'axios';
import { HTTP_METHOD } from './types';

function FormData() {
  if (typeof window !== 'undefined' && window.FormData) {
    return window.FormData;
  } else {
    return require('form-data');
  }
}

export class Http {
  public client?: Axios;

  constructor(config?: AxiosRequestConfig) {
    const opt = config || {};
    opt.timeout = opt.timeout || 600000;
    this.client = new Axios(opt);
    this.client?.interceptors.response.use(
      (response) => response,
      (error) => error.response || {}
    );
  }

  _formatOptions(method: HTTP_METHOD, options: AxiosRequestConfig) {
    if (typeof options.data === 'object' && !(options.data instanceof FormData())) {
      const newData: any = {};
      Object.keys(options.data).forEach((key) => {
        if (options.data[key] !== void 0) {
          newData[key] = options.data[key];
        } else {
          console.info(`remove undefined attr:${key}`);
        }
      });
      options.data = newData;
    }
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
    } else if (method === HTTP_METHOD.POST_FORMDATA) {
      options.method = 'POST';
      options.headers = { 'content-type': 'multipart/form-data' };
    } else if (method === HTTP_METHOD.DELETE) {
      options.method = 'DELETE';
      options.headers = { 'content-type': 'application/json' };
    } else if (method === HTTP_METHOD.PUT) {
      options.method = 'PUT';
      options.headers = { 'content-type': 'application/json' };
    }
    return options;
  }

  _handler() {
    return (response: AxiosResponse) => {
      if (response.status === 0) {
        return response.data || { __status: response.status };
      }
      if (typeof response.data === 'string') {
        console.info('response.data is string');
        try {
          const data = JSON.parse(response.data);
          data.__status = response.status;
          return data;
        } catch (e) {
          return { data: response.data, __status: response.status };
        }
      }
      const data = response.data || {};
      data.__status = response.status;
      return data;
    };
  }

  get(options: AxiosRequestConfig) {
    const _opt = this._formatOptions(HTTP_METHOD.GET, options);
    return this.client?.request(_opt).then(this._handler());
  }

  post(options: AxiosRequestConfig) {
    const _opt = this._formatOptions(HTTP_METHOD.POST, options);
    return this.client?.request(_opt).then(this._handler());
  }

  postFormData(options: AxiosRequestConfig) {
    const _opt = this._formatOptions(HTTP_METHOD.POST_FORMDATA, options);
    return this.client?.request(_opt).then(this._handler());
  }

  postJSON(options: AxiosRequestConfig) {
    const _opt = this._formatOptions(HTTP_METHOD.POST_JSON, options);
    return this.client?.request(_opt).then(this._handler());
  }

  delete(options: AxiosRequestConfig) {
    const _opt = this._formatOptions(HTTP_METHOD.DELETE, options);
    return this.client?.request(_opt).then(this._handler());
  }

  put(options: AxiosRequestConfig) {
    const _opt = this._formatOptions(HTTP_METHOD.PUT, options);
    return this.client?.request(_opt).then(this._handler());
  }
}
