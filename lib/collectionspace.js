'use strict';

var Q = require('q');
var SuperAgent = require('superagent');

var DEFAULT_HTTP_PORT = 80;

var DEFAULT_OPTIONS = {
  host: '',
  port: 8180,
  ssl: false,
  tenant: 'core'
};

var SortDir = {
  ASCENDING: 1,
  DESCENDING: 0
};

var DEFAULT_SEARCH_OPTIONS = {
  pageSize: 40,
  pageNum: 0,
  sortKey: null,
  sortDir: SortDir.ASCENDING
};

var API_PATH = '/collectionspace/tenant';
var LOGIN_PATH = '/login';
var LOGOUT_PATH = '/logout';
var LOGIN_STATUS_PATH = '/loginstatus';
var RECORD_READ_PATH = '/basic';
var RECORD_CREATE_PATH = '';
var RECORD_UPDATE_PATH = '';
var VOCABULARY_PATH = '/termlist';
var AUTHORITY_SEARCH_PATH = '/autocomplete';
var TERMS_USED_PATH = '/authorities';
var SEARCH_PATH = '/search';

var CollectionSpace = function(options) {
  options = options || {};
  
  for (var option in DEFAULT_OPTIONS) {
    if (!(option in options)) {
      options[option] = DEFAULT_OPTIONS[option];
    }
  }
  
  if (options.host) {
    this._baseUrl = (options.ssl ? 'https' : 'http') 
      + '://'
      + options.host
      + ((options.port == DEFAULT_HTTP_PORT) ? '' : ':' 
      + options.port);
  }
  else {
    this._baseUrl = '';
  }
  
  this._baseUrl += API_PATH + '/' + options.tenant;
  
  this._agent = getAgent();
  this._connectionStatus = null;
  
  this.SortDir = SortDir;
};

CollectionSpace.prototype.connect = function(username, password) {
  var deferred = Q.defer();
  
  var credentials = {
    userid: username,
    password: password
  };
  
  this._agent
    .post(this._baseUrl + LOGIN_PATH)
    .type('form')
    .send(credentials)
    .end(function(error, response) {
      if (error) {
        deferred.reject(error);
      }
      else {
        // Confirm login status.
        
        this._connectionStatus = null;
        
        this.getConnectionStatus()
          .then(function(data) {
            if (isLoggedIn(data)) {
              deferred.resolve(data);
            }
            else {
              error = new Error();
              error.code = 'ELOGINFAILED';
              error.message = 'login failed (' + error.code + ')';
            
              throw(error);
            }
          }.bind(this))
          .then(null, function(error) {
            deferred.reject(error);
          });
      }
    }.bind(this));
    
  return deferred.promise;
};

CollectionSpace.prototype.getUrl = function() {
  return this._baseUrl;
};

CollectionSpace.prototype.getConnectionStatus = function() {
  var deferred = Q.defer();
  
  if (this._connectionStatus) {
    deferred.resolve(this._connectionStatus);
  }
  else {
    this._agent
      .get(this._baseUrl + LOGIN_STATUS_PATH)
      .end(function(error, response) {
        if (error) {
          deferred.reject(error);
        }
        else {
          this._connectionStatus = getResponseData(response);
        
          deferred.resolve(this._connectionStatus);
        }
      }.bind(this));
  }
  
  return deferred.promise;
};

CollectionSpace.prototype.disconnect = function() {
  var deferred = Q.defer();

  this._agent
    .get(this._baseUrl + LOGOUT_PATH)
    .end(function(error, response) {
      if (error) {
        deferred.reject(error);
      }
      else {
        // Confirm login status.
        
        this._connectionStatus = null;
    
        this.getConnectionStatus()
          .then(function(data) {
            if (!isLoggedIn(data)) {
              this._connectionStatus = data;

              deferred.resolve(true);
            }
            else {
              error = new Error('logout failed');
              error.code = 'ELOGOUTFAILED';
      
              throw(error);
            }
          }.bind(this))
          .then(null, function(error) {
            deferred.reject(error);
          });
      }
    }.bind(this));
  
  return deferred.promise;
};

CollectionSpace.prototype.getRecord = function(recordType, csid) {
  var deferred = Q.defer();

  try {
    this.assertConnected();
    
    recordType = normalizeRecordType(recordType);
    
    this._agent
      .get(this._baseUrl + RECORD_READ_PATH + '/' + recordType + '/' + csid)
      .end(function(error, response) {
        try {
          if (error) {
            throw(error);
          }

          deferred.resolve(getResponseData(response));
        }
        catch(error) {
          deferred.reject(error);
        }
      }.bind(this));
  }
  catch(error) {
    deferred.reject(error);
  }
  
  return deferred.promise;
};

CollectionSpace.prototype.saveRecord = function(recordType, csid, data) {
  return (csid ? this.updateRecord(recordType, csid, data) : this.createRecord(recordType, data));
};

CollectionSpace.prototype.createRecord = function(recordType, data) {
  var deferred = Q.defer();

  try {
    this.assertConnected();
    
    recordType = normalizeRecordType(recordType);
    
    this._agent
      .post(this._baseUrl + RECORD_CREATE_PATH + '/' + recordType + '/')
      .send(data)
      .end(function(error, response) {
        try {
          if (error) {
            throw(error);
          }

          deferred.resolve(getResponseData(response));
        }
        catch(error) {
          deferred.reject(error);
        }
      }.bind(this));
  }
  catch(error) {
    deferred.reject(error);
  }
  
  return deferred.promise;
};

CollectionSpace.prototype.updateRecord = function(recordType, csid, data) {
  var deferred = Q.defer();

  try {
    this.assertConnected();
    
    recordType = normalizeRecordType(recordType);

    this._agent
      .put(this._baseUrl + RECORD_UPDATE_PATH + '/' + recordType + '/' + csid)
      .send(data)
      .end(function(error, response) {
        try {
          if (error) {
            throw(error);
          }

          deferred.resolve(getResponseData(response));
        }
        catch(error) {
          deferred.reject(error);
        }
      }.bind(this));
  }
  catch(error) {
    deferred.reject(error);
  }
  
  return deferred.promise;
};

CollectionSpace.prototype.getVocabulary = function(shortID) {
  var deferred = Q.defer();

  try {
    this.assertConnected();
    
    this._agent
      .get(this._baseUrl + VOCABULARY_PATH + '/' + shortIDToCSID(shortID))
      .end(function(error, response) {
        try {
          if (error) {
            throw(error);
          }

          deferred.resolve(getResponseData(response));
        }
        catch(error) {
          deferred.reject(error);
        }
      }.bind(this));
  }
  catch(error) {
    deferred.reject(error);
  }
  
  return deferred.promise;
};

// TODO: This should take an authority/vocabulary id, instead of a record type/field name,
// but the app layer doesn't provide an API for that. This will have to change when
// this library uses the services API instead of the app layer API.
CollectionSpace.prototype.findTerms = function(recordType, fieldName, searchString) {
  var deferred = Q.defer();

  try {
    this.assertConnected();

    recordType = normalizeRecordType(recordType);
    
    this._agent
      .get(this._baseUrl + '/' + recordType + AUTHORITY_SEARCH_PATH + '/' + fieldName)
      .query({ q: searchString })
      .end(function(error, response) {
        try {
          if (error) {
            throw(error);
          }

          deferred.resolve(getResponseData(response));
        }
        catch(error) {
          deferred.reject(error);
        }
      }.bind(this));
  }
  catch(error) {
    deferred.reject(error);
  }
  
  return deferred.promise;
};

CollectionSpace.prototype.findTermsUsed = function(recordType, csid, searchOptions) {
  var deferred = Q.defer();

  try {
    this.assertConnected();

    recordType = normalizeRecordType(recordType);
    searchOptions = normalizeSearchOptions(searchOptions);
    
    this._agent
      .get(this._baseUrl + '/' + recordType + TERMS_USED_PATH + '/' + csid)
      .query(searchOptions)
      .end(function(error, response) {
        try {
          if (error) {
            throw(error);
          }

          deferred.resolve(getResponseData(response));
        }
        catch(error) {
          deferred.reject(error);
        }
      }.bind(this));
  }
  catch(error) {
    deferred.reject(error);
  }
  
  return deferred.promise;
};

CollectionSpace.prototype.findRelated = function(recordType, csid, relatedRecordType, searchOptions) {
  var deferred = Q.defer();

  try {
    this.assertConnected();

    recordType = normalizeRecordType(recordType);
    relatedRecordType = normalizeRecordType(relatedRecordType);
    searchOptions = normalizeSearchOptions(searchOptions);
    
    this._agent
      .get(this._baseUrl + '/' + recordType + '/' + relatedRecordType + '/' + csid)
      .query(searchOptions)
      .end(function(error, response) {
        try {
          if (error) {
            throw(error);
          }

          deferred.resolve(getResponseData(response));
        }
        catch(error) {
          deferred.reject(error);
        }
      }.bind(this));
  }
  catch(error) {
    deferred.reject(error);
  }
  
  return deferred.promise;
};

CollectionSpace.prototype.search = function(recordType, keywords, searchOptions) {
  var deferred = Q.defer();

  try {
    this.assertConnected();

    recordType = normalizeRecordType(recordType);
    searchOptions = normalizeSearchOptions(searchOptions);
    
    this._agent
      .get(this._baseUrl + '/' + recordType + SEARCH_PATH)
      .query({ query: keywords })
      .query(searchOptions)
      .end(function(error, response) {
        try {
          if (error) {
            throw(error);
          }

          deferred.resolve(getResponseData(response));
        }
        catch(error) {
          deferred.reject(error);
        }
      }.bind(this));
  }
  catch(error) {
    deferred.reject(error);
  }
  
  return deferred.promise;
};

CollectionSpace.prototype.assertConnected = function() {
  if (!this._connectionStatus || !this._connectionStatus.login) {
    var error = new Error();
    error.code = 'ENOTCONNECTED';
    error.message = 'not connected (' + error.code + ')';
 
    throw(error);
  }
};


var shortIDToCSID = function(shortID) {
   return("urn:cspace:name(" + shortID + ")");
};

var getResponseData = function(response) {
  var data;
  
  if ('body' in response && response.body != null) {
    // SuperAgent already parsed a known content type.
    data = response.body;
  }
  else if (response.type == 'text/json') {
    // SuperAgent doesn't recognize text/json, only application/json, so handle this.
    data = JSON.parse(response.text);
  }
  else {
    // Not a parsable type. Just return the text.
    data = response.text;
  }
  
  if (data.isError) {
    // Handle app layer error payloads.
    var message = '';
  
    if (data.messages.length > 0) {
      message = data.messages[0].message.trim();
    }
    
    var error = new Error();
    error.code = 'EAPI';
    error.csid = data.csid;
    error.message = message + ' (' + error.code + ')';
  
    throw(error);
  }
  
  return data;
};

var normalizeRecordType = function(recordType) {
  if (recordType === 'collectionobject') {
    // The app layer calls collectionobject "cataloging".
    // TODO: This can be removed when using the services layer.
    recordType = 'cataloging';
  }
  
  return recordType;
};

var normalizeSearchOptions = function(searchOptions) {
  searchOptions = searchOptions || {};

  for (var option in DEFAULT_SEARCH_OPTIONS) {
    if (!(option in searchOptions)) {
      searchOptions[option] = DEFAULT_SEARCH_OPTIONS[option];
    }
  }
  
  if (!searchOptions.sortKey) {
    delete searchOptions.sortKey;
    delete searchOptions.sortDir;
  }
  
  return searchOptions;
};

var getAgent = function() {
  // In node.js, get an agent, and use it for all requests so it will maintain the session cookie.
  // In the browser, request.agent() does not exist. There is only one agent, the browser.

  return (('agent' in SuperAgent) ? SuperAgent.agent() : SuperAgent);
};

var isLoggedIn = function(connectionStatus) {
  return ('login' in connectionStatus && connectionStatus.login);
};

module.exports = CollectionSpace;