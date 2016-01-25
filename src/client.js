var EngineIOClient = require( 'engine.io-client' )
var assign = require( 'object-assign' )
var URI = require( 'uri-js' )
var Promise = require( 'bluebird' )
var Subscription = require( 'realizehit-subscription' )
var EventEmitter = require( 'events' ).EventEmitter

var defaultOptions = {
    uri: undefined,
    path: '/ws',
    actionTimeout: 5 * 1000, // 5 seconds
    subpayJoinerChar: '?'
}

function WSClient ( options ) {
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
        var subpaySplit = subpay.split( this.options.subpayJoinerChar, 2 )
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
}

WSClient.prototype = Object.create( EventEmitter.prototype )
module.exports = WSClient

WSClient.prototype.close =
WSClient.prototype.disconnect =
    function WSClient$close () {
        this.engine.close()
    }
