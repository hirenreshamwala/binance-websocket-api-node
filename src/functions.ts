import CryptoJS from 'crypto-es';
import { isBrowser } from './BrowserOrNode';

export function toUrlParams(params: { [x: string]: any; }): string {
    return Object.keys(params).sort((a, b) => a.localeCompare(b)).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
}
export function generateId(length = 24) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

export async function generateSignature(queryString: string | undefined, apiSecret: string | undefined) {
    if(isBrowser) {
        const crypto = window.crypto.subtle;
        const encoder = new TextEncoder();
    
        const key = await crypto
            .importKey('raw', encoder.encode(apiSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const signature = await crypto.sign({ name: 'HMAC' }, key, encoder.encode(queryString));
        return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, '0')).join('');
    } else {
        const qs = queryString || '';
        const secret = apiSecret || '';
        const signature = CryptoJS.HmacSHA256(qs, secret);
        return signature.toString(CryptoJS.enc.Hex);
    }
}

export const getTimeStamp = () => {
    return (new Date()).getTime();
}

export const extend = (...args: { apiKey?: any; }[]) => Object.assign ({}, ...args)

export const getWebSocketBrowser = (): any => {
    var ws = undefined;
    if (typeof WebSocket !== 'undefined') {
      ws = WebSocket;
      // @ts-ignore
    } else if (typeof MozWebSocket !== 'undefined') {
      // @ts-ignore
      ws = MozWebSocket;
    } else if (typeof global !== 'undefined') {
      ws = global.WebSocket || (global as any).MozWebSocket;
    } else if (typeof window !== 'undefined') {
      ws = window.WebSocket || (window as any).MozWebSocket;
    }
    return ws;
};