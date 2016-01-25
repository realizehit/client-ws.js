# realizehit-client-ws [![Build Status](https://travis-ci.org/realizehit/client-ws.js.svg?branch=master)](https://travis-ci.org/realizehit/client-ws.js)

realizehit WS Client

## Usage

#### Run as NPM module

```bash
npm i -g realizehit-client-ws
```

```javascript
var WSClient = require( 'realizehit-client-ws' )
var client = new WSClient( 'ws://realizehit.example.com/' )

// Publish something cool
client.subscribe({ kind: 'news', channel: 'CNN' })
    .on( 'subscribed', function () {
        console.log( 'yolo!!1' )
    })
    .on( 'payload', function ( payload ) {
        console.log( payload ) // will log payloads from channel:CNN|kind:news
    })
    .on( 'unsubscribed', function () {
        console.log( 'ohno!!1' )
    })

// Save subscription instead of chaining
var subscription = client.subscribe({ foo: 'bar' })

if ( subscription.subscribing() ) {
    subscription.once( 'subscribed', function () {
        subscription.unsubscribe()
    })
}

```

#### Run from the command-line (WIP)

Not developed, just an idea, want to develop it?

## Contributing

```bash
git clone https://github.com/realizehit/client-ws.js.git
cd client-ws.js
npm install
npm test
```
