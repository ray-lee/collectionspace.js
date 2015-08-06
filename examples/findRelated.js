/*
 * Find media records related to a collectionobject, and print them to the console.
 */

var CollectionSpace = require('../lib/collectionspace');
var util = require('util');

var cspace = new CollectionSpace({
  host: 'demo.collectionspace.org'
});

cspace.connect('admin@core.collectionspace.org', 'Administrator')
  .then(function() {
    return cspace.findRelated('collectionobject', '0c859c44-7b92-4bca-91bf', 'media', {
      pageSize: 10,
      pageNum: 0
    });
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
