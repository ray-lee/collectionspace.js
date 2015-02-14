var CollectionSpace = require('../lib/collectionspace');
var util = require('util');

var cspace = new CollectionSpace({
  host: 'demo.collectionspace.org'
});

cspace.connect('admin@core.collectionspace.org', 'Administrator')
  .then(function() {
    return cspace.getRecord('cataloging', '0f72eb05-ebc3-477f-86d0');
  })
  .then(function(data) {
    console.log(util.inspect(data, {
      depth: 6,
      colors: true
    }));
  })
  .then(function() {
    cspace.disconnect();
  })
  .then(null, function(error) {
    console.error(error);
  });
