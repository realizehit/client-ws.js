# realizehit-socket-js-client

realizehit socket client for Javascript

NOTE: can be used on *nodejs*, *io.js* and *browsers*.



## Installation

### npm

```bash
npm i --save realizehit-socket-js-client
```

####

## Usage

```js

var RealizeHit = require( 'realizehit-socket-js-client' );

var realizehit = new RealizeHit({
        endpoint: 'server-or-lb.example.com',
    });

```

We believe that we should not being trapped on `channel/event` approach like
*Pusher* is, so we adopted for an **your app, your rules** approach.



### Subscribing

You could
