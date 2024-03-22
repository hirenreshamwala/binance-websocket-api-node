import OpenWebSocket from "./OpenWebSocket";

const endpoints = {
  base: "wss://stream.binance.com:9443/ws",
};

const userOpenHandler =
  (cb: any, transform = true) =>
  () => {
    cb({ [transform ? "eventType" : "type"]: "open" });
  };

  const userCloseHandler =
  (cb: any, transform = true) =>
  () => {
    cb({ [transform ? "eventType" : "type"]: "close" });
  };

const userErrorHandler =
  (cb: any, transform = true) =>
  (error: any) => {
    cb({ [transform ? "eventType" : "type"]: "error", error });
  };

const userTransforms: any = {
  // https://github.com/binance-exchange/binance-official-api-docs/blob/master/user-data-stream.md#balance-update
  balanceUpdate: (m: any) => ({
    asset: m.a,
    balanceDelta: m.d,
    clearTime: m.T,
    eventTime: m.E,
    eventType: "balanceUpdate",
  }),
  // https://github.com/binance-exchange/binance-official-api-docs/blob/master/user-data-stream.md#account-update
  outboundAccountInfo: (m: any) => ({
    eventType: "account",
    eventTime: m.E,
    makerCommissionRate: m.m,
    takerCommissionRate: m.t,
    buyerCommissionRate: m.b,
    sellerCommissionRate: m.s,
    canTrade: m.T,
    canWithdraw: m.W,
    canDeposit: m.D,
    lastAccountUpdate: m.u,
    balances: m.B.reduce((out: any, cur: any) => {
      out[cur.a] = { available: cur.f, locked: cur.l };
      return out;
    }, {}),
  }),
  // https://github.com/binance-exchange/binance-official-api-docs/blob/master/user-data-stream.md#account-update
  outboundAccountPosition: (m: any) => ({
    balances: m.B.map(({ a, f, l }: any) => ({ asset: a, free: f, locked: l })),
    eventTime: m.E,
    eventType: "outboundAccountPosition",
    lastAccountUpdate: m.u,
  }),
  // https://github.com/binance-exchange/binance-official-api-docs/blob/master/user-data-stream.md#order-update
  executionReport: (m: any) => ({
    eventType: "executionReport",
    eventTime: m.E,
    symbol: m.s,
    newClientOrderId: m.c,
    originalClientOrderId: m.C,
    side: m.S,
    orderType: m.o,
    timeInForce: m.f,
    quantity: m.q,
    price: m.p,
    executionType: m.x,
    stopPrice: m.P,
    trailingDelta: m.d,
    icebergQuantity: m.F,
    orderStatus: m.X,
    orderRejectReason: m.r,
    orderId: m.i,
    orderTime: m.T,
    lastTradeQuantity: m.l,
    totalTradeQuantity: m.z,
    priceLastTrade: m.L,
    commission: m.n,
    commissionAsset: m.N,
    tradeId: m.t,
    isOrderWorking: m.w,
    isBuyerMaker: m.m,
    creationTime: m.O,
    totalQuoteTradeQuantity: m.Z,
    orderListId: m.g,
    quoteOrderQuantity: m.Q,
    lastQuoteTransacted: m.Y,
    trailingTime: m.D,
  }),
  listStatus: (m: any) => ({
    eventType: "listStatus",
    eventTime: m.E,
    symbol: m.s,
    orderListId: m.g,
    contingencyType: m.c,
    listStatusType: m.l,
    listOrderStatus: m.L,
    listRejectReason: m.r,
    listClientOrderId: m.C,
    transactionTime: m.T,
    orders: m.O.map((o: any) => ({
      symbol: o.s,
      orderId: o.i,
      clientOrderId: o.c,
    })),
  }),
};

interface UserOptions {
  getDataStream: () => Promise<string>;
  keepDataStream: (listenKey: string) => Promise<boolean>;
  closeDataStream: (listenKey: string) => Promise<boolean>;
  webSocket: WebSocket;
  emitSocketOpens: boolean;
  emitSocketErrors: boolean;
  emitSocketCloses: boolean;
  emitStreamErrors: boolean;
}

export const userEventHandler =
  (cb: (data: any) => void, transform = true) =>
  (msg: MessageEvent) => {
    const { e: type, ...rest } = JSON.parse(msg.data);

    cb(
      transform && Object.hasOwnProperty.call(userTransforms, type)
        ? userTransforms[type](rest)
        : { type, ...rest }
    );
  };

export const keepStreamAlive = (method: () => Promise<string>) => method;

const user = (opts: UserOptions) => (
  cb: (data: any) => void,
  transform?: boolean
) => {
  if (typeof opts.getDataStream !== "function") {
    return;
  }
  if (typeof opts.keepDataStream !== "function") {
    return;
  }
  if (typeof opts.closeDataStream !== "function") {
    return;
  }
  if (typeof cb !== "function") {
    return;
  }

  let currentListenKey: string | null = null;
  let int: any | null = null;
  let w: any | null = null;
  let keepClosed: boolean = false;
  const errorHandler = userErrorHandler(cb, transform);

  const keepAlive = (isReconnecting: boolean) => {
    if (currentListenKey) {
      opts.keepDataStream(currentListenKey).catch((err: any) => {
        closeStream({}, true);

        if (isReconnecting) {
          setTimeout(() => makeStream(true), 30e3);
        } else {
          makeStream(true);
        }

        if (opts.emitStreamErrors) {
          errorHandler(err);
        }
      });
    }
  };

  const closeStream = (
    options: any,
    catchErrors: boolean,
    setKeepClosed = false
  ) => {
    keepClosed = setKeepClosed;

    if (!currentListenKey) {
      return Promise.resolve();
    }

    clearInterval(int);

    const p = opts.closeDataStream(currentListenKey);

    if (catchErrors) {
      p.catch((f: any) => f);
    }

    w.close(1000, "Close handle was called", { keepClosed: true, ...options });
    currentListenKey = null;

    return p;
  };

  const makeStream = (isReconnecting: boolean) => {
    return (
      !keepClosed &&
      opts
        .getDataStream()
        .then((listenKey: string) => {
          if (keepClosed) {
            return opts.closeDataStream(listenKey).catch(f => f)
          }

          w = OpenWebSocket(`${endpoints.base}/${listenKey}`, opts.webSocket);

          w.onmessage = (msg: MessageEvent) =>
            userEventHandler(cb, transform)(msg);
          if (opts.emitSocketOpens) {
            w.onopen = () => userOpenHandler(cb, transform)();
          }
          if (opts.emitSocketErrors) {
            w.onerror = ({ error }: any) => errorHandler(error);
          }
          if (opts.emitSocketCloses) {
            w.onclose = () => userCloseHandler(cb, transform)();
          }

          currentListenKey = listenKey;

          int = setInterval(() => keepAlive(false), 50e3);

          keepAlive(true);

          return (options: any) => closeStream(options, false, true);
        })
        .catch((err: any) => {
          if (isReconnecting) {
            if (!keepClosed) {
              setTimeout(() => makeStream(true), 30e3);
            }

            if (opts.emitStreamErrors) {
              errorHandler(err);
            }
          } else {
            throw err;
          }
        })
    );
  };

  return makeStream(false);
};

export default (opts: any) => {

    if (opts && opts.wsBase) {
        endpoints.base = opts.wsBase
    }

    return {
        user: user(opts),
    }
}