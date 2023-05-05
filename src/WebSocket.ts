import { isBrowser, isNode } from './BrowserOrNode'

interface WebSocketFactory {
    new (url: string | URL, protocols?: string | string[] | undefined): WebSocket;
    prototype: WebSocket;
    readonly CLOSED: number;
    readonly CLOSING: number;
    readonly CONNECTING: number;
    readonly OPEN: number;
}

let Ws: WebSocket | WebSocketFactory | undefined

const getWebSocketBrowser = (): WebSocketFactory | undefined => {
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

  
if(isBrowser){
    Ws = getWebSocketBrowser();
} else if(isNode){
    // ToDo: Set nodejs websocket
}

export default Ws