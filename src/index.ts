import ReconnectingWebSocket from 'reconnecting-websocket'
import BinanceWebSocket from './WebSocket'
import EventDispatcher from './EventDispatcher'
import { generateSignature, generateId, extend, toUrlParams, getWebSocketBrowser } from './functions'

interface RateLimit {
    count: number;
    limit: number;
    remain: number;
}

export default class BinanceWebsocketApi extends EventDispatcher {

    socket: any
    ws: any
    connected: boolean = false
    currentListenKey: string = ''
    requestList: any = {}
    rateLimit: RateLimit = {
        count: 0,
        limit: 1200,
        remain: 1200
    }
    pingTimeout: any = 0;

    privateRequest: (id: string, method: string, params?: any) => Promise<any>;
    request: (id: string, method: string, params?: any, addApiKey?: boolean) => Promise<any>;
    connect: () => void;

    constructor(params: any = {}) {
        super()

        const { apiKey, apiSecret, webSocket} = params;

        const Ws = getWebSocketBrowser();

        this.ws = BinanceWebSocket({
            getDataStream: this.getDataStream.bind(this),
            keepDataStream: this.keepDataStream.bind(this),
            closeDataStream: this.closeDataStream.bind(this),
            webSocket: Ws || webSocket
        });

        const defaultGetTime = () => Date.now()

        this.privateRequest = async (id: string, method: string, params?: any) => {

            const newPrams = extend({
                apiKey: apiKey
            }, params || {})

            if(newPrams.useServerTime){
                const timestamp = await this.time();
                newPrams['timestamp'] = timestamp
            }
            newPrams['timestamp'] = defaultGetTime();
            if (newPrams) {
                delete newPrams.useServerTime
            }

            const signature = await generateSignature(toUrlParams(newPrams), apiSecret);
            newPrams['signature'] = signature;
            const parameters = {
                id,
                method,
                params: newPrams
            }
            
            return new Promise((resolve, reject) => {
                this.socket.send(JSON.stringify(parameters));
                this.requestList[id] = { resolve, reject };
            });
        }

        this.request = async (id: string, method: string, params: any = {}, addApiKey?: boolean) => {
            if(addApiKey){
                params = extend(params, {
                    apiKey
                })
            }
            const parameters = {
                id,
                method,
                params
            }
            return new Promise((resolve) => {
                this.socket.send(JSON.stringify(parameters));
                this.requestList[id] = resolve
            });
        }

        this.connect = () => {
            try {
                if(this.connected){
                    this.dispatchEvent('error', 'websocket already connected');
                    return;
                }
                this.connectWebSocket(Ws || webSocket);
            } catch (e){
                this.dispatchEvent('error', 'error connecting websocket');
            }
        }

        if(!Ws && !webSocket){
            this.dispatchEvent('error', 'Please add webWocket parameter');
        } else {
            this.connect();
        }
    }

    connectWebSocket(webSocket: undefined) {
        this.socket = new ReconnectingWebSocket( "wss://ws-api.binance.com:443/ws-api/v3", [], {
            WebSocket: webSocket,
            connectionTimeout: 4e3,
            debug: false,
            maxReconnectionDelay: 10e3,
            maxRetries: Infinity,
            minReconnectionDelay: 4e3,
        });

        const pong = () => this.socket._ws.pong(() => null)

        this.socket.onopen = () => {
            this.dispatchEvent('connected')
            this.pingTimeout = setTimeout(() => {
                this.ping();
            }, 1000 * 60 * 59)
            this.connected = true;
            if (this.socket._ws.on) {
                this.socket._ws.on('ping', pong)
            }
        }

        this.socket.onclose = () => {
            this.connected = false;
            this.dispatchEvent('disconnected');
        }

        this.socket.onerror = () => {
            this.dispatchEvent('connectionError')
        }

        this.socket.onmessage = (event: MessageEvent) => {
            try {
                const json = JSON.parse(event.data);
                const { id, status, error, result, rateLimits } = json;

                if(rateLimits && Array.isArray(rateLimits) && rateLimits.length > 0){
                    const rateLimit = rateLimits.shift();
                    const { count, limit } = rateLimit;

                    this.rateLimit.count = count;
                    this.rateLimit.limit = limit;
                    this.rateLimit.remain = limit - count;
                }

                if(!Object.hasOwnProperty.call(this.requestList, id)){
                    return;
                }
                if(typeof this.requestList[id] === 'function'){
                    this.requestList[id](result);
                } else if(typeof this.requestList[id] === 'object'){
                    const { resolve, reject } = this.requestList[id];
                    if(status !== 200){
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
                delete this.requestList[id];
            } catch (err: any) {
                this.dispatchEvent('error', err.message);
            }
        }
    }

    async time(){
        try {
            const id = generateId();
            const method = 'time';
            const result = await this.request(id, method)
            return result.serverTime;
        } catch(e: any){
            this.dispatchEvent('error', e.message);
        }
    }

    async orderTest(params: any): Promise<any>{
        return this.privateRequest(generateId(), 'order.test', params);
    }

    async order(params: any): Promise<any>{
        return this.privateRequest(generateId(), 'order.place', params);
    }

    async getOrder(params: any): Promise<any>{
        return this.privateRequest(generateId(), 'order.status', params);
    }

    async cancelOrder(params: any): Promise<any>{
        return this.privateRequest(generateId(), 'order.cancel', params);
    }

    async cancelAndReplaceOrder(params: any): Promise<any>{
        return this.privateRequest(generateId(), 'order.cancelReplace', params);
    }

    async openOrders(params: any): Promise<any>{
        return this.privateRequest(generateId(), 'openOrders.status', params);
    }

    async cancelOpenOrders(params: any): Promise<any>{
        return this.privateRequest(generateId(), 'openOrders.cancelAll', params);
    }

    async orderOco(params: any): Promise<any>{
        return this.privateRequest(generateId(), 'orderList.place', params);
    }

    async getOrderOco(params: any): Promise<any>{
        return this.privateRequest(generateId(), 'orderList.status', params);
    }

    async cancelOrderOco(params: any): Promise<any>{
        return this.privateRequest(generateId(), 'orderList.cancel', params);
    }

    async openOrdersOco(params: any): Promise<any>{
        return this.privateRequest(generateId(), 'openOrderLists.status', params);
    }

    async accountInfo(){
        return this.privateRequest(generateId(), 'account.status');
    }

    async getOrderRateLimits(){
        return this.privateRequest(generateId(), 'account.rateLimits.orders');
    }

    async allOrders(params: any): Promise<any>{
        return this.privateRequest(generateId(), 'allOrders', params);
    }

    async allOrdersOCO(params: any): Promise<any>{
        return this.privateRequest(generateId(), 'allOrderLists', params);
    }

    async myTrades(params: any): Promise<any>{
        return this.privateRequest(generateId(), 'myTrades', params);
    }

    async myPreventedMatches(params: any): Promise<any>{
        return this.privateRequest(generateId(), 'myPreventedMatches', params);
    }

    async getDataStream(): Promise<string | undefined>{
        try {
            const result = await this.request(generateId(), 'userDataStream.start', {}, true);
            if(!result) return undefined;
            const { listenKey } = result;
            return listenKey || undefined;
        } catch(e){
            return undefined;
        }
    }

    async ping(listenKey?: string): Promise<boolean>{
        listenKey = listenKey ? listenKey : await this.getDataStream();
        if(!listenKey){
            return false;
        }
        await this.request(generateId(), 'userDataStream.ping', {
            listenKey: listenKey
        }, true);
        return true;
    }

    async keepDataStream(listenKey?: string): Promise<boolean>{
        return this.ping(listenKey)
    }

    async closeDataStream(listenKey?: string): Promise<boolean>{
        listenKey = listenKey ? listenKey : await this.getDataStream();
        if(!listenKey){
            return false;
        }
        await this.request(generateId(), 'userDataStream.stop', {
            listenKey: listenKey
        }, true);
        return true;
    }

    async exchangeInfo(params: any): Promise<any>{
        return this.request(generateId(), 'exchangeInfo', params);
    }
}
