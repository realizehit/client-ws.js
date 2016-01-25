var EngineIOClient = require( 'engine.io-client' )
var assign = require( 'object-assign' )
var URI = require( 'uri-js' )
var Promise = require( 'bluebird' )
var Subscription = require( './subscription' )
var EventEmitter = require( 'events' ).EventEmitter
var pattern2id = require( 'realizehit-pattern-to-id' )
var uniqid = require( 'uniqid' )

var debug = require( 'debug' )( 'realizehit:client-ws:client' )

var defaultOptions = {
    uri: undefined,
    path: '/ws',
    actionTimeout: 5 * 1000, // 5 seconds
    subpayJoinerChar: '?',
}

function WSClient ( options ) {
    var self = this

    options = this.options = assign( {}, defaultOptions,
        typeof options === 'string' && { uri: options } ||
        typeof options === 'object' && options ||
        {}
    )

    if ( ! options.uri ) {
        throw new Error( "You must define an API Server endpoint" )
    }

    // Initialize subscriptions holder
    this.subscriptions = {}

    // Parse uri
    this.uri = URI.parse( options.uri )

    // Connect to the WSServer
    var engine = this.engine = new EngineIOClient( options.uri, {
        path: options.path
    })

    engine.on( 'message', function ( subpay ) {
        // Split sub id and payload
        var subpaySplit = subpay.split( self.options.subpayJoinerChar, 2 )
        var _id = subpaySplit[ 0 ]
        var payload = subpaySplit[ 1 ]

        var subscription = self.subscriptions[ _id ]

        if ( ! subscription ) {
            return self.emit( 'error', new Error(
                'Received a subpay message and such subscription does not exist'
            ))
        }

        // Parse payload before emitting
        try {
            payload = JSON.parse( payload )
        } catch ( err ) {
            return self.emit( 'error', new Error(
                'Received a payload could not be parsed'
            ))
        }

        // dispatch to subscription
        subscription.emit( 'payload', payload )
    })

    // Proxy events from engine to client
    // |- engine -> wsclient
    var eventBinding = [
            [ 'open', 'connected' ],
            [ 'close', 'disconnect' ],
            [ 'error', 'error' ]
        ]

    eventBinding.forEach(function ( events ) {
        engine.on( events[0], function () {
            self.emit( events[1] )
        })
    })
}

WSClient.prototype = Object.create( EventEmitter.prototype )
module.exports = WSClient

WSClient.prototype.act = function ( action, data ) {
    var self = this

    if ( typeof action !== 'string' || ! action ) {
        throw TypeError( "You should specify action" )
    }

    data = assign( {},
        typeof data === 'object' && data ||
        {}
    )

    data.id = uniqid()
    data.act = action

    return Promise.cast( data )
    .then( JSON.stringify )
    .then(function ( strMessage ) {
        return new Promise(function ( fulfill, reject ) {

            function stopListeningForMessages () {
                // Stop receiving events, this will avoid event leaks
                self.engine.off( 'message', evalIncomingMessage )
            }

            function evalIncomingMessage ( message ) {

                try {
                    message = JSON.parse( message )
                } catch ( err ) {
                    // Ignore error
                }

                // Ignore message if it isn't what we're expecting
                if ( message.id !== data.id ) return;

                // Seems it is!!!!!1 YUPIII

                // Fulfill promise
                stopListeningForMessages()
                fulfill( message )
            }

            self.engine.on( 'message', evalIncomingMessage )

            // Handle timeout
            setTimeout(function () {
                stopListeningForMessages()
                reject(
                    new Error( "We didn't gather a response, action timed out." )
                )
            }, self.options.actionTimeout )

            // Send data
            self.engine.send( strMessage )
        })
    })
    .then(function ( message ) {
        // Remove id, you wont need it
        delete message.id

        // Check if we received an error, if yes, throw it
        if ( message.err ) {
            throw new Error( message.err )
        }

        return message
    })
}

WSClient.prototype.getSubscription = function WSClient$getSubscription ( pattern, _createNew ) {
    var self = this
    var _id = pattern2id( pattern )

    debug( "Gathering subscription for id %s", _id )

    if ( this.subscriptions[ _id ] ) {
        return this.subscriptions[ _id ]
    }

    if ( ! _createNew ) {
        return false
    }

    var subscription = new Subscription( pattern )
    subscription.attachClient( self )
    self.subscriptions[ subscription.id ] = subscription

    subscription.on( 'destroy', function () {
        subscription.deattachClient( self )
        delete self.subscriptions[ subscription.id ]
    })

    return subscription
}

WSClient.prototype.subscribe = function WSClient$subscribe ( pattern, cb ) {
    var subscription = this.getSubscription( pattern, true )

    subscription.subscribe()

    if ( typeof cb === 'function' ) {
        subscription.on( 'payload', cb )
    }

    return subscription
}

WSClient.prototype.unsubscribe = function WSClient$unsubscribe ( pattern, cb ) {
    var subscription = this.getSubscription( pattern, false )

    if ( ! subscription ) {
        return
    }

    subscription.unsubscribe()

    if ( typeof cb === 'function' ) {
        subscription.off( 'payload', cb )
    }
}

Object.defineProperty( WSClient.prototype, 'connected', {
    get: function () {
        return 'open' === this.engine.readyState
    },
    configurable: false,
    enumerable: true
})

Object.defineProperty( WSClient.prototype, 'disconnected', {
    get: function () {
        return 'open' !== this.engine.readyState
    },
    configurable: false,
    enumerable: true
})

WSClient.prototype.close =
WSClient.prototype.disconnect =
    function WSClient$close () {
        this.engine.close()
    }
