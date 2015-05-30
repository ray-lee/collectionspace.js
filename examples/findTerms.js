/*
 * Search an authority for terms matching a string, and print them to the console.
 */

var CollectionSpace = require('../lib/collectionspace');
var util = require('util');

var cspace = new CollectionSpace({
  host: 'demo.collectionspace.org'
});

cspace.connect('admin@core.collectionspace.org', 'Administrator')
  .then(function() {
    return cspace.findTerms('collectionobject', 'inscriptionContentInscriber', 'john');
  })
  .then(function(data) {
    console.log(util.inspect(data, {
      depth: 6,
      colors: true
    }));

    return cspace.disconnect();
  })
  .then(null, function(error) {
    console.error(error);
  });
