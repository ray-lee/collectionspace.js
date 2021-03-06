var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

var expect = chai.expect;
var CollectionSpace = require('../lib/CollectionSpace.js');

describe('CollectionSpace', function() {
  var HOST = 'demo.collectionspace.org';
  var USERNAME = 'admin@core.collectionspace.org';
  var PASSWORD = 'Administrator';
  
  var BAD_HOST = HOST + 'abc';
  var BAD_PASSWORD = PASSWORD + 'xyz';
  
  var VOCABULARY_SHORT_ID = 'currency';
  
  var RECORD_TYPE = 'collectionobject';
  var RECORD_CSID = '0c859c44-7b92-4bca-91bf';
  var UPDATE_CSID = '0c859c44-7b92-4bca-91bf';
  var BAD_RECORD_CSID = 'foobar';
  
  var AUTHORITY_FIELD_NAME = 'inscriptionContentInscriber';
  var AUTHORITY_SEARCH_STRING = 'john';
  
  var SEARCH_KEYWORDS = 'school photographs';
  
  this.timeout(20000);
    
  describe('#connect()', function() {
    var cspace;
    
    it('should error when the host is unreachable', function() {
      cspace = new CollectionSpace({
        host: BAD_HOST
      });
      
      return cspace.connect(USERNAME, PASSWORD).should.eventually.be.rejectedWith(/ENOTFOUND/);
    });
    
    it('should error when the username/password is incorrect', function() {
      cspace = new CollectionSpace({
        host: HOST
      });
      
      return cspace.connect(USERNAME, BAD_PASSWORD).should.eventually.be.rejectedWith(/ELOGINFAILED/);
    });
    
    it('should return a connection status when successful', function() {
      cspace = new CollectionSpace({
        host: HOST
      });
      
      return(
        cspace.connect(USERNAME, PASSWORD).should.eventually
          .contain.all.keys('userId', 'screenName', 'permissions', 'login', 'maxInactive')
          .and.have.property('userId', USERNAME)
      );
    });
  });
  
  describe('#disconnect()', function() {
    var cspace;
    
    before(function() {
      cspace = new CollectionSpace({
        host: HOST
      });
    });
    
    it('should return true when successful', function() {
      return cspace.connect(USERNAME, PASSWORD).then(function() {
        return cspace.disconnect().should.eventually.be.true;
      });
    });

    it('should be successful when not connected', function() {
      return cspace.disconnect().should.eventually.be.true;
    });
  });
  
  describe('#getConnectionStatus()', function() {
    var cspace;
    
    before(function() {
      cspace = new CollectionSpace({
        host: HOST
      });
    });

    it('should initially be have a false login property', function() {
      return(
        cspace.getConnectionStatus().should.eventually
          .have.property('login', false)
      );
    });
    
    it('should have a true login property after connecting', function() {
      return cspace.connect(USERNAME, PASSWORD).then(function() {
        return(
          cspace.getConnectionStatus().should.eventually
            .have.property('login', true)
        );
      });
    });

    it('should have a false login property after disconnecting', function() {
      return cspace.connect(USERNAME, PASSWORD).then(function() {
        return cspace.disconnect().then(function() {
          return(
            cspace.getConnectionStatus().should.eventually
              .have.property('login', false)
          );
        });
      });
    });
    
    it('should return a cached status on consecutive calls', function() {
      return cspace.connect(USERNAME, PASSWORD).then(function() {
        return cspace.disconnect().then(function() {
          return cspace.getConnectionStatus().then(function(status1) {
            return(
              cspace.getConnectionStatus().should.eventually.equal(status1)
            );
          });
        });
      });
    });
  });
  
  describe('#getVocabulary()', function() {
    var cspace;
    
    before(function() {
      cspace = new CollectionSpace({
        host: HOST
      });
    });

    it('should error when not connected', function() {
      return cspace.getVocabulary(VOCABULARY_SHORT_ID).should.eventually.be.rejectedWith(/ENOTCONNECTED/);
    });
    
    it('should return a record with the correct short id', function() {
      return cspace.connect(USERNAME, PASSWORD).then(function() {
        return (
          cspace.getVocabulary(VOCABULARY_SHORT_ID).should.eventually
            .have.property('fields')
            .and.contain.all.keys('shortIdentifier', 'terms')
            .and.have.property('shortIdentifier', VOCABULARY_SHORT_ID)
        );
      });
    });
  });
 
  describe('#getRecord()', function() {
    var cspace;
    
    before(function() {
      cspace = new CollectionSpace({
        host: HOST
      });
    });

    it('should error when not connected', function() {
      return cspace.getRecord(RECORD_TYPE, RECORD_CSID).should.eventually.be.rejectedWith(/ENOTCONNECTED/);
    });
    
    it('should return a record with the correct csid', function() {
      return cspace.connect(USERNAME, PASSWORD).then(function() {
        return (
          cspace.getRecord(RECORD_TYPE, RECORD_CSID).should.eventually
            .contain.all.keys(['csid', 'fields'])
            .and.have.property('csid', RECORD_CSID)
        );
      });
    });
    
    it('should error when a record is not found with the csid', function() {
      return cspace.getRecord(RECORD_TYPE, BAD_RECORD_CSID).should.eventually.be.rejectedWith(/Does not exist/);
    });
  });
  
  describe('#createRecord()', function() {
    var cspace;
    
    before(function() {
      cspace = new CollectionSpace({
        host: HOST
      });
    });

    var now = new Date();
    var objectNumber = now.getFullYear() + '.' + (now.getMonth() + 1) + '.' + now.getDate();
    
    var data = {
      fields: {
        objectNumber: objectNumber,
        briefDescriptions: [{
          briefDescription: 'Record created by collectionspace.js'
        }]
      }
    };
    
    it('should error when not connected', function() {
      return cspace.createRecord(RECORD_TYPE, data).should.eventually.be.rejectedWith(/ENOTCONNECTED/);
    });
    
    it('should return a record with a csid and the correct data', function() {
      return cspace.connect(USERNAME, PASSWORD).then(function() {
        return (
          cspace.createRecord(RECORD_TYPE, data).should.eventually
            .contain.all.keys(['csid', 'fields'])
            .and.have.deep.property('fields.objectNumber', objectNumber)
        );
      });
    });
  });
  
  describe('#updateRecord()', function() {
    var cspace;
    
    before(function() {
      cspace = new CollectionSpace({
        host: HOST
      });
    });

    var now = new Date();
    var objectNumber = now.getFullYear() + '.' + (now.getMonth() + 1) + '.' + now.getDate();
    var comment = 'Record updated by collectionspace.js on ' + now.toString();
    
    var data = {
      fields: {
        objectNumber: objectNumber,
        comments: [{
          comment: comment
        }]
      }
    };
    
    it('should error when not connected', function() {
      return cspace.updateRecord(RECORD_TYPE, data).should.eventually.be.rejectedWith(/ENOTCONNECTED/);
    });
    
    it('should return a record with the correct csid and the updated data', function() {
      return cspace.connect(USERNAME, PASSWORD).then(function() {
        return (
          cspace.updateRecord(RECORD_TYPE, UPDATE_CSID, data).should.eventually
            .contain.all.keys(['csid', 'fields'])
            .and.have.deep.property('fields.comments.0.comment', comment)
        );
      });
    });
  });
  
  describe('#findTerms()', function() {
    var cspace;
    
    before(function() {
      cspace = new CollectionSpace({
        host: HOST
      });
    });
    
    it('should error when not connected', function() {
      return cspace.findTerms(RECORD_TYPE, AUTHORITY_FIELD_NAME, AUTHORITY_SEARCH_STRING).should.eventually.be.rejectedWith(/ENOTCONNECTED/);
    });
    
    it('should return a list of results', function() {
      return cspace.connect(USERNAME, PASSWORD).then(function() {
        return (
          cspace.findTerms(RECORD_TYPE, AUTHORITY_FIELD_NAME, AUTHORITY_SEARCH_STRING).should.eventually
            .be.an('array')
            .and.have.property(0)
            .which.contains.all.keys(['csid', 'displayNames', 'type', 'baseUrn', 'namespace'])
        );
      });
    });
  });
  
  describe('#findTermsUsed()', function() {
    var cspace;
    
    before(function() {
      cspace = new CollectionSpace({
        host: HOST
      });
    });
    
    it('should error when not connected', function() {
      return cspace.findTermsUsed(RECORD_TYPE, RECORD_CSID).should.eventually.be.rejectedWith(/ENOTCONNECTED/);
    });
    
    it('should return results', function() {
      return cspace.connect(USERNAME, PASSWORD).then(function() {
        return (
          cspace.findTermsUsed(RECORD_TYPE, RECORD_CSID).should.eventually
            .be.an('object')
            .and.have.property('termsUsed')
            .which.contains.all.keys(['results', 'pagination'])
        );
      });
    });
  });
  
  describe('#search()', function() {
    var cspace;
    
    before(function() {
      cspace = new CollectionSpace({
        host: HOST
      });
    });
    
    it('should error when not connected', function() {
      return cspace.search(RECORD_TYPE, SEARCH_KEYWORDS).should.eventually.be.rejectedWith(/ENOTCONNECTED/);
    });
    
    it('should return results', function() {
      return cspace.connect(USERNAME, PASSWORD).then(function() {
        return (
          cspace.search(RECORD_TYPE, SEARCH_KEYWORDS).should.eventually
            .be.an('object')
            .and.have.property('results')
        );
      });
    });
  });
});