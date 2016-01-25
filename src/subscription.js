var RHSubscription = require( 'realizehit-subscription' )
var Promise = require( 'bluebird' )

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
