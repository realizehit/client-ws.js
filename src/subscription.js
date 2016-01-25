var RHSubscription = require( 'realizehit-subscription' )
var Promise = require( 'bluebird' )
var assign = require( 'object-assign' )

var debug = require( 'debug' )( 'realizehit:client-ws:subscription' )

function Subscription ( pattern ) {
    var self = this

    // Init it with realizehit-subscription
    RHSubscription.call( this, pattern )

    // Count how many payloads have we served
    self.payloads = 0
    this.on( 'payload', function () {
        self.payloads++
    })

    debug( "Subscription initialized with id", this.id )
}

// Mix RHSubscription into Subcription
Subscription.STATUS = RHSubscription.STATUS
Subscription.Pattern = RHSubscription.Pattern
Subscription.prototype = Object.create( RHSubscription.prototype )

module.exports = Subscription


Subscription.prototype.subscribe = function () {
    var self = this

    if ( self.status === Subscription.STATUS.SUBSCRIBED ) {
        return Promise.cast()
    }

    self.status = Subscription.STATUS.SUBSCRIBING
    self.emit( 'subscribing' )

    var pattern = assign( {}, self.pattern.filters )

    debug( "Subscribing to %s", self.pattern.stringify() )

    return self.client.act( 'sub', { pat: pattern })
    .then(function () {
        self.status = Subscription.STATUS.SUBSCRIBED
        self.emit( 'subscribed' )
    })
}

Subscription.prototype.unsubscribe = function () {
    var self = this

    if ( this.status === Subscription.STATUS.UNSUBSCRIBED ) {
        return Promise.cast()
    }

    this.status = Subscription.STATUS.UNSUBSCRIBING
    this.emit( 'unsubscribing' )

    var pattern = assign( {}, self.pattern.filters )

    debug( "Unsubscribing from %s", self.pattern.stringify() )

    return self.client.act( 'unsub', { pat: pattern })
    .then(function () {
        self.status = Subscription.STATUS.UNSUBSCRIBED
        self.emit( 'unsubscribed' )
    })
}

Subscription.prototype.attachClient = function ( client ) {
    this.client = client
}

Subscription.prototype.deattachClient = function ( client ) {
    delete this.client
}
