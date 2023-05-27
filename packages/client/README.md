# @edgematrixjs/browser

This project webpack to browser.

For usage, please refer to the "@edgematrixjs/rtc" module.

## Exports

```typescript
export { Http } from '@edgematrixjs/http';
export { EmSocket } from '@edgematrixjs/socket';
export { RTC } from '@edgematrixjs/rtc';
export { Transaction, LegacyTransaction } from '@edgematrixjs/tx';
export * from '@edgematrixjs/util';
```

## INSTALL

`Download dist/bundle.js in your project and add <script> in .html`

```html
<script src="dist/bundle.js"></script>
```

or

`In your project dir, npm install @edgematrixjs/client and add <script> in .html`

```html
<script src="node_modules/@edgematrixjs/client/dist/bundle.js"></script>
```

## Example

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
