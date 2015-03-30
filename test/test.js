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
  
  var RECORD_TYPE = 'cataloging';
  var RECORD_CSID = '0f72eb05-ebc3-477f-86d0';
  var BAD_RECORD_CSID = 'foobar';
  
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
    
    it('should return true when successful', function() {
      cspace = new CollectionSpace({
        host: HOST
      });
      
      return cspace.connect(USERNAME, PASSWORD).should.eventually.be.true;
    });
  });
  
  describe('#disconnect()', function() {
    var cspace;
    
    before(function() {
      cspace = new CollectionSpace({
        host: HOST
      });
    });
    
    it('should error when not connected', function() {
      return cspace.disconnect().should.eventually.be.rejectedWith(/ENOTCONNECTED/);
    });
    
    it('should return true when successful', function() {
      return cspace.connect(USERNAME, PASSWORD).then(function() {
        return cspace.disconnect().should.eventually.be.true;
      });
    });
  });
  
  describe('#connected', function() {
    var cspace;
    
    before(function() {
      cspace = new CollectionSpace({
        host: HOST
      });
    });

    it('should initially be false', function() {
      cspace.connected.should.be.false;
    });
    
    it('should be true after connecting', function() {
      return cspace.connect(USERNAME, PASSWORD).then(function() {
        cspace.connected.should.be.true;
      });
    });
    
    it('should be false after disconnecting', function() {
      return cspace.connect(USERNAME, PASSWORD).then(function() {
        return cspace.disconnect().then(function() {
          cspace.connected.should.be.false;
        });
      });
    });
  });
  
  describe('#username', function() {
    var cspace;
    
    before(function() {
      cspace = new CollectionSpace({
        host: HOST
      });
    });

    it('should initially be null', function() {
      expect(cspace.username).to.be.null;
    });
    
    it('should be the logged in username after connecting', function() {
      return cspace.connect(USERNAME, PASSWORD).then(function() {
        cspace.username.should.equal(USERNAME);
      });
    });
    
    it('should be null after disconnecting', function() {
      return cspace.connect(USERNAME, PASSWORD).then(function() {
        return cspace.disconnect().then(function() {
          expect(cspace.username).to.be.null;
        });
      });
    });
  });
  
  describe('#getRecord', function() {
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
        return 
          cspace.getRecord(RECORD_TYPE, RECORD_CSID).should.eventually
            .have.property('csid', RECORD_CSID)
            .and.have.property('fields');
      });
    });
    
    it('should error when a record is not found with the csid', function() {
      return cspace.getRecord(RECORD_TYPE, BAD_RECORD_CSID).should.eventually.be.rejectedWith(/Does not exist/);
    });
  });
});