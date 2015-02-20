A prototype CollectionSpace client for JavaScript, for use in Node.js and the browser.

# Installation

[Node.js](http://nodejs.org/) must be installed.

```
$ git clone https://github.com/ray-lee/collectionspace.js
$ cd collectionspace.js
$ npm install
$ npm test
```

# Usage

All methods are asynchronous, and return a [Promises/A+](https://github.com/promises-aplus/promises-spec) compliant [promise](http://www.html5rocks.com/en/tutorials/es6/promises/), created with the [Q](http://documentup.com/kriskowal/q/) library.

See the [examples](https://github.com/ray-lee/collectionspace.js/tree/master/examples) for usage in Node.js.

To run an example:

```
$ node examples/read.js
```

To use in the browser, create a package using [webpack](http://webpack.github.io/) or [browserify](http://browserify.org/).
