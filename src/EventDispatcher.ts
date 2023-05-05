class EventDispatcher {

    _listeners: any = {}

    addEventListener( type: string, listener: any ): void {

        if ( this._listeners === undefined ) this._listeners = {};

        const listeners = this._listeners;

        if ( listeners[ type ] === undefined ) {

            listeners[ type ] = [];

        }

        if ( listeners[ type ].indexOf( listener ) === - 1 ) {

            listeners[ type ].push( listener );

        }

    }

    on(type: string, listener: any): void {
        this.addEventListener(type, listener);
    }

    hasEventListener( type: string, listener: any ): boolean {

        if ( this._listeners === undefined ) return false;

        const listeners = this._listeners;

        return listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== - 1;

    }

    removeEventListener( type: string, listener: any ): void{

        if ( this._listeners === undefined ) return;

        const listeners = this._listeners;
        const listenerArray = listeners[ type ];

        if ( listenerArray !== undefined ) {

            const index = listenerArray.indexOf( listener );

            if ( index !== - 1 ) {

                listenerArray.splice( index, 1 );

            }

        }

    }

    dispatchEvent( ..._args: any[] ): void {
        if( arguments.length === 0 ) return;
        if ( this._listeners === undefined ) return;

        const type: string = _args[ 0 ];
        const args: any[] = [];
        for (let i = 1; i < _args.length; i++) args.push(_args[i]);

        const listeners = this._listeners;
        const listenerArray = listeners[ type ];

        if ( listenerArray !== undefined ) {

            // Make a copy, in case listeners are removed while iterating.
            const array = listenerArray.slice( 0 );

            for ( let i = 0, l = array.length; i < l; i ++ ) {
                const handler = array[ i ]
                if (typeof handler === 'function') {
                    Function.prototype.apply.call( handler, this, args);
                } else {
                    for (let j = 0; j < args.length; j++) {
                        array[ i ].call( this, args[j] );
                    }
                }
            }

        }

    }

}
export default EventDispatcher;
