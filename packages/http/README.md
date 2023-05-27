# @edgematrixjs/http

This project used in [`"axios": "^1.3.4"`][github-Axios]

Provide `postJSON` methods for `@edgematrixjs/rtc`

## Dependencies

```json
"axios": "^1.3.4"
```

## INSTALL

`npm install @edgematrixjs/http`

## USAGE IN RTC

```typescript
import { Http } from '@edgematrixjs/http';
import { RTC } from '@edgematrixjs/rtc';
const rtc = new RTC({ debug: false });
const chainId = 2;
const privateKey = '{privatekey}';
const network = 'https://oregon.edgematrix.xyz';
const http = new Http({ baseURL: network });
rtc.createSubject(chainId, privateKey, http);
```

## API

`postJSON(options: AxiosRequestConfig)` - Similar to Axios

`post(options: AxiosRequestConfig)` - Similar to Axios

`get(options: AxiosRequestConfig)` - Similar to Axios

[github-Axios]: https://github.com/axios/axios
