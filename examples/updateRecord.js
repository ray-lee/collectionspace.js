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
    return cspace.updateRecord('collectionobject', 'cc2f452f-8baf-445a-9160', {
      fields: {
        objectNumber: '2015.4.24',
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
