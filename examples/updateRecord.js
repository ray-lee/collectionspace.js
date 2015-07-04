/*
 * Update a collectionobject.
 */

var CollectionSpace = require('../lib/collectionspace');
var util = require('util');

var cspace = new CollectionSpace({
  host: 'demo.collectionspace.org'
});

cspace.connect('admin@core.collectionspace.org', 'Administrator')
  .then(function() {
    return cspace.updateRecord('collectionobject', '0c859c44-7b92-4bca-91bf', {
      fields: {
        objectNumber: '2015.7.3',
        comments: [{
          comment: "Record updated by collectionspace.js on " + (new Date()).toString()
        }]
      }
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
