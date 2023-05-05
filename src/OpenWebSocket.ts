import ReconnectingWebSocket from 'reconnecting-websocket'

export default (url: string, webSocket: WebSocket, opts?: any) => {
    const socket: any = new ReconnectingWebSocket(url, [], {
      WebSocket: webSocket,
      connectionTimeout: 4e3,
      debug: false,
      maxReconnectionDelay: 10e3,
      maxRetries: Infinity,
      minReconnectionDelay: 4e3,
      ...opts,
    })

    const pong = () => socket._ws.pong(() => null)
  
    socket.addEventListener('open', () => {
        if (socket._ws.on) {
            socket._ws.on('ping', pong)
        }
    })

    return socket
}