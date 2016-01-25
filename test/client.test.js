var WSClient = require( '..' )
var WSServer = require( 'realizehit-server-ws' )
var Publisher = require( 'realizehit-publisher' )
var Promise = require( 'bluebird' )
var chai = require( 'chai' )
var expect = chai.expect

// Choose an ephemeral port
var HTTP_PORT = Math.floor( Math.random() * 10000 ) + 30000

describe( "WSClient", function () {

    before(function () {
        this.server = new WSServer({ httpPort: HTTP_PORT })
        this.client = new WSClient( 'http://localhost:' + HTTP_PORT )
        this.publisher = new Publisher()
    })

    after(function () {
        this.server.close()
        delete this.client
        delete this.publisher
    })

    it( "should be connected to the ws server", function () {
        var client = this.client
        return new Promise(function ( fulfill, reject ) {

            if ( client.connected ) {
                return fulfill()
            }

            client.once( 'connected', fulfill )
            client.once( 'error', reject )
        })
        .then(function () {
            expect( client.connected ).to.be.equal( true )
        })
    })

    var pattern = {
            foo: 'bar'
        }

    it( "should subscribe and then subscription should emit subscribed", function () {
        var client = this.client

        return new Promise(function ( fulfill, reject ) {
            var subscription = client.subscribe( pattern )
            subscription.once( 'subscribed', fulfill )
        })
    })

    it( "should receive payload when emitted into a subscribed pattern", function () {
        var self = this
        var publisher = self.publisher
        var subscription = self.client.getSubscription( pattern )

        var payload = 'yolo'

        var rcvdPayloadPromise = new Promise(function ( fulfill, reject ) {
            subscription.once( 'payload', fulfill )
        })

        return publisher.publish( pattern, payload )
        .then(function () { return rcvdPayloadPromise })
        .then(function ( rcvdPayload ) {
            expect( rcvdPayload ).to.be.equal( payload )
        })
    })

    it( "should try to re-subscribe whenever the connection goes down" )
    it( "should unsubscribe and then emit unsubscribed" )
    it( "should NOT receive payload to a pattern we arent subscribed" )


})
