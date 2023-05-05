import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';
import polyfillNode from 'rollup-plugin-polyfill-node';
import inject from '@rollup/plugin-inject';

export default {
    input: './src/index.ts',
    output: [
        {
            file: 'dist/binance-websocket-api-iife.js',
            format: 'iife',
            name: 'BinanceWebSocketApi',
            sourcemap: true
        },
        {
            file: 'dist/binance-websocket-api-amd.js',
            format: 'amd',
            name: 'BinanceWebSocketApi',
            sourcemap: true
        },
        {
            file: 'dist/binance-websocket-api-cjs.js',
            format: 'cjs',
            sourcemap: true
        },
        {
            file: 'dist/binance-websocket-api.mjs',
            format: 'es',
            sourcemap: true
        },
        {
            file: 'dist/binance-websocket-api-mjs.js',
            format: 'es',
            sourcemap: true
        },
        {
            file: 'dist/binance-websocket-api-umd.js',
            format: 'umd',
            name: 'BinanceWebsocketApi',
            sourcemap: true
          }
    ],
    plugins: [
        polyfillNode(),
        inject({
            include: 'node_modules/crypto-es/**',
            CryptoJS: 'crypto-es',
        }),
        resolve(
            { browser: true, mainFields: ['module', 'browser'] }
        ),
        commonjs(),
        typescript(),
        terser()
    ]
};