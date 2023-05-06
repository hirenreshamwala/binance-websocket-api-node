# binance-websocket-api-node

### Installation

    yarn add binance-websocket-api-node

### Getting started

Import the module and create a new client. Passing api keys is optional only if
you don't plan on doing authenticated calls. Check the binance documentation
[here](https://binance-docs.github.io/apidocs/websocket_api/en/#change-log).

## Note

WebSocket api allows only spot trading

```js
import webSocket from "ws";
import BinanceWebSocketApi from 'binance-websocket-api-node'

const client = new BinanceWebSocketApi({
    webSocket: webSocket,
})

// Authenticated client, can make signed calls
const client2 = new BinanceWebSocketApi({
  apiKey: 'xxx',
  apiSecret: 'xxx',
  webSocket: webSocket,
})

client.time().then(time => console.log(time))
```


Every method returns a Promise, making this library [async await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) ready.
Following examples will use the `await` form, which requires some configuration you will have to lookup.

### Table of Contents
- [Init](#init)
- [Public Endpoints](#public-rest-endpoints)
  - [ping](#ping)
  - [time](#time)
  - [exchangeInfo](#exchangeinfo)
- [Authenticated Endpoints](#authenticated-endpoints)
  - [order](#order)
  - [orderTest](#ordertest)
  - [orderOco](#orderoco)
  - [getOrder](#getorder)
  - [getOrderOco](#getorderoco)
  - [cancelOrder](#cancelorder)
  - [cancelOrderOco](#cancelorderoco)
  - [cancelOpenOrders](#cancelOpenOrders)
  - [cancelAndReplaceOrder](#cancelAndReplaceOrder)
  - [openOrders](#openorders)
  - [openOrdersOco](#openOrdersOco)
  - [allOrders](#allorders)
  - [allOrdersOCO](#allordersoco)  
  - [accountInfo](#accountinfo)
  - [myTrades](#mytrades)
  - [getOrderRateLimits](#getOrderRateLimits)
  - [myPreventedMatches](#myPreventedMatches)
- [Websockets](#websockets)
  - [user](#user)

### Init

| Param       | Type     | Required | Info                                         |
| ----------- | -------- | -------- | -------------------------------------------- |
| apiKey      | String   | false    | Required when making private calls           |
| apiSecret   | String   | false    | Required when making private calls           |
| webSocket   | Object   | true     | Required to communicate with server          |


### Public REST Endpoints

#### ping

Test connectivity to the API.

```js
console.log(await client.ping())
```

#### time

Test connectivity to the Rest API and get the current server time.

```js
console.log(await client.time())
```

<details>
<summary>Output</summary>

```js
1508478457643
```

</details>

#### exchangeInfo

Get the current exchange trading rules and symbol information. You can optionally
pass a symbol to only retrieve info of this specific one.

```js
console.log(await client.exchangeInfo())
```

### Authenticated Endpoints


#### order

Creates a new order. [Doc](https://binance-docs.github.io/apidocs/websocket_api/en/#place-new-order-trade)

```js
console.log(
  await client.order({
    symbol: "BTCUSDT",
    side: "SELL",
    type: "LIMIT",
    timeInForce: "GTC",
    price: "23416.10000000",
    quantity: "0.00847000",
  }),
)
```

#### orderTest

Test order placement. This API does not return any output on success. 
Validates new order parameters and verifies your signature but does not send the order into the matching engine.


#### orderOco

Creates a new OCO order. [Doc](https://binance-docs.github.io/apidocs/websocket_api/en/#place-new-oco-trade)

```js
console.log(
  await client.orderOco({
    symbol: "BTCUSDT",
    side: "SELL",
    price: "23420.00000000",
    quantity: "0.00650000",
    stopPrice: "23410.00000000",
    stopLimitPrice: "23405.00000000",
    stopLimitTimeInForce: "GTC",
    newOrderRespType: "RESULT",
  }),
)
```

#### getOrder

Check an order's status. [Doc](https://binance-docs.github.io/apidocs/websocket_api/en/#query-order-user_data)

```js
console.log(
  await client.getOrder({
    symbol: 'BTCUSDT',
    orderId: 12569099453,
  }),
)
```

#### getOrderOco

Retrieves a specific OCO based on provided optional parameters [Doc](https://binance-docs.github.io/apidocs/websocket_api/en/#query-oco-user_data)

```js
console.log(
  await client.getOrderOco({
    origClientOrderId: "08985fedd9ea2cf6b28996"
  }),
)
```

#### cancelOrder

Cancels an active order. [Doc](https://binance-docs.github.io/apidocs/websocket_api/en/#cancel-order-trade)

```js
console.log(
  await client.cancelOrder({
    symbol: 'BTCUSDT',
    origClientOrderId: "4d96324ff9d44481926157",
  }),
)
```

#### cancelOrderOco

Cancel an entire Order List. [Doc](https://binance-docs.github.io/apidocs/websocket_api/en/#cancel-oco-trade)

```js
console.log(
  await client.cancelOrderOco({
    symbol: "BTCUSDT",
    orderListId: 1274512,
  }),
)
```

#### cancelOpenOrders

Cancel all open orders on a symbol, including OCO orders.  [Doc](https://binance-docs.github.io/apidocs/websocket_api/en/#cancel-open-orders-trade)

```js
console.log(
  await client.cancelOpenOrders({
    symbol: 'BTCUSDT'
  }),
)
```

#### openOrders 

Query execution status of all open orders. [Doc](https://binance-docs.github.io/apidocs/websocket_api/en/#current-open-orders-user_data)

```js
console.log(
  await client.openOrders({
    symbol: 'BTCUSDT',
  }),
)
```

#### allOrders

Query information about all your orders – active, canceled, filled – filtered by time range. [Doc](https://binance-docs.github.io/apidocs/websocket_api/en/#account-order-history-user_data)

```js
console.log(
  await client.allOrders({
    symbol: "BTCUSDT",
    startTime: 1660780800000,
    endTime: 1660867200000,
    limit: 5,
  }),
)
```

#### allOrdersOCO

Query information about all your OCOs, filtered by time range. [Doc](https://binance-docs.github.io/apidocs/websocket_api/en/#account-oco-history-user_data)

```js
console.log(
  await client.allOrdersOCO({
    startTime: 1660780800000,
    endTime: 1660867200000,
    limit: 5,
  }),
)
```

#### accountInfo

Query information about your account. [Doc](https://binance-docs.github.io/apidocs/websocket_api/en/#account-information-user_data)

```js
console.log(await client.accountInfo())
```

#### myTrades

Query information about all your trades, filtered by time range. [Doc](https://binance-docs.github.io/apidocs/websocket_api/en/#account-trade-history-user_data)

```js
console.log(
  await client.myTrades({
    symbol: "BTCUSDT",
    startTime: 1660780800000,
    endTime: 1660867200000,
  }),
)
```

### WebSockets

Every websocket utility returns a function you can call to close the opened
connection and avoid memory issues.

#### user

Live user data feed (Account Update, Balance Update, Order Update).

**Requires authentication**

```js
const clean = await client.ws.user(msg => {
  console.log(msg)
})
```